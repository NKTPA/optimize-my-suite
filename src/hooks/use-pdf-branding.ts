import { useWorkspace } from "@/contexts/WorkspaceContext";

/**
 * Builds the branding object passed into generateAnalysisPdf / generateImplementationPdf
 * from the current workspace. Only paid plans reach here with meaningful data:
 * - hasWhiteLabelPdf (Starter+): agencyName + footerText -> removes OMS wordmark.
 * - hasCustomBranding (Pro+): additionally logoUrl + primaryColor for the cover.
 * Returns undefined when nothing is set so the default OMS branding remains.
 */
export function usePdfBranding() {
  const { branding, limits } = useWorkspace();

  if (!branding) return undefined;

  const whiteLabel = limits.hasWhiteLabelPdf;
  const custom = limits.hasCustomBranding;

  const agencyName = whiteLabel ? (branding.agency_name || null) : null;
  const footerText = whiteLabel ? (branding.footer_text || null) : null;
  const logoUrl = custom ? (branding.logo_url || null) : null;
  const primaryColor = custom ? (branding.primary_color || null) : null;

  if (!agencyName && !footerText && !logoUrl && !primaryColor) return undefined;

  return { agencyName, footerText, logoUrl, primaryColor };
}