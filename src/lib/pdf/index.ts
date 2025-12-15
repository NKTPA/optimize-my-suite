/**
 * PDF Component Library - Zero Truncation Guarantee
 * ==================================================
 * 
 * This is the canonical entry point for all PDF generation components.
 * All PDF generators MUST use these shared components.
 * 
 * HARD RULES:
 * 1. No fixed heights on any PDF text container
 * 2. No inline text mixed with icons in the same flow container
 * 3. No manual line clamping, ellipsis, or truncation
 * 4. Text must control layout height, never the reverse
 * 5. Page height expands to fit content
 */

// Core utilities and types
export {
  // Types
  type PdfContext,
  type TextBlockOptions,
  type BulletOptions,
  type CardOptions,
  
  // Colors
  PDF_COLORS,
  
  // Context management
  createPdfContext,
  getAvailableSpace,
  ensureSpace,
  addNewPage,
  checkPageBreak,
  
  // Core text rendering (ZERO TRUNCATION)
  renderSafeText,
  renderLabeledText,
  
  // Bullet lists (ZERO TRUNCATION)
  renderBulletItem,
  renderBulletList,
  
  // Containers
  renderContentCard,
  renderCalloutBox,
  
  // Headers
  renderSectionHeader,
  
  // Score indicators
  getScoreColor,
  getScoreColorLight,
  renderScoreBar,
  renderScoreCircle,
  
  // Utilities
  sanitizeText,
  getGradeLabel,
  getGradeDescription,
} from "./PdfCore";

// Recommendation components
export {
  // Types
  type RecommendationBlockData,
  type RecommendationCardData,
  
  // Components
  renderRecommendationBlock,
  renderRecommendationCard,
  renderCTACard,
  renderPriorityItem,
  renderServiceCard,
  renderChecklistItem,
} from "./PdfRecommendationBlock";
