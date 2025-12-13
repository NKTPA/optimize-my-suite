import { useState, useEffect } from "react";
import { Key, Copy, Trash2, Loader2, Code2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { FeatureLock } from "@/components/entitlements/FeatureLock";
import { supabase } from "@/integrations/supabase/client";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export function ApiAccess() {
  const { workspace, limits } = useWorkspace();
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  const hasAccess = limits.hasApiAccess;

  // Load existing API keys from the safe view
  useEffect(() => {
    if (!workspace?.id || !hasAccess) {
      setIsLoadingKeys(false);
      return;
    }

    const loadApiKeys = async () => {
      setIsLoadingKeys(true);
      try {
        const { data, error } = await supabase
          .from("api_keys_safe")
          .select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setApiKeys(data || []);
      } catch (error) {
        console.error("Failed to load API keys:", error);
      } finally {
        setIsLoadingKeys(false);
      }
    };

    loadApiKeys();
  }, [workspace?.id, hasAccess]);

  const generateApiKey = async () => {
    if (!workspace) return;

    setIsGenerating(true);
    try {
      // Call server-side edge function for secure key generation with SHA-256 hashing
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: {
          workspace_id: workspace.id,
          key_name: `API Key ${apiKeys.length + 1}`,
        },
      });

      if (error) throw error;

      const { api_key, key_data } = data;

      setNewKey(api_key);
      setApiKeys([key_data, ...apiKeys]);

      toast({
        title: "API Key Generated",
        description: "Copy your key now - it won't be shown again.",
      });
    } catch (error) {
      console.error("API key generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast({
        title: "Copied",
        description: "API key copied to clipboard.",
      });
    }
  };

  const revokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", keyId);

      if (error) throw error;

      setApiKeys(apiKeys.map(k => 
        k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k
      ));

      toast({
        title: "Key Revoked",
        description: "API key has been revoked and can no longer be used.",
      });
    } catch (error) {
      console.error("Revoke error:", error);
      toast({
        title: "Revoke Failed",
        description: "Could not revoke API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Access
            </CardTitle>
            <CardDescription>
              Generate API keys to integrate website analysis into your workflows.
            </CardDescription>
          </div>
          <Badge variant={hasAccess ? "default" : "secondary"}>
            {hasAccess ? "Enabled" : "Scale Only"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Key Display */}
        {newKey && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
            <p className="text-sm font-medium text-foreground">
              🔑 Your new API key (copy now - it won't be shown again):
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 rounded bg-background text-sm font-mono break-all">
                {newKey}
              </code>
              <Button variant="outline" size="sm" onClick={copyKey}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={generateApiKey}
          disabled={isGenerating || !hasAccess}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Key className="w-4 h-4" />
          )}
          Generate New API Key
        </Button>

        {/* Existing Keys */}
        {apiKeys.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Active Keys</h4>
            {apiKeys.filter(k => !k.revoked_at).map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div>
                  <p className="font-mono text-sm">{key.key_prefix}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => revokeKey(key.id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* API Documentation */}
        <div className="pt-4 border-t border-border space-y-4">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            API Endpoints
          </h4>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-1">
                <code className="font-mono text-primary">POST /api/analyze</code>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Analyze a website and return the full audit report.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-1">
                <code className="font-mono text-primary">POST /api/implementation-pack</code>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Generate an implementation pack from analysis results.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <ExternalLink className="w-4 h-4" />
            View Full API Docs
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="hasApiAccess"
        featureLabel="API Access"
        showLockIcon={false}
      >
        {content}
      </FeatureLock>
    );
  }

  return content;
}
