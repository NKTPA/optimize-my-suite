import jsPDF from "jspdf";
import { ImplementationPlan } from "@/types/implementation";

export function generateImplementationPdf(plan: ImplementationPlan, url: string) {
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

  const addNumberedItem = (num: number, text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    const lines = doc.splitTextToSize(text, contentWidth - 15);
    lines.forEach((line: string, index: number) => {
      addPageIfNeeded(6);
      if (index === 0) {
        doc.setFont("helvetica", "bold");
        doc.text(`${num}.`, margin, y);
        doc.setFont("helvetica", "normal");
      }
      doc.text(line, margin + 12, y);
      y += 5;
    });
  };

  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Implementation Pack", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`URL: ${url}`, margin, y);
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 12;

  // Hero Section
  addTitle("Hero Section");
  addSubtitle("Headline");
  addText(plan.heroSection.headline, 5);
  addSubtitle("Subheadline");
  addText(plan.heroSection.subheadline, 5);
  addSubtitle("Supporting Bullets");
  plan.heroSection.supportingBullets.forEach((bullet) => addBullet(bullet));
  addSubtitle("Primary CTA");
  addText(plan.heroSection.primaryCTA, 5);
  addSubtitle("Secondary CTA");
  addText(plan.heroSection.secondaryCTA, 5);
  y += 5;

  // Key Pages
  addTitle("Key Pages Copy");
  
  addSubtitle("Homepage - Intro");
  addText(plan.keyPages.home.intro, 5);
  addSubtitle("Homepage - Services Overview");
  addText(plan.keyPages.home.servicesOverview, 5);
  addSubtitle("Homepage - Why Choose Us");
  plan.keyPages.home.whyChooseUs.forEach((item) => addBullet(item));
  addSubtitle("Homepage - Trust Elements");
  plan.keyPages.home.trustElements.forEach((item) => addBullet(item));
  y += 3;

  if (plan.keyPages.servicesPage.sections.length > 0) {
    addSubtitle("Services Page");
    plan.keyPages.servicesPage.sections.forEach((service) => {
      addText(`${service.serviceName}: ${service.shortDescription}`, 5);
      addText(`CTA: ${service.idealCTA}`, 10);
    });
    y += 3;
  }

  addSubtitle("About Page - Headline");
  addText(plan.keyPages.aboutPage.headline, 5);
  addSubtitle("About Page - Body");
  addText(plan.keyPages.aboutPage.body, 5);
  y += 3;

  addSubtitle("Contact Page - Headline");
  addText(plan.keyPages.contactPage.headline, 5);
  addSubtitle("Contact Page - Body");
  addText(plan.keyPages.contactPage.body, 5);
  y += 5;

  // Forms & CTAs
  addTitle("Forms & CTAs");
  addSubtitle("Primary Phone Number");
  addText(plan.formsAndCTAs.primaryPhoneNumber, 5);
  addSubtitle("Contact Form Fields");
  addText(plan.formsAndCTAs.contactFormSpec.fields.join(", "), 5);
  addText(`Note: ${plan.formsAndCTAs.contactFormSpec.notes}`, 5);
  addSubtitle("CTA Buttons");
  plan.formsAndCTAs.ctaButtons.forEach((cta) => addBullet(cta));
  addSubtitle("Placement Guidelines");
  plan.formsAndCTAs.placementGuidelines.forEach((guide) => addBullet(guide));
  y += 5;

  // SEO Setup
  addTitle("SEO Setup");
  addSubtitle("Homepage Title Tag");
  addText(plan.seoSetup.home.title, 5);
  addSubtitle("Homepage Meta Description");
  addText(plan.seoSetup.home.metaDescription, 5);
  addSubtitle("Homepage H1");
  addText(plan.seoSetup.home.h1, 5);
  addSubtitle("Other SEO Suggestions");
  plan.seoSetup.otherSuggestions.forEach((sug) => addBullet(sug));
  addSubtitle("Image Alt Text Examples");
  plan.seoSetup.imageAltTextExamples.forEach((ex) => {
    addText(`${ex.forImageType}: alt="${ex.altText}"`, 5);
  });
  y += 5;

  // Design & Layout
  addTitle("Design & Layout Tweaks");
  addSubtitle("Suggested Color Palette");
  addText(`Primary: ${plan.designAndLayout.colorPaletteSuggestion.primary}`, 5);
  addText(`Secondary: ${plan.designAndLayout.colorPaletteSuggestion.secondary}`, 5);
  addText(`Accent: ${plan.designAndLayout.colorPaletteSuggestion.accent}`, 5);
  addSubtitle("Layout Changes");
  plan.designAndLayout.layoutChanges.forEach((change) => addBullet(change));
  y += 5;

  // Technical Fixes
  addTitle("Technical Fixes");
  addSubtitle("Tasks");
  plan.technicalFixes.tasks.forEach((task) => addBullet(task));
  addSubtitle("Priority Order");
  plan.technicalFixes.priorityOrder.forEach((priority, i) => addNumberedItem(i + 1, priority));
  y += 5;

  // Execution Checklist
  addTitle("Execution Checklist");
  plan.executionChecklist.forEach((item, i) => addNumberedItem(i + 1, item));

  // Footer
  addPageIfNeeded(20);
  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by OptimizeSuite - Internal Implementation Pack", margin, y);

  // Save
  const filename = `implementation-pack-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
