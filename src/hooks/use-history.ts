import { useState, useEffect, useCallback } from "react";
import { HistoryItem, HistoryItemType } from "@/types/history";
import { AnalysisResult } from "@/types/analysis";
import { ImplementationPlan } from "@/types/implementation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const useHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch history from Supabase on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch history:", error);
        return;
      }

      const items: HistoryItem[] = (data || []).map((row) => ({
        id: row.id,
        url: row.url,
        type: row.type as HistoryItemType,
        createdAt: row.created_at,
        overallScore: row.overall_score ?? undefined,
        snippet: row.snippet || "",
        analysisResult: row.analysis_result as unknown as AnalysisResult | undefined,
        implementationPlan: row.implementation_plan as unknown as ImplementationPlan | undefined,
      }));

      setHistory(items);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addAnalysis = useCallback(
    async (url: string, result: AnalysisResult) => {
      if (!user) return null;

      const snippet =
        result.summary?.overview?.slice(0, 150) ||
        "Website analysis completed with actionable recommendations.";

      try {
        const { data, error } = await supabase
          .from("analysis_history")
          .insert([{
            user_id: user.id,
            url,
            type: "analysis" as const,
            overall_score: result.summary?.overallScore ?? null,
            snippet: snippet + (snippet.length >= 150 ? "..." : ""),
            analysis_result: JSON.parse(JSON.stringify(result)),
          }])
          .select()
          .single();

        if (error) {
          console.error("Failed to save analysis:", error);
          return null;
        }

        // Add to local state
        const newItem: HistoryItem = {
          id: data.id,
          url,
          type: "analysis",
          createdAt: data.created_at,
          overallScore: result.summary?.overallScore,
          snippet: snippet + (snippet.length >= 150 ? "..." : ""),
          analysisResult: result,
        };

        setHistory((prev) => [newItem, ...prev]);
        return data.id;
      } catch (error) {
        console.error("Failed to save analysis:", error);
        return null;
      }
    },
    [user]
  );

  const addImplementation = useCallback(
    async (url: string, plan: ImplementationPlan) => {
      if (!user) return null;

      const snippet =
        plan.heroSection?.headline ||
        "Implementation plan generated with detailed execution steps.";

      try {
        const { data, error } = await supabase
          .from("analysis_history")
          .insert([{
            user_id: user.id,
            url,
            type: "implementation" as const,
            snippet: snippet.slice(0, 150) + (snippet.length >= 150 ? "..." : ""),
            implementation_plan: JSON.parse(JSON.stringify(plan)),
          }])
          .select()
          .single();

        if (error) {
          console.error("Failed to save implementation:", error);
          return null;
        }

        const newItem: HistoryItem = {
          id: data.id,
          url,
          type: "implementation",
          createdAt: data.created_at,
          snippet: snippet.slice(0, 150) + (snippet.length >= 150 ? "..." : ""),
          implementationPlan: plan,
        };

        setHistory((prev) => [newItem, ...prev]);
        return data.id;
      } catch (error) {
        console.error("Failed to save implementation:", error);
        return null;
      }
    },
    [user]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("analysis_history")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Failed to delete item:", error);
          return;
        }

        setHistory((prev) => prev.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    },
    [user]
  );

  const getItem = useCallback(
    (id: string) => {
      return history.find((item) => item.id === id);
    },
    [history]
  );

  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("analysis_history")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to clear history:", error);
        return;
      }

      setHistory([]);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  }, [user]);

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

  // Get baseline (oldest) analysis score for a given URL domain
  const getBaselineForUrl = useCallback(
    (url: string): { score: number; url: string; date: string } | null => {
      try {
        const inputDomain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        
        // Find all analyses for this domain (excluding preview domains)
        const domainAnalyses = history
          .filter((item) => {
            if (item.type !== "analysis" || !item.overallScore) return false;
            try {
              const itemDomain = new URL(item.url).hostname.replace(/^www\./, "").toLowerCase();
              // Exclude preview/staging domains from baseline
              const isPreview = /(lovable\.app|vercel\.app|netlify\.app|preview\.|staging\.)/i.test(item.url);
              return itemDomain === inputDomain && !isPreview;
            } catch {
              return false;
            }
          })
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        if (domainAnalyses.length === 0) return null;

        const oldest = domainAnalyses[0];
        return {
          score: oldest.overallScore!,
          url: oldest.url,
          date: oldest.createdAt,
        };
      } catch {
        return null;
      }
    },
    [history]
  );

  return {
    history,
    isLoading,
    addAnalysis,
    addImplementation,
    deleteItem,
    getItem,
    clearHistory,
    filterHistory,
    getBaselineForUrl,
    refetch: fetchHistory,
  };
};
