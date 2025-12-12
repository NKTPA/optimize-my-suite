import { AnalysisResult } from "./analysis";
import { ImplementationPlan } from "./implementation";

export type HistoryItemType = "analysis" | "implementation";

export interface HistoryItem {
  id: string;
  url: string;
  type: HistoryItemType;
  createdAt: string;
  overallScore?: number;
  snippet: string;
  analysisResult?: AnalysisResult;
  implementationPlan?: ImplementationPlan;
}
