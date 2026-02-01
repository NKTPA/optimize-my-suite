import { useState } from "react";
import { FileCode, X, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ManualHtmlInputProps {
  onSubmit: (html: string, url: string) => void;
  isLoading?: boolean;
}

export function ManualHtmlInput({ onSubmit, isLoading }: ManualHtmlInputProps) {
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    
    if (!url.trim()) {
      setError("Please enter the website URL");
      return;
    }
    
    if (!html.trim()) {
      setError("Please paste the page source HTML");
      return;
    }
    
    if (html.length < 500) {
      setError("HTML content seems too short. Make sure you copied the full page source.");
      return;
    }
    
    if (!html.includes("<html") && !html.includes("<body")) {
      setError("This doesn't appear to be valid HTML. Make sure you copied the full page source.");
      return;
    }
    
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    
    onSubmit(html, formattedUrl);
    setOpen(false);
    setHtml("");
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
          <FileCode className="w-4 h-4" />
          Paste HTML
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 opacity-60" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  For sites blocked by age verification, bot protection, or login walls.
                  Open the site in your browser, pass any gates, then View Source and paste here.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            Manual HTML Analysis
          </DialogTitle>
          <DialogDescription>
            For sites with age verification, bot protection, or login walls that our analyzer can't access directly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-foreground">How to get the page source:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open the website in your browser</li>
              <li>Pass any age verification or login gates</li>
              <li>Right-click anywhere → "View Page Source" (or press <kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+U</kbd> / <kbd className="px-1 py-0.5 bg-background rounded text-xs">Cmd+Option+U</kbd>)</li>
              <li>Select all (<kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+A</kbd>) and copy (<kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+C</kbd>)</li>
              <li>Paste the HTML below</li>
            </ol>
          </div>
          
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Website URL</label>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {/* HTML Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Page Source HTML</label>
            <Textarea
              placeholder="<!DOCTYPE html>&#10;<html>&#10;..."
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {html.length > 0 && `${(html.length / 1024).toFixed(1)} KB`}
            </p>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <X className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !html.trim() || !url.trim()}>
            {isLoading ? "Analyzing..." : "Analyze HTML"}
            <Check className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
