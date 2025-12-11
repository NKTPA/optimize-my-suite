export interface ParsedCSVRow {
  url: string;
  name?: string;
}

export function parseCSV(csvText: string): ParsedCSVRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Parse header row
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  
  const urlIndex = headers.findIndex((h) => h === "url" || h === "website" || h === "site");
  const nameIndex = headers.findIndex((h) => h === "name" || h === "company" || h === "business");

  if (urlIndex === -1) {
    throw new Error("CSV must have a 'url' column");
  }

  const results: ParsedCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles basic cases)
    const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
    
    const url = values[urlIndex]?.trim();
    if (!url) continue;

    // Basic URL validation
    try {
      let testUrl = url;
      if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
        testUrl = "https://" + testUrl;
      }
      new URL(testUrl);
    } catch {
      continue; // Skip invalid URLs
    }

    results.push({
      url,
      name: nameIndex !== -1 ? values[nameIndex]?.trim() || undefined : undefined,
    });
  }

  return results;
}

export function generateSummaryCSV(
  sites: Array<{
    url: string;
    name?: string;
    status: string;
    overallScore?: number;
    mainQuickWin?: string;
  }>
): string {
  const headers = ["url", "name", "status", "overallScore", "mainQuickWin"];
  const rows = sites.map((site) => [
    site.url,
    site.name || "",
    site.status,
    site.overallScore?.toString() || "",
    site.mainQuickWin?.replace(/,/g, ";") || "",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
