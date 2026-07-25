// Methodology version constants for client-facing artifacts.
// MUST be kept in sync with the same constants in
// supabase/functions/analyze-website/index.ts. Bump the version whenever any
// scoring formula, signal weight, rubric, or category weighting changes.
// Audits produced under different versions are not directly comparable.
// Audits predating this constant are treated as version 1.0.
export const METHODOLOGY_VERSION = "2.1";
export const METHODOLOGY_VERSION_DATE = "2026-07-25";

/**
 * METHODOLOGY_VERSION_DATE is a date-only string (e.g. "2026-07-25"). To avoid
 * timezone shifts moving the calendar date, we anchor the instant at midday UTC
 * before rendering it in America/New_York, which is the project's canonical
 * timezone for client-facing artifacts.
 */
function formatEffectiveDate(iso: string): string {
  const trimmed = iso.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return trimmed;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const d = new Date(Date.UTC(year, month - 1, day, 12));
  if (isNaN(d.getTime())) return trimmed;

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/New_York",
    }).format(d);
  } catch {
    return trimmed;
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