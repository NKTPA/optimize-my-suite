import { AnalysisResult } from "./analysis";
import { ImplementationPlan } from "./implementation";

export type BatchSiteStatus = "pending" | "running" | "done" | "error";

export interface BatchSite {
  id: string;
  url: string;
  name?: string;
  status: BatchSiteStatus;
  analysisResult?: AnalysisResult;
  extractedData?: {
    url: string;
    title?: string;
    phone?: string;
  };
  implementationPlan?: ImplementationPlan;
  errorMessage?: string;
}
