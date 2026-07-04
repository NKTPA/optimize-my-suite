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

export async function fetchPageSpeed(url: string): Promise<PageSpeedResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    const apiKey = Deno.env.get("PAGESPEED_API_KEY");
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

    if (!response.ok) {
      log("non-200 response", { status: response.status });
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
      log("parse failure: empty or invalid JSON");
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

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("aborted") || (err as any)?.name === "AbortError") {
      log("timeout after 45s");
    } else {
      log("fetch error", { error: msg });
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}