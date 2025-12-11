export interface Finding {
  type: "success" | "warning" | "error" | "info";
  text: string;
}

export type FindingInput = Finding | string;

export interface AnalysisResult {
  summary: {
    overallScore: number;
    overview: string;
    quickWins: string[];
  };
  messaging: {
    score: number;
    findings: FindingInput[];
    recommendedHeadline: string;
    recommendedSubheadline: string;
    elevatorPitch: string;
  };
  conversion: {
    score: number;
    findings: FindingInput[];
    recommendations: string[];
    sampleButtons: string[];
  };
  designUx: {
    score: number;
    findings: FindingInput[];
    recommendations: string[];
  };
  mobile: {
    score: number;
    findings: FindingInput[];
    recommendations: string[];
  };
  performance: {
    score: number;
    findings: FindingInput[];
    heavyImages: string[];
    recommendations: string[];
  };
  seo: {
    score: number;
    findings: FindingInput[];
    recommendedTitle: string;
    recommendedMetaDescription: string;
    recommendedH1: string;
    keywords: string[];
    checklist: string[];
  };
  trust: {
    score: number;
    findings: FindingInput[];
    whyChooseUs: string[];
    testimonialsBlock: string;
  };
  technical: {
    findings: FindingInput[];
    recommendations: string[];
  };
  aiServicePitch: {
    paragraph: string;
    bullets: string[];
  };
}
