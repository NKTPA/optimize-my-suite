export interface Finding {
  type: "success" | "warning" | "error" | "info";
  text: string;
}

export interface AnalysisResult {
  summary: {
    overallScore: number;
    overview: string;
    quickWins: string[];
  };
  messaging: {
    score: number;
    findings: Finding[];
    recommendedHeadline: string;
    recommendedSubheadline: string;
    elevatorPitch: string;
  };
  conversion: {
    score: number;
    findings: Finding[];
    recommendations: string[];
    sampleButtons: string[];
  };
  designUx: {
    score: number;
    findings: Finding[];
    recommendations: string[];
  };
  mobile: {
    score: number;
    findings: Finding[];
    recommendations: string[];
  };
  performance: {
    score: number;
    findings: Finding[];
    heavyImages: string[];
    recommendations: string[];
  };
  seo: {
    score: number;
    findings: Finding[];
    recommendedTitle: string;
    recommendedMetaDescription: string;
    recommendedH1: string;
    keywords: string[];
    checklist: string[];
  };
  trust: {
    score: number;
    findings: Finding[];
    whyChooseUs: string[];
    testimonialsBlock: string;
  };
  technical: {
    findings: Finding[];
    recommendations: string[];
  };
  aiServicePitch: {
    paragraph: string;
    bullets: string[];
  };
}
