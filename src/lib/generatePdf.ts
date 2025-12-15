/**
 * Website Performance Audit PDF Generator
 * 
 * CRITICAL: PDF components must NEVER use fixed height for dynamic text.
 * All text containers must auto-expand vertically based on content length.
 * 
 * See src/pdf/PdfRegressionGuards.ts for forbidden patterns.
 */
import jsPDF from "jspdf";
import { AnalysisResult, FindingInput } from "@/types/analysis";
import { CREDIBILITY_BODY, CREDIBILITY_FOOTER } from "@/components/scoring/ScoreCredibilityStatement";
import { generatePdfFilename, setPdfMetadata, PdfMetadataOptions, extractDomainFromUrl } from "./pdfMetadata";

// Branding options for white-label PDFs
export interface AnalysisPdfBranding {
  logoUrl?: string | null;
  footerText?: string | null;
  agencyName?: string | null;
  clientName?: string | null;
}

// Premium consulting-grade color palette (RGB values)
const colors = {
  primary: [37, 99, 235], // Professional blue
  primaryDark: [30, 64, 175], // Deeper blue for headers
  primaryLight: [239, 246, 255], // Light blue background
  success: [22, 163, 74], // Green
  successLight: [240, 253, 244],
  warning: [217, 119, 6], // Amber (more muted)
  warningLight: [254, 252, 232],
  danger: [220, 38, 38], // Red (not alarming)
  dangerLight: [254, 242, 242],
  textPrimary: [15, 23, 42], // Slate 900
  textSecondary: [51, 65, 85], // Slate 700
  textMuted: [100, 116, 139], // Slate 500
  cardBg: [248, 250, 252], // Slate 50
  border: [226, 232, 240], // Slate 200
  white: [255, 255, 255],
  accent: [99, 102, 241], // Indigo accent
};

// Business impact descriptions for each category
const CATEGORY_BUSINESS_CONTEXT: Record<string, {
  impacts: string;
  whyMatters: string;
  lowScoreRisks: string;
  improvements: string;
}> = {
  messaging: {
    impacts: "First impressions, bounce rate, and visitor engagement",
    whyMatters: "Visitors decide within 3-5 seconds whether to stay or leave. Clear messaging ensures they understand your value instantly.",
    lowScoreRisks: "High bounce rates, confused visitors, missed opportunities to connect with qualified leads",
    improvements: "Stronger first impressions, lower bounce rate, increased time-on-site, and improved lead quality"
  },
  conversion: {
    impacts: "Lead generation, form completions, and revenue opportunities",
    whyMatters: "Even high-traffic websites fail without clear conversion paths. Every missing CTA is a missed customer.",
    lowScoreRisks: "Lost leads, poor form completion rates, unclear next steps for visitors",
    improvements: "Higher lead capture rates, more form submissions, clearer customer journey"
  },
  designUx: {
    impacts: "User trust, navigation ease, and professional credibility",
    whyMatters: "Design is often the first trust signal. Poor UX frustrates users and signals unprofessionalism.",
    lowScoreRisks: "Reduced trust, higher abandonment, perception of being outdated or unreliable",
    improvements: "Professional appearance, improved navigation, better user engagement"
  },
  mobile: {
    impacts: "Mobile traffic conversion, local search visibility, and user accessibility",
    whyMatters: "Over 60% of web traffic is mobile. Poor mobile experience directly impacts rankings and conversions.",
    lowScoreRisks: "Lost mobile customers, lower search rankings, frustrated users on phones and tablets",
    improvements: "Better mobile conversion rates, improved local SEO, accessible experience on all devices"
  },
  performance: {
    impacts: "Page speed, user patience, and search engine rankings",
    whyMatters: "Every second of delay reduces conversions by 7%. Speed is both a ranking factor and UX essential.",
    lowScoreRisks: "Higher bounce rates, lower search rankings, frustrated visitors who leave before content loads",
    improvements: "Faster load times, better SEO performance, improved user experience"
  },
  seo: {
    impacts: "Search visibility, organic traffic, and lead acquisition cost",
    whyMatters: "Organic search is often the largest traffic source. Poor SEO means invisible to potential customers.",
    lowScoreRisks: "Lower search rankings, reduced organic traffic, higher dependence on paid advertising",
    improvements: "Better search rankings, increased organic visibility, reduced customer acquisition costs"
  },
  trust: {
    impacts: "Customer confidence, conversion rates, and brand perception",
    whyMatters: "Trust signals convert browsers into buyers. Without credibility markers, visitors hesitate to take action.",
    lowScoreRisks: "Lower conversion rates, customer hesitation, lost sales to competitors with better trust signals",
    improvements: "Higher conversion rates, increased customer confidence, competitive advantage"
  },
  technical: {
    impacts: "Website reliability, accessibility, and search indexability",
    whyMatters: "Technical issues prevent search engines from properly indexing and users from accessing content.",
    lowScoreRisks: "Broken functionality, accessibility barriers, indexing problems affecting visibility",
    improvements: "Reliable functionality, better accessibility, improved search engine indexing"
  }
};

// Helper to get text from FindingInput
const getFindingText = (f: FindingInput): string =>
  typeof f === "string" ? f : f.text;

// Get color based on score (more muted for professional look)
const getScoreColor = (score: number): number[] => {
  if (score >= 70) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
};

const getScoreColorLight = (score: number): number[] => {
  if (score >= 70) return colors.successLight;
  if (score >= 50) return colors.warningLight;
  return colors.dangerLight;
};

const getGradeLabel = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Needs Attention";
};

const getGradeDescription = (score: number): string => {
  if (score >= 90) return "This website demonstrates strong performance across key evaluation criteria.";
  if (score >= 70) return "This website shows solid fundamentals with opportunities for targeted improvement.";
  if (score >= 50) return "This website has structural issues limiting its effectiveness. Focused improvements recommended.";
  return "This website requires attention in multiple areas that may be impacting business outcomes.";
};

// Sanitize finding text for professional presentation
const sanitizeFindingText = (text: string): string => {
  // Replace technical error messages with professional language
  const replacements: [RegExp, string][] = [
    [/could not (fully )?analyze/gi, "Limited data available from automated scan"],
    [/error\s*:?\s*/gi, "Note: "],
    [/failed to/gi, "Unable to"],
    [/cannot\s+/gi, "Unable to "],
    [/n\/a/gi, "Not available"],
    [/null|undefined/gi, "Not specified"],
  ];
  
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
};

export function generateAnalysisPdf(results: AnalysisResult, url: string, branding?: AnalysisPdfBranding) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let currentPage = 1;
  
  // Extract domain for display
  const clientDomain = extractDomainFromUrl(url);
  const clientDisplayName = branding?.clientName || clientDomain;
  
  // Determine if white-label mode is active
  const isWhiteLabel = Boolean(branding?.logoUrl || branding?.footerText || branding?.agencyName);
  const authorName = isWhiteLabel 
    ? (branding?.agencyName || branding?.footerText || "Your Agency") 
    : "OptimizeMySuite";

  const addNewPage = () => {
    addPageFooter();
    doc.addPage();
    currentPage++;
    y = 25;
  };

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - 35) {
      addNewPage();
    }
  };
  
  // Minimal, elegant page footer
  const addPageFooter = () => {
    // Subtle divider line
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    
    const footerText = branding?.footerText || (isWhiteLabel ? "" : "");
    if (footerText) {
      doc.text(footerText, margin, pageHeight - 8);
    }
    
    // Page number on right
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  };

  // Draw premium score indicator
  const drawScoreCircle = (x: number, centerY: number, score: number, size: number = 28) => {
    const scoreColor = getScoreColor(score);
    const bgColor = getScoreColorLight(score);
    
    // Outer glow effect
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.circle(x, centerY, size + 4, "F");
    
    // Main circle
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.circle(x, centerY, size, "F");
    
    // Score ring
    doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setLineWidth(4);
    doc.circle(x, centerY, size - 3, "S");
    
    // Score text
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(score.toString(), x, centerY + 3, { align: "center" });
    
    // Grade label
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(getGradeLabel(score).toUpperCase(), x, centerY + 12, { align: "center" });
  };

  // Draw score bar with gradient effect
  const drawScoreBar = (x: number, barY: number, width: number, score: number, height: number = 8) => {
    const scoreColor = getScoreColor(score);
    
    // Background bar
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(x, barY, width, height, 4, 4, "F");
    
    // Score bar
    const scoreWidth = Math.max((score / 100) * width, 8);
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(x, barY, scoreWidth, height, 4, 4, "F");
  };

  // ============ SAFE TEXT RENDERING HELPER ============
  // Universal component for all text that must auto-expand and never truncate
  const renderSafeText = (
    text: string,
    startX: number,
    maxWidth: number,
    options?: {
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      textColor?: number[];
      lineHeight?: number;
      bulletPrefix?: string;
      labelText?: string; // For "Label: Value" pattern - renders label bold on first line
    }
  ): number => {
    const fontSize = options?.fontSize || 9;
    const fontStyle = options?.fontStyle || "normal";
    const textColor = options?.textColor || colors.textSecondary;
    const lineHeight = options?.lineHeight || 4.5;
    
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    let textToRender = text;
    let labelWidth = 0;
    
    // Handle label:value pattern - label goes on its own line
    if (options?.labelText) {
      // Render label bold on its own line first
      doc.setFont("helvetica", "bold");
      doc.text(`${options.labelText}:`, startX, y);
      doc.setFont("helvetica", "normal");
      y += lineHeight;
      
      // Now render the value on subsequent lines
      textToRender = text;
    } else if (options?.bulletPrefix) {
      textToRender = `${options.bulletPrefix} ${text}`;
    }
    
    // Split text to fit within available width - NO TRUNCATION
    const lines = doc.splitTextToSize(textToRender, maxWidth);
    const totalHeight = lines.length * lineHeight;
    
    // Check if we need a new page BEFORE rendering the block
    // Keep entire block together if possible
    if (y + totalHeight > pageHeight - 35) {
      // If block fits on a fresh page, move to new page
      if (totalHeight < pageHeight - 60) {
        addNewPage();
      }
      // Otherwise we'll render what we can and continue on next page
    }
    
    // Render ALL lines - no slicing, no truncation
    lines.forEach((line: string, index: number) => {
      // Check if current line needs new page
      if (y + lineHeight > pageHeight - 35) {
        addNewPage();
      }
      doc.text(line, startX, y);
      y += lineHeight;
    });
    
    return totalHeight;
  };

  // ============ SAFE BULLET LIST RENDERER ============
  // Renders bullet lists that auto-expand and never truncate
  const renderBulletList = (
    items: string[],
    options?: {
      bulletStyle?: "circle" | "arrow" | "number";
      bulletColor?: number[];
      maxItems?: number; // Optional limit, but NO line truncation within items
    }
  ) => {
    const bulletColor = options?.bulletColor || colors.primary;
    const bulletStyle = options?.bulletStyle || "circle";
    const itemsToRender = options?.maxItems ? items.slice(0, options.maxItems) : items;
    
    itemsToRender.forEach((item, index) => {
      const text = sanitizeFindingText(item);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      // Calculate block height first
      const lines = doc.splitTextToSize(text, contentWidth - 20);
      const blockHeight = lines.length * 4.5 + 4;
      
      // Check if entire block fits, if not and it would fit on fresh page, add new page
      if (y + blockHeight > pageHeight - 35 && blockHeight < pageHeight - 60) {
        addNewPage();
      }
      
      // Draw bullet
      if (bulletStyle === "circle") {
        doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
        doc.circle(margin + 5, y + 1, 2, "F");
      } else if (bulletStyle === "number") {
        doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
        doc.circle(margin + 6, y + 1, 5, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text((index + 1).toString(), margin + 6, y + 3, { align: "center" });
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
      }
      
      // Render ALL lines of text - no truncation
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      lines.forEach((line: string, lineIndex: number) => {
        if (y + 4.5 > pageHeight - 35) {
          addNewPage();
        }
        const xOffset = bulletStyle === "number" ? 16 : 12;
        doc.text(line, margin + xOffset, y + 3 + lineIndex * 4.5);
      });
      
      y += blockHeight;
    });
  };

  // Premium section header with business context
  const addCategorySection = (
    title: string, 
    score: number, 
    categoryKey: string,
    findings: FindingInput[],
    recommendations?: string[]
  ) => {
    addPageIfNeeded(75);
    
    const context = CATEGORY_BUSINESS_CONTEXT[categoryKey];
    
    // Section header card
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, y - 5, contentWidth, 45, 4, 4, "F");
    
    // Left accent bar
    const scoreColor = getScoreColor(score);
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.rect(margin, y - 5, 4, 45, "F");
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(title, margin + 12, y + 5);
    
    // Score display
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${score}`, pageWidth - margin - 25, y + 5, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("/100", pageWidth - margin - 10, y + 5, { align: "right" });
    
    // Score bar
    drawScoreBar(margin + 12, y + 12, contentWidth - 70, score, 6);
    
    // Business impact subtitle
    if (context) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(`Impacts: ${context.impacts}`, margin + 12, y + 28);
    }
    
    y += 50;
    
    // Why This Matters box - dynamically sized based on content
    if (context && score < 70) {
      const whyLines = doc.splitTextToSize(context.whyMatters, contentWidth - 16);
      const whyBoxHeight = whyLines.length * 4.5 + 16;
      
      addPageIfNeeded(whyBoxHeight + 5);
      
      doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
      doc.roundedRect(margin, y - 3, contentWidth, whyBoxHeight, 3, 3, "F");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text("Why This Matters", margin + 8, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      
      // Render ALL lines - no truncation
      whyLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 8, y + 13 + i * 4.5);
      });
      
      y += whyBoxHeight + 4;
    }
    
    // Findings - render ALL findings with ALL lines
    if (findings.length > 0) {
      findings.forEach((f) => {
        const text = sanitizeFindingText(getFindingText(f));
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        const lines = doc.splitTextToSize(text, contentWidth - 20);
        const blockHeight = lines.length * 4.5 + 6;
        
        // Try to keep block together
        if (y + blockHeight > pageHeight - 35 && blockHeight < pageHeight - 60) {
          addNewPage();
        }
        
        // Bullet point
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.circle(margin + 5, y + 3, 2, "F");
        
        // Render ALL lines - no truncation
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        lines.forEach((line: string, index: number) => {
          if (y + 5 + index * 4.5 > pageHeight - 35) {
            addNewPage();
            // Re-render from current line
          }
          doc.text(line, margin + 12, y + 5 + index * 4.5);
        });
        y += blockHeight;
      });
    }
    
    // Recommendations - render ALL with NO truncation
    if (recommendations && recommendations.length > 0) {
      y += 3;
      
      recommendations.forEach((r) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);

        const textStartX = margin + 4;
        const availableWidth = contentWidth - 8;

        // Check for label:value patterns (Recommended Headline, Subheadline, Title, Meta, Keywords)
        const labelPatterns = [
          "Recommended Headline:",
          "Recommended Subheadline:",
          "Recommended Title:",
          "Recommended Meta:",
          "Target Keywords:"
        ];
        
        const matchedLabel = labelPatterns.find(pattern => r.startsWith(pattern));

        if (matchedLabel) {
          const label = matchedLabel.replace(":", "");
          const value = r.substring(matchedLabel.length).trim();

          const valueLines = doc.splitTextToSize(value, availableWidth);
          const blockHeight = (1 + valueLines.length) * 4.5 + 4;
          
          // Try to keep block together
          if (y + blockHeight > pageHeight - 35 && blockHeight < pageHeight - 60) {
            addNewPage();
          }

          // Label on its own line, bold
          doc.setFont("helvetica", "bold");
          doc.text(`${label}:`, textStartX, y);
          doc.setFont("helvetica", "normal");
          y += 4.5;

          // Value on following lines - ALL lines, no truncation
          valueLines.forEach((line: string, index: number) => {
            if (y > pageHeight - 35) {
              addNewPage();
            }
            doc.text(line, textStartX, y);
            y += 4.5;
          });

          y += 2;
        } else {
          // Regular recommendation with arrow
          const lines = doc.splitTextToSize(`→ ${r}`, availableWidth);
          const blockHeight = lines.length * 4.5 + 4;
          
          // Try to keep block together
          if (y + blockHeight > pageHeight - 35 && blockHeight < pageHeight - 60) {
            addNewPage();
          }

          // Render ALL lines - no truncation
          lines.forEach((line: string, index: number) => {
            if (y > pageHeight - 35) {
              addNewPage();
            }
            doc.text(line, textStartX, y);
            y += 4.5;
          });

          y += 2;
        }
      });
    }
    
    y += 8;
  };

  // ============ PAGE 1: EXECUTIVE COVER ============
  
  // Full-page premium header
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, 85, "F");
  
  // Accent stripe
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(0, 85, pageWidth, 3, "F");
  
  // Main title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Performance Audit", pageWidth / 2, 38, { align: "center" });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Objective Website Analysis Using Consistent Scoring Criteria", pageWidth / 2, 52, { align: "center" });
  
  // Divider
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 62, pageWidth / 2 + 40, 62);
  
  // URL
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(clientDomain, pageWidth / 2, 74, { align: "center" });
  
  y = 105;
  
  // Client/Agency info box
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y, contentWidth, 50, 4, 4, "F");
  
  // Left column
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("PREPARED FOR", margin + 12, y + 14);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(clientDisplayName, margin + 12, y + 26);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(url.substring(0, 50), margin + 12, y + 36);
  
  // Right column
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("PREPARED BY", pageWidth / 2 + 10, y + 14);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(authorName, pageWidth / 2 + 10, y + 26);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageWidth / 2 + 10, y + 36);
  
  y += 65;
  
  // Overall Score Display
  const overallScore = results.summary.overallScore;
  drawScoreCircle(pageWidth / 2, y + 35, overallScore, 35);
  
  y += 80;
  
  // Score label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("OVERALL PERFORMANCE SCORE", pageWidth / 2, y, { align: "center" });
  
  y += 20;
  
  // Score interpretation
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y - 5, contentWidth, 35, 4, 4, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const gradeDesc = getGradeDescription(overallScore);
  const gradeLines = doc.splitTextToSize(gradeDesc, contentWidth - 20);
  gradeLines.forEach((line: string, i: number) => {
    doc.text(line, pageWidth / 2, y + 7 + i * 5, { align: "center" });
  });
  
  addPageFooter();
  
  // ============ PAGE 2: EXECUTIVE SUMMARY ============
  addNewPage();
  
  // Section header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Executive Summary", margin, y);
  
  // Accent line
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, y + 5, 50, 2, "F");
  
  y += 20;
  
  // Overview paragraph
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  
  // Build executive summary based on score and findings
  let executiveSummary = results.summary.overview;
  if (overallScore < 50) {
    executiveSummary = `This audit identifies several structural issues that may reduce conversion efficiency, search visibility, and trust. While the site is functional, it underperforms relative to industry standards and may fail to clearly communicate value within the critical first impression window. ${executiveSummary}`;
  } else if (overallScore < 70) {
    executiveSummary = `This audit reveals opportunities for improvement across key performance areas. The website has a solid foundation but would benefit from targeted optimizations to increase lead capture and search visibility. ${executiveSummary}`;
  } else {
    executiveSummary = `This website demonstrates strong fundamentals across most evaluation criteria. The following analysis highlights areas performing well and opportunities for continued optimization. ${executiveSummary}`;
  }
  
  const summaryLines = doc.splitTextToSize(executiveSummary, contentWidth);
  // Render ALL summary lines - no truncation
  summaryLines.forEach((line: string, i: number) => {
    if (y + i * 6 > pageHeight - 35) {
      addNewPage();
    }
    doc.text(line, margin, y + i * 6);
  });
  
  y += summaryLines.length * 6 + 15;
  
  // Category scores overview grid
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Performance by Category", margin, y);
  y += 12;
  
  const categories = [
    { name: "Messaging", score: results.messaging.score },
    { name: "Conversion", score: results.conversion.score },
    { name: "Design & UX", score: results.designUx.score },
    { name: "Mobile", score: results.mobile.score },
    { name: "Performance", score: results.performance.score },
    { name: "SEO", score: results.seo.score },
    { name: "Trust", score: results.trust.score },
  ];
  
  // Two-column layout
  const colWidth = (contentWidth - 10) / 2;
  categories.forEach((cat, index) => {
    const col = index % 2;
    const xPos = margin + col * (colWidth + 10);
    
    if (col === 0 && index > 0) y += 18;
    
    // Category name
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(cat.name, xPos, y);
    
    // Score bar
    drawScoreBar(xPos, y + 4, colWidth - 30, cat.score, 6);
    
    // Score number
    const scoreColor = getScoreColor(cat.score);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${cat.score}`, xPos + colWidth - 15, y, { align: "right" });
  });
  
  y += 30;
  
  // Key risks section (if score < 70)
  if (overallScore < 70) {
    addPageIfNeeded(50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text("Primary Risk Areas", margin, y);
    y += 10;
    
    // Find lowest scoring categories
    const sortedCats = [...categories].sort((a, b) => a.score - b.score);
    const risks = sortedCats.slice(0, 3);
    
    risks.forEach((risk) => {
      const context = CATEGORY_BUSINESS_CONTEXT[risk.name.toLowerCase().replace(/\s*&\s*/g, "").replace("ux", "Ux")];
      addPageIfNeeded(15);
      
      doc.setFillColor(colors.dangerLight[0], colors.dangerLight[1], colors.dangerLight[2]);
      doc.roundedRect(margin, y - 3, contentWidth, 12, 2, 2, "F");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
      doc.text(`${risk.name}: ${risk.score}/100`, margin + 5, y + 5);
      
      if (context) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        const riskText = doc.splitTextToSize(` — ${context.lowScoreRisks}`, contentWidth - 60);
        doc.text(riskText[0] || "", margin + 55, y + 5);
      }
      
      y += 16;
    });
  }
  
  y += 10;
  
  // ============ IMMEDIATE OPPORTUNITIES (Quick Wins) ============
  addPageIfNeeded(60);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Immediate Opportunities", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("High Impact, Low Effort Improvements", margin, y + 8);
  
  y += 18;
  
  results.summary.quickWins.slice(0, 5).forEach((win, index) => {
    const winLines = doc.splitTextToSize(win, contentWidth - 30);
    // Dynamic card height based on ALL lines - no truncation
    const cardHeight = winLines.length * 5 + 12;
    
    // Try to keep entire card together
    if (y + cardHeight > pageHeight - 35 && cardHeight < pageHeight - 60) {
      addNewPage();
    }
    
    // Card background - sized to fit ALL content
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.roundedRect(margin, y - 3, contentWidth, cardHeight, 3, 3, "F");
    
    // Number badge
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 10, y + 5, 6, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text((index + 1).toString(), margin + 10, y + 7, { align: "center" });
    
    // Win text - render ALL lines, no truncation
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    winLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 22, y + 5 + i * 5);
    });
    
    y += cardHeight + 4;
  });
  
  // ============ SCORE INTERPRETATION PANEL ============
  addNewPage();
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("How to Interpret This Score", margin, y);
  
  y += 15;
  
  // Interpretation box
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, y - 5, contentWidth, 75, 4, 4, "F");
  
  // Left accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, y - 5, 4, 75, "F");
  
  const interpretationPoints = [
    "Scores are criteria-based, not subjective opinions",
    "No manual adjustments are made to any scores",
    "The same methodology is applied before and after improvements",
    "Pages that cannot be accessed publicly are marked 'Not Scorable' rather than penalized",
    "Missing or unavailable data is treated conservatively, never inflated"
  ];
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  
  interpretationPoints.forEach((point, i) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 15, y + 6 + i * 13, 2, "F");
    doc.text(point, margin + 22, y + 8 + i * 13);
  });
  
  y += 90;
  
  // Score scale reference
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Score Scale Reference", margin, y);
  y += 12;
  
  const scoreScales = [
    { range: "90-100", label: "Excellent", color: colors.success, desc: "Strong performance across all criteria" },
    { range: "70-89", label: "Good", color: colors.success, desc: "Solid foundation with optimization opportunities" },
    { range: "50-69", label: "Needs Work", color: colors.warning, desc: "Structural issues limiting effectiveness" },
    { range: "0-49", label: "Needs Attention", color: colors.danger, desc: "Multiple areas requiring immediate focus" },
  ];
  
  scoreScales.forEach((scale) => {
    doc.setFillColor(scale.color[0], scale.color[1], scale.color[2]);
    doc.roundedRect(margin, y - 2, 50, 12, 2, 2, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${scale.range}: ${scale.label}`, margin + 25, y + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(scale.desc, margin + 58, y + 5);
    
    y += 16;
  });
  
  y += 15;
  
  // ============ CATEGORY BREAKDOWNS ============
  
  addCategorySection(
    "Messaging & Offer Clarity",
    results.messaging.score,
    "messaging",
    results.messaging.findings,
    [
      `Recommended Headline: ${results.messaging.recommendedHeadline}`,
      `Recommended Subheadline: ${results.messaging.recommendedSubheadline}`
    ]
  );
  
  addCategorySection(
    "Conversion & Lead Capture",
    results.conversion.score,
    "conversion",
    results.conversion.findings,
    results.conversion.recommendations
  );
  
  addCategorySection(
    "Design & User Experience",
    results.designUx.score,
    "designUx",
    results.designUx.findings,
    results.designUx.recommendations
  );
  
  addCategorySection(
    "Mobile Experience",
    results.mobile.score,
    "mobile",
    results.mobile.findings,
    results.mobile.recommendations
  );
  
  addCategorySection(
    "Speed & Performance",
    results.performance.score,
    "performance",
    results.performance.findings,
    results.performance.recommendations
  );
  
  addCategorySection(
    "SEO & Local Search",
    results.seo.score,
    "seo",
    results.seo.findings,
    [
      `Recommended Title: ${results.seo.recommendedTitle}`,
      `Recommended Meta: ${results.seo.recommendedMetaDescription}`,
      `Target Keywords: ${results.seo.keywords.join(", ")}`
    ]
  );
  
  addCategorySection(
    "Trust & Credibility",
    results.trust.score,
    "trust",
    results.trust.findings,
    results.trust.whyChooseUs
  );
  
  // Technical (no score)
  addPageIfNeeded(50);
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y - 5, contentWidth, 25, 4, 4, "F");
  doc.setFillColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.rect(margin, y - 5, 4, 25, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Technical Fundamentals", margin + 12, y + 8);
  
  y += 30;
  
  // Technical findings - render ALL lines, no truncation
  results.technical.findings.forEach((f) => {
    const text = sanitizeFindingText(getFindingText(f));
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const lines = doc.splitTextToSize(text, contentWidth - 15);
    const blockHeight = lines.length * 4.5 + 4;
    
    // Try to keep block together
    if (y + blockHeight > pageHeight - 35 && blockHeight < pageHeight - 60) {
      addNewPage();
    }
    
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 5, y + 1, 2, "F");
    
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    // Render ALL lines - no truncation
    lines.forEach((line: string, i: number) => {
      if (y + 3 + i * 4.5 > pageHeight - 35) {
        addNewPage();
      }
      doc.text(line, margin + 12, y + 3 + i * 4.5);
    });
    y += blockHeight;
  });
  
  // Technical recommendations - render ALL lines, no truncation
  results.technical.recommendations.forEach((r) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    
    const lines = doc.splitTextToSize(`→ ${r}`, contentWidth - 10);
    const blockHeight = lines.length * 4.5 + 2;
    
    // Try to keep block together
    if (y + blockHeight > pageHeight - 35 && blockHeight < pageHeight - 60) {
      addNewPage();
    }
    
    // Render ALL lines - no truncation
    lines.forEach((line: string, i: number) => {
      if (y + i * 4.5 > pageHeight - 35) {
        addNewPage();
      }
      doc.text(line, margin + 8, y + i * 4.5);
    });
    y += blockHeight;
  });
  
  // ============ WHAT THIS AUDIT ENABLES (Agency Positioning) ============
  addNewPage();
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What This Audit Enables", margin, y);
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, y + 5, 60, 2, "F");
  
  y += 20;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("This analysis provides the foundation for strategic improvements across several areas:", margin, y);
  
  y += 15;
  
  const enablesItems = [
    {
      title: "Website Redesign Justification",
      desc: "Data-driven evidence to support investment in website improvements with clear before/after benchmarks"
    },
    {
      title: "SEO Strategy Development",
      desc: "Identified gaps in search optimization that can be addressed through targeted SEO work"
    },
    {
      title: "Conversion Rate Optimization",
      desc: "Clear opportunities to improve lead capture and reduce friction in the customer journey"
    },
    {
      title: "Ongoing Performance Monitoring",
      desc: "Baseline metrics to measure improvement over time and demonstrate ROI"
    }
  ];
  
  enablesItems.forEach((item) => {
    // Calculate dynamic card height based on ALL content
    const descLines = doc.splitTextToSize(item.desc, contentWidth - 28);
    const cardHeight = 14 + descLines.length * 4 + 6;
    
    // Try to keep entire card together
    if (y + cardHeight > pageHeight - 35 && cardHeight < pageHeight - 60) {
      addNewPage();
    }
    
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, y - 3, contentWidth, cardHeight, 3, 3, "F");
    
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 10, y + 8, 4, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("✓", margin + 10, y + 10, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(item.title, margin + 20, y + 6);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    // Render ALL description lines - no truncation
    descLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 20, y + 14 + i * 4);
    });
    
    y += cardHeight + 5;
  });
  
  // ============ METHODOLOGY CREDIBILITY ============
  y += 10;
  addPageIfNeeded(60);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Scoring Methodology", margin, y);
  y += 10;
  
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  const credLines = doc.splitTextToSize(CREDIBILITY_BODY, contentWidth - 16);
  const credHeight = credLines.length * 4.5 + 20;
  doc.roundedRect(margin, y - 3, contentWidth, credHeight, 4, 4, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  credLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 8, y + 8 + i * 4.5);
  });
  
  y += credHeight - 8;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(CREDIBILITY_FOOTER, margin + 8, y);
  
  // Final footer
  addPageFooter();

  // Set PDF metadata
  const metadataOptions: PdfMetadataOptions = {
    clientDomain: url,
    clientName: branding?.clientName,
    agencyName: branding?.agencyName || branding?.footerText || undefined,
    isWhiteLabel,
    reportType: "analysis",
  };
  setPdfMetadata(doc, metadataOptions);
  
  // Generate filename
  const filename = generatePdfFilename(metadataOptions);
  doc.save(filename);
}
