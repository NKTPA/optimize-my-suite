import jsPDF from "jspdf";
import { AnalysisResult } from "@/types/analysis";

export function generateAnalysisPdf(results: AnalysisResult, url: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text: string) => {
    addPageIfNeeded(15);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(text, margin, y);
    y += 8;
  };

  const addSubtitle = (text: string) => {
    addPageIfNeeded(10);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(text, margin, y);
    y += 6;
  };

  const addText = (text: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      addPageIfNeeded(6);
      doc.text(line, margin + indent, y);
      y += 5;
    });
    y += 2;
  };

  const addBullet = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const lines = doc.splitTextToSize(text, contentWidth - 10);
    lines.forEach((line: string, index: number) => {
      addPageIfNeeded(6);
      if (index === 0) {
        doc.text("•", margin, y);
      }
      doc.text(line, margin + 8, y);
      y += 5;
    });
  };

  const addScore = (label: string, score: number) => {
    addPageIfNeeded(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`${label}: ${score}/100`, margin, y);
    y += 6;
  };

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Website Analysis Report", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`URL: ${url}`, margin, y);
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 12;

  // Overall Score
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y - 4, contentWidth, 35, 3, 3, "F");
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`Overall Score: ${results.summary.overallScore}/100`, margin + 5, y + 6);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const overviewLines = doc.splitTextToSize(results.summary.overview, contentWidth - 10);
  overviewLines.slice(0, 3).forEach((line: string, i: number) => {
    doc.text(line, margin + 5, y + 14 + i * 5);
  });
  y += 40;

  // Quick Wins
  addTitle("Quick Wins");
  results.summary.quickWins.forEach((win) => addBullet(win));
  y += 5;

  // Messaging
  addTitle("Messaging & Offer Clarity");
  addScore("Score", results.messaging.score);
  results.messaging.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Recommended Headline");
  addText(results.messaging.recommendedHeadline, 5);
  addSubtitle("Recommended Subheadline");
  addText(results.messaging.recommendedSubheadline, 5);
  addSubtitle("Elevator Pitch");
  addText(results.messaging.elevatorPitch, 5);
  y += 5;

  // Conversion
  addTitle("Conversion & Lead Capture");
  addScore("Score", results.conversion.score);
  results.conversion.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Recommendations");
  results.conversion.recommendations.forEach((r) => addBullet(r));
  addSubtitle("Sample CTAs");
  addText(results.conversion.sampleButtons.join(" | "), 5);
  y += 5;

  // Design UX
  addTitle("Design & User Experience");
  addScore("Score", results.designUx.score);
  results.designUx.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Recommendations");
  results.designUx.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // Mobile
  addTitle("Mobile Experience");
  addScore("Score", results.mobile.score);
  results.mobile.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Mobile Fixes");
  results.mobile.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // Performance
  addTitle("Speed & Performance");
  addScore("Score", results.performance.score);
  results.performance.findings.forEach((f) => addBullet(f.text));
  if (results.performance.heavyImages.length > 0) {
    addSubtitle("Heavy Images Detected");
    results.performance.heavyImages.forEach((img) => addBullet(img));
  }
  addSubtitle("Performance Tips");
  results.performance.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // SEO
  addTitle("SEO & Local SEO");
  addScore("Score", results.seo.score);
  results.seo.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Recommended Title Tag");
  addText(results.seo.recommendedTitle, 5);
  addSubtitle("Recommended Meta Description");
  addText(results.seo.recommendedMetaDescription, 5);
  addSubtitle("Recommended H1");
  addText(results.seo.recommendedH1, 5);
  addSubtitle("Target Keywords");
  addText(results.seo.keywords.join(", "), 5);
  addSubtitle("Local SEO Checklist");
  results.seo.checklist.forEach((item) => addBullet(item));
  y += 5;

  // Trust
  addTitle("Trust & Credibility");
  addScore("Score", results.trust.score);
  results.trust.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Why Choose Us Section");
  results.trust.whyChooseUs.forEach((item) => addBullet(item));
  addSubtitle("Testimonials Block");
  addText(results.trust.testimonialsBlock, 5);
  y += 5;

  // Technical
  addTitle("Technical Basics");
  results.technical.findings.forEach((f) => addBullet(f.text));
  addSubtitle("Technical Recommendations");
  results.technical.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // AI Service Pitch
  addTitle("Maximize Your Website ROI with AI");
  addText(results.aiServicePitch.paragraph);
  results.aiServicePitch.bullets.forEach((b) => addBullet(b));

  // Footer
  addPageIfNeeded(20);
  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by Optimize My Biz - optimizemybiz.app", margin, y);

  // Save
  const filename = `website-analysis-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
