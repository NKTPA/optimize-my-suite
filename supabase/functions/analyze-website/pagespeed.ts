// Google PageSpeed Insights fetcher.
// Resilient: never throws. Returns null on any failure so it cannot
// block or delay the rest of the audit.

export interface PageSpeedResult {
  performanceScore: number;
  lcpMs: number | null;
  clsValue: number | null;
  tbtMs: number | null;
  speedIndexMs: number | null;
  fieldDataAvailable: boolean;
  fieldLcpMs?: number | null;
  fieldInpMs?: number | null;
  fieldClsValue?: number | null;
}

function log(step: string, details?: unknown) {
  const s = details ? `: ${JSON.stringify(details)}` : "";
  console.log(`[pagespeed] ${step}${s}`);
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

async function fetchPageSpeedOnce(url: string, attempt: number): Promise<PageSpeedResult | null> {
  const controller = new AbortController();
  const TIMEOUT_MS = 60_000;
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();
  const apiKey = Deno.env.get("PAGESPEED_API_KEY");
  const hasApiKey = Boolean(apiKey);
  let httpStatus: number | null = null;

  try {
    const params = new URLSearchParams({
      url,
      strategy: "mobile",
      category: "performance",
    });
    if (apiKey) params.append("key", apiKey);

    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    const response = await fetch(endpoint, {
      method: "GET",
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    httpStatus = response.status;

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      console.error(JSON.stringify({
        source: "PSI",
        url,
        httpStatus,
        errorMessage: bodyText.slice(0, 500) || `HTTP ${response.status}`,
        elapsedMs: Date.now() - startedAt,
        hasApiKey,
      }));
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
      console.error(JSON.stringify({
        source: "PSI",
        url,
        httpStatus,
        errorMessage: "parse failure: empty or invalid JSON",
        elapsedMs: Date.now() - startedAt,
        hasApiKey,
      }));
      return null;
    }

    const lighthouse = (data as any).lighthouseResult ?? {};
    const categories = lighthouse.categories ?? {};
    const perfCat = categories.performance ?? {};
    const audits = lighthouse.audits ?? {};

    const performanceScore = Math.round(((num(perfCat.score) ?? 0) as number) * 100);
    const lcpMs = num(audits["largest-contentful-paint"]?.numericValue);
    const clsValue = num(audits["cumulative-layout-shift"]?.numericValue);
    const tbtMs = num(audits["total-blocking-time"]?.numericValue);
    const speedIndexMs = num(audits["speed-index"]?.numericValue);

    const loadingExperience = (data as any).loadingExperience ?? {};
    const metrics = loadingExperience.metrics ?? {};
    const fieldDataAvailable = metrics && typeof metrics === "object" && Object.keys(metrics).length > 0;

    const result: PageSpeedResult = {
      performanceScore,
      lcpMs,
      clsValue,
      tbtMs,
      speedIndexMs,
      fieldDataAvailable,
    };

    if (fieldDataAvailable) {
      const fieldLcp = num(metrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile);
      const fieldInp = num(metrics.INTERACTION_TO_NEXT_PAINT?.percentile);
      const fieldClsRaw = num(metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile);
      // Google returns CLS field percentile as value * 100 (integer). Convert to decimal.
      const fieldCls = fieldClsRaw !== null ? fieldClsRaw / 100 : null;

      if (fieldLcp !== null) result.fieldLcpMs = fieldLcp;
      if (fieldInp !== null) result.fieldInpMs = fieldInp;
      if (fieldCls !== null) result.fieldClsValue = fieldCls;
    }

    console.log(JSON.stringify({
      source: "PSI",
      attempt,
      score: result.performanceScore,
      elapsedMs: Date.now() - startedAt,
    }));

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("aborted") || (err as any)?.name === "AbortError";
    console.error(JSON.stringify({
      source: "PSI",
      attempt,
      url,
      httpStatus,
      errorMessage: isTimeout ? `timeout after ${TIMEOUT_MS}ms` : msg,
      elapsedMs: Date.now() - startedAt,
      hasApiKey,
    }));
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Runs PSI 3 times sequentially, picks the median-scoring successful run for
// its full metric set. If only 2 succeed, uses the lower (conservative). If 1,
// uses it. If 0, returns null so the caller's estimated fallback engages.
export async function fetchPageSpeed(url: string): Promise<PageSpeedResult | null> {
  const ATTEMPTS = 3;
  const results: PageSpeedResult[] = [];
  for (let i = 1; i <= ATTEMPTS; i++) {
    const r = await fetchPageSpeedOnce(url, i);
    if (r) results.push(r);
  }

  if (results.length === 0) return null;
  if (results.length === 1) return results[0];

  // Pick the run whose score is the median (2 successes → lower of the two).
  const sorted = [...results].sort((a, b) => a.performanceScore - b.performanceScore);
  const chosen = results.length === 2 ? sorted[0] : sorted[1];

  console.log(JSON.stringify({
    source: "PSI",
    summary: "median-selected",
    successes: results.length,
    scores: results.map((r) => r.performanceScore),
    chosenScore: chosen.performanceScore,
  }));

  return chosen;
}