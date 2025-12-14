/**
 * PDF Metadata and Filename Utilities
 * Supports white-label PDF exports for agency use
 */

export interface PdfMetadataOptions {
  clientDomain?: string;
  clientName?: string;
  agencyName?: string;
  isWhiteLabel: boolean;
  reportType: "analysis" | "implementation" | "before-after";
}

/**
 * Report type display names for PDF titles
 */
const REPORT_TITLES: Record<string, string> = {
  "analysis": "Website Performance Audit",
  "implementation": "Implementation Strategy Pack",
  "before-after": "Website Transformation Report",
};

/**
 * Extract domain name from URL for use in filenames
 */
export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    // Remove www. prefix and get hostname
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    // If URL parsing fails, try to extract domain-like string
    const cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    return cleaned || "website";
  }
}

/**
 * Sanitize filename for safe filesystem use
 * Removes/replaces special characters that could cause issues
 */
export function sanitizeFilename(input: string): string {
  return input
    .trim()
    .replace(/[<>:"/\\|?*]/g, "") // Remove illegal filename characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Generate client identifier for filename (domain or name)
 */
export function getClientIdentifier(options: PdfMetadataOptions): string {
  // Prefer client name if provided, otherwise use domain
  if (options.clientName && options.clientName.trim()) {
    return sanitizeFilename(options.clientName.trim());
  }
  if (options.clientDomain) {
    return sanitizeFilename(extractDomainFromUrl(options.clientDomain));
  }
  return "website";
}

/**
 * Generate PDF filename based on client and report type
 * Format: {ClientDomain or ClientName} — Website Performance Report.pdf
 */
export function generatePdfFilename(options: PdfMetadataOptions): string {
  const clientId = getClientIdentifier(options);
  const reportTitle = REPORT_TITLES[options.reportType] || "Website Report";
  
  // Format: Website-Audit-[ClientDomain]-[Date].pdf for analysis
  if (options.reportType === "analysis") {
    const dateStr = new Date().toISOString().split("T")[0];
    return `Website-Audit-${clientId}-${dateStr}.pdf`;
  }
  
  return `${clientId} — ${reportTitle}.pdf`;
}

/**
 * Generate PDF document title for metadata
 */
export function generatePdfTitle(options: PdfMetadataOptions): string {
  const clientId = getClientIdentifier(options);
  const reportTitle = REPORT_TITLES[options.reportType] || "Website Report";
  return `${clientId} — ${reportTitle}`;
}

/**
 * Generate PDF author based on white-label mode
 */
export function generatePdfAuthor(options: PdfMetadataOptions): string {
  if (options.isWhiteLabel) {
    // White-label mode: use agency name or neutral fallback
    return options.agencyName?.trim() || "Prepared by Your Agency";
  }
  // Standard mode: use OptimizeMySuite
  return "OptimizeMySuite";
}

/**
 * Set PDF document properties/metadata
 */
export function setPdfMetadata(
  doc: { setProperties: (props: Record<string, string>) => void },
  options: PdfMetadataOptions
): void {
  const title = generatePdfTitle(options);
  const author = generatePdfAuthor(options);
  
  doc.setProperties({
    title,
    author,
    subject: "Website performance analysis and optimization summary",
    keywords: "website audit, SEO, conversion optimization, performance analysis",
    creator: author,
  });
}
