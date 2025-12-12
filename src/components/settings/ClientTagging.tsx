import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { FeatureLock } from "@/components/entitlements/FeatureLock";
import { supabase } from "@/integrations/supabase/client";

interface ClientTag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
}

const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#64748b", // slate
];

export function ClientTagging() {
  const { workspace, limits } = useWorkspace();
  const { toast } = useToast();

  const [tags, setTags] = useState<ClientTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[5]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasAccess = limits.hasClientTagging;

  useEffect(() => {
    if (workspace && hasAccess) {
      loadTags();
    } else {
      setIsLoading(false);
    }
  }, [workspace, hasAccess]);

  const loadTags = async () => {
    if (!workspace) return;

    try {
      const { data, error } = await supabase
        .from("client_tags")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTags(data as ClientTag[]);
    } catch (error) {
      console.error("Load tags error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTag = async () => {
    if (!workspace || !newTagName.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase.from("client_tags").insert({
        workspace_id: workspace.id,
        name: newTagName.trim(),
        color: selectedColor,
      }).select().single();

      if (error) throw error;

      setTags([data as ClientTag, ...tags]);
      setNewTagName("");
      setSelectedColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);

      toast({
        title: "Tag Created",
        description: `Tag "${newTagName}" has been created.`,
      });
    } catch (error) {
      console.error("Create tag error:", error);
      toast({
        title: "Creation Failed",
        description: "Could not create tag. It may already exist.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    setDeletingId(tagId);
    try {
      const { error } = await supabase
        .from("client_tags")
        .delete()
        .eq("id", tagId);

      if (error) throw error;

      setTags(tags.filter(t => t.id !== tagId));

      toast({
        title: "Tag Deleted",
        description: "Tag has been removed.",
      });
    } catch (error) {
      console.error("Delete tag error:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Client Tags
        </CardTitle>
        <CardDescription>
          Create tags to organize your client reports (e.g., "HVAC", "VIP", "Urgent").
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Tag Form */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name..."
              disabled={!hasAccess}
              onKeyDown={(e) => e.key === "Enter" && createTag()}
            />
            <Button
              onClick={createTag}
              disabled={isCreating || !newTagName.trim() || !hasAccess}
              size="sm"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            <div className="flex gap-1.5">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    selectedColor === color 
                      ? "ring-2 ring-offset-2 ring-primary" 
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={!hasAccess}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Existing Tags */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : tags.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Your Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => deleteTag(tag.id)}
                    disabled={deletingId === tag.id}
                    className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {deletingId === tag.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tags yet. Create your first tag above.
          </p>
        )}

        {/* Usage Tip */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> After creating tags, you can apply them to your reports
            from the History page to organize your clients.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="hasClientTagging"
        featureLabel="Client Tagging"
        showLockIcon={false}
      >
        {content}
      </FeatureLock>
    );
  }

  return content;
}
