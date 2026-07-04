// Deterministic HTML signal extraction. No LLM. All HTML is untrusted:
// we only read text/attributes and never execute or eval script content.
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

export interface ParsedSignals {
  h1Count: number;
  h1Text: string | null;
  titleText: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonicalHref: string | null;
  imageCount: number;
  imagesMissingAlt: number;
  altCoveragePct: number;
  externalScriptCount: number;
  maxFormFieldCount: number;
  hasViewportMeta: boolean;
  schemaTypes: string[];
  hasOgTitle: boolean;
  hasOgImage: boolean;
  usesWebP: boolean;
  hasTapToCallLink: boolean;
  bodyTextLength: number;
  isLikelySPA: boolean;
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    const v = fn();
    return v === undefined || v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function parseSiteSignals(html: string, _url: string): ParsedSignals {
  const defaults: ParsedSignals = {
    h1Count: 0,
    h1Text: null,
    titleText: null,
    titleLength: 0,
    metaDescription: null,
    metaDescriptionLength: 0,
    canonicalHref: null,
    imageCount: 0,
    imagesMissingAlt: 0,
    altCoveragePct: 0,
    externalScriptCount: 0,
    maxFormFieldCount: 0,
    hasViewportMeta: false,
    schemaTypes: [],
    hasOgTitle: false,
    hasOgImage: false,
    usesWebP: false,
    hasTapToCallLink: false,
    bodyTextLength: 0,
    isLikelySPA: false,
  };

  let doc: ReturnType<DOMParser["parseFromString"]> | null = null;
  try {
    doc = new DOMParser().parseFromString(html ?? "", "text/html");
  } catch {
    return defaults;
  }
  if (!doc) return defaults;

  const h1s = safe(() => Array.from(doc!.querySelectorAll("h1")) as Element[], [] as Element[]);
  const h1Count = safe(() => h1s.length, 0);
  const h1Text = safe(() => {
    const t = h1s[0]?.textContent?.trim() ?? "";
    return t.length ? t : null;
  }, null as string | null);

  const titleText = safe(() => {
    const t = doc!.querySelector("title")?.textContent?.trim() ?? "";
    return t.length ? t : null;
  }, null as string | null);
  const titleLength = safe(() => (titleText ?? "").length, 0);

  const metaDescription = safe(() => {
    const el = doc!.querySelector('meta[name="description" i]') as Element | null;
    const c = el?.getAttribute("content")?.trim() ?? "";
    return c.length ? c : null;
  }, null as string | null);
  const metaDescriptionLength = safe(() => (metaDescription ?? "").length, 0);

  const canonicalHref = safe(() => {
    const el = doc!.querySelector('link[rel="canonical" i]') as Element | null;
    const h = el?.getAttribute("href")?.trim() ?? "";
    return h.length ? h : null;
  }, null as string | null);

  const imgs = safe(() => Array.from(doc!.querySelectorAll("img")) as Element[], [] as Element[]);
  const imageCount = safe(() => imgs.length, 0);
  const imagesMissingAlt = safe(
    () => imgs.filter((i) => {
      try {
        const a = i.getAttribute("alt");
        return a === null || a.trim() === "";
      } catch { return false; }
    }).length,
    0,
  );
  const altCoveragePct = safe(
    () => (imageCount > 0 ? Math.round(((imageCount - imagesMissingAlt) / imageCount) * 100) : 0),
    0,
  );

  const externalScriptCount = safe(() => {
    const scripts = Array.from(doc!.querySelectorAll("script[src]")) as Element[];
    return scripts.filter((s) => {
      try {
        const src = s.getAttribute("src") ?? "";
        return src.length > 0;
      } catch { return false; }
    }).length;
  }, 0);

  const maxFormFieldCount = safe(() => {
    const forms = Array.from(doc!.querySelectorAll("form")) as Element[];
    let max = 0;
    for (const f of forms) {
      try {
        const n = f.querySelectorAll("input, select, textarea").length;
        if (n > max) max = n;
      } catch { /* skip */ }
    }
    return max;
  }, 0);

  const hasViewportMeta = safe(
    () => !!doc!.querySelector('meta[name="viewport" i]'),
    false,
  );

  const schemaTypes = safe(() => {
    const out: string[] = [];
    const nodes = Array.from(doc!.querySelectorAll('script[type="application/ld+json" i]')) as Element[];
    for (const n of nodes) {
      try {
        const raw = n.textContent ?? "";
        if (!raw.trim()) continue;
        const parsed = JSON.parse(raw);
        const collect = (obj: unknown) => {
          if (!obj || typeof obj !== "object") return;
          if (Array.isArray(obj)) { obj.forEach(collect); return; }
          const t = (obj as Record<string, unknown>)["@type"];
          if (typeof t === "string") out.push(t);
          else if (Array.isArray(t)) t.forEach((v) => typeof v === "string" && out.push(v));
          const graph = (obj as Record<string, unknown>)["@graph"];
          if (Array.isArray(graph)) graph.forEach(collect);
        };
        collect(parsed);
      } catch { /* ignore malformed JSON-LD */ }
    }
    return Array.from(new Set(out));
  }, [] as string[]);

  const hasOgTitle = safe(
    () => !!doc!.querySelector('meta[property="og:title" i]'),
    false,
  );
  const hasOgImage = safe(
    () => !!doc!.querySelector('meta[property="og:image" i]'),
    false,
  );

  const usesWebP = safe(() => {
    for (const i of imgs) {
      try {
        const src = i.getAttribute("src") ?? "";
        const srcset = i.getAttribute("srcset") ?? "";
        if (src.toLowerCase().includes(".webp") || srcset.toLowerCase().includes(".webp")) return true;
      } catch { /* skip */ }
    }
    try {
      const sources = Array.from(doc!.querySelectorAll("source")) as Element[];
      for (const s of sources) {
        const srcset = s.getAttribute("srcset") ?? "";
        if (srcset.toLowerCase().includes(".webp")) return true;
      }
    } catch { /* skip */ }
    return false;
  }, false);

  const hasTapToCallLink = safe(() => {
    const links = Array.from(doc!.querySelectorAll("a[href]")) as Element[];
    return links.some((a) => {
      try {
        return (a.getAttribute("href") ?? "").trim().toLowerCase().startsWith("tel:");
      } catch { return false; }
    });
  }, false);

  const bodyTextLength = safe(() => {
    const t = doc!.querySelector("body")?.textContent ?? "";
    return t.trim().length;
  }, 0);

  const isLikelySPA = bodyTextLength < 400 && externalScriptCount > 5;

  return {
    h1Count,
    h1Text,
    titleText,
    titleLength,
    metaDescription,
    metaDescriptionLength,
    canonicalHref,
    imageCount,
    imagesMissingAlt,
    altCoveragePct,
    externalScriptCount,
    maxFormFieldCount,
    hasViewportMeta,
    schemaTypes,
    hasOgTitle,
    hasOgImage,
    usesWebP,
    hasTapToCallLink,
    bodyTextLength,
    isLikelySPA,
  };
}