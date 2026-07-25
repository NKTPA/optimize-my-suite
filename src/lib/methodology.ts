// Methodology version constants for client-facing artifacts.
// MUST be kept in sync with the same constants in
// supabase/functions/analyze-website/index.ts. Bump the version whenever any
// scoring formula, signal weight, rubric, or category weighting changes.
// Audits produced under different versions are not directly comparable.
// Audits predating this constant are treated as version 1.0.
export const METHODOLOGY_VERSION = "2.0";
export const METHODOLOGY_VERSION_DATE = "2026-07-25";

function formatEffectiveDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return iso;
  }
}

/**
 * Returns a human-readable methodology line, e.g.
 * `Methodology version 2.0 (effective 25 July 2026)`.
 * Falls back to the module constants when either argument is missing.
 */
export function formatMethodologyLine(
  version?: string,
  effectiveDate?: string,
): string {
  const v = version && version.trim() ? version : METHODOLOGY_VERSION;
  const d = effectiveDate && effectiveDate.trim() ? effectiveDate : METHODOLOGY_VERSION_DATE;
  return `Methodology version ${v} (effective ${formatEffectiveDate(d)})`;
}