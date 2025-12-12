import { useState, useEffect, useCallback } from "react";
import { HistoryItem, HistoryItemType } from "@/types/history";
import { AnalysisResult } from "@/types/analysis";
import { ImplementationPlan } from "@/types/implementation";

const STORAGE_KEY = "optimize-my-biz-history";
const MAX_HISTORY_ITEMS = 100;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((items: HistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setHistory(items);
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }, []);

  const addAnalysis = useCallback(
    (url: string, result: AnalysisResult) => {
      const snippet =
        result.summary?.overview?.slice(0, 150) ||
        "Website analysis completed with actionable recommendations.";

      const newItem: HistoryItem = {
        id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        type: "analysis",
        createdAt: new Date().toISOString(),
        overallScore: result.summary?.overallScore,
        snippet: snippet + (snippet.length >= 150 ? "..." : ""),
        analysisResult: result,
      };

      const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updatedHistory);
      return newItem.id;
    },
    [history, saveHistory]
  );

  const addImplementation = useCallback(
    (url: string, plan: ImplementationPlan) => {
      const snippet =
        plan.heroSection?.headline ||
        "Implementation plan generated with detailed execution steps.";

      const newItem: HistoryItem = {
        id: `impl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        type: "implementation",
        createdAt: new Date().toISOString(),
        snippet: snippet.slice(0, 150) + (snippet.length >= 150 ? "..." : ""),
        implementationPlan: plan,
      };

      const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updatedHistory);
      return newItem.id;
    },
    [history, saveHistory]
  );

  const deleteItem = useCallback(
    (id: string) => {
      const updatedHistory = history.filter((item) => item.id !== id);
      saveHistory(updatedHistory);
    },
    [history, saveHistory]
  );

  const getItem = useCallback(
    (id: string) => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  const filterHistory = useCallback(
    (type?: HistoryItemType, searchQuery?: string) => {
      let filtered = history;

      if (type) {
        filtered = filtered.filter((item) => item.type === type);
      }

      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (item) =>
            item.url.toLowerCase().includes(query) ||
            item.snippet.toLowerCase().includes(query)
        );
      }

      return filtered;
    },
    [history]
  );

  return {
    history,
    addAnalysis,
    addImplementation,
    deleteItem,
    getItem,
    clearHistory,
    filterHistory,
  };
};
