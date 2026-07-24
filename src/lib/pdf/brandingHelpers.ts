// Shared helpers for applying workspace branding to jsPDF generators.

/** Parse #rrggbb / #rgb into an [r,g,b] tuple. Returns null for invalid input. */
export function parseHexColor(hex?: string | null): [number, number, number] | null {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Load a logo URL as a base64 data URI suitable for jsPDF.addImage.
 * - Passes through existing `data:` URIs unchanged.
 * - Fetches http(s) URLs with a hard timeout.
 * - Never throws — returns null on any error so PDF generation continues.
 */
export async function loadLogoAsDataUrl(
  url?: string | null,
  timeoutMs = 5000
): Promise<string | null> {
  if (!url) return null;
  try {
    if (url.startsWith("data:")) return url;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timer)
    );
    if (!res.ok) {
      console.warn("[pdf-branding] logo fetch failed:", res.status, url);
      return null;
    }
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("[pdf-branding] logo load error:", err);
    return null;
  }
}

/** Detect jsPDF image format from a data URI. Defaults to PNG. */
export function detectImageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  const m = /^data:image\/(png|jpeg|jpg|webp)/i.exec(dataUrl);
  if (!m) return "PNG";
  const kind = m[1].toLowerCase();
  if (kind === "jpeg" || kind === "jpg") return "JPEG";
  if (kind === "webp") return "WEBP";
  return "PNG";
}