import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Lock, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/types/analysis";
import { generateAnalysisPdf } from "@/lib/generatePdf";
import { toast } from "@/hooks/use-toast";

type Phase =
  | "idle"
  | "analyzing"
  | "preview"
  | "unlocked"
  | "rateLimited"
  | "error";

const STATUS_LINES = [
  "Parsing your site...",
  "Fetching HTML & metadata...",
  "Running Google PageSpeed...",
  "Detecting website type...",
  "Scoring 7 categories...",
  "Compiling recommendations...",
  "Finalizing your report...",
];

const CATEGORY_KEYS: Array<{ key: keyof AnalysisResult; label: string }> = [
  { key: "messaging", label: "Messaging & Clarity" },
  { key: "conversion", label: "Conversion" },
  { key: "designUx", label: "Design & UX" },
  { key: "mobile", label: "Mobile" },
  { key: "performance", label: "Performance" },
  { key: "seo", label: "SEO" },
  { key: "trust", label: "Trust & Credibility" },
];

// Simple https + domain-format check.
function normalizeAndValidateUrl(input: string): { valid: boolean; url?: string; error?: string } {
  const raw = input.trim();
  if (!raw) return { valid: false, error: "Enter a website URL." };
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return { valid: false, error: "Only http(s) URLs are supported." };
    }
    // Require a real domain with a TLD.
    const host = u.hostname;
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(host)) {
      return { valid: false, error: "That doesn't look like a valid domain." };
    }
    return { valid: true, url: `https://${host}${u.pathname}${u.search}` };
  } catch {
    return { valid: false, error: "That doesn't look like a valid URL." };
  }
}

function ScoreRing({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (s / 100) * circ;
  const color = s >= 80 ? "#16a34a" : s >= 60 ? "#2746C7" : s >= 40 ? "#d97706" : "#dc2626";
  return (
    <div className="relative w-36 h-36" aria-label={`Overall score: ${s} out of 100`}>
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="motion-safe:transition-all motion-safe:duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black leading-none" style={{ color }}>{s}</span>
        <span className="text-xs text-muted-foreground mt-1">out of 100</span>
      </div>
    </div>
  );
}

function verdictFor(score: number): string {
  if (score >= 85) return "Strong foundation — a few tweaks will push this into elite territory.";
  if (score >= 70) return "Solid site with clear, high-leverage opportunities to lift conversions.";
  if (score >= 55) return "Meaningful gaps holding you back — most are fixable in a single sprint.";
  if (score >= 40) return "Significant issues across the board. Prioritized fixes below.";
  return "Critical issues on the fundamentals. Start with the top-priority items.";
}

export function HomepageAuditWidget() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [urlInput, setUrlInput] = useState("");
  const [normalizedUrl, setNormalizedUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const rotatorRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "analyzing") {
      if (rotatorRef.current) {
        window.clearInterval(rotatorRef.current);
        rotatorRef.current = null;
      }
      return;
    }
    setStatusIdx(0);
    rotatorRef.current = window.setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_LINES.length);
    }, 4000);
    return () => {
      if (rotatorRef.current) window.clearInterval(rotatorRef.current);
    };
  }, [phase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Honeypot — bots fill this. Silently do nothing.
    if (honeypot.trim().length > 0) return;

    const v = normalizeAndValidateUrl(urlInput);
    if (!v.valid || !v.url) {
      setInputError(v.error ?? "Invalid URL.");
      return;
    }
    setInputError(null);
    setNormalizedUrl(v.url);
    setResult(null);
    setErrorMsg(null);
    setRateLimitMsg(null);
    setPhase("analyzing");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-website", {
        body: { url: v.url },
      });

      if (error) {
        // supabase-js wraps HTTP errors here; try to read the body/status.
        const ctx = (error as { context?: Response }).context;
        let status = 0;
        let body: Record<string, unknown> = {};
        if (ctx && typeof ctx.status === "number") {
          status = ctx.status;
          try { body = await ctx.clone().json(); } catch { /* ignore */ }
        }
        if (status === 429 || status === 503) {
          setRateLimitMsg(
            status === 503
              ? "Audits are temporarily paused. Leave your email and we'll run yours as soon as we're back online."
              : "We've hit today's free audit limit — leave your email and we'll run yours tomorrow.",
          );
          setPhase("rateLimited");
          return;
        }
        throw new Error(typeof body.error === "string" ? body.error : error.message);
      }

      setResult(data as AnalysisResult);
      setPhase("preview");
    } catch (err) {
      console.error("[HomepageAuditWidget] analyze failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);
    const name = leadName.trim();
    const email = leadEmail.trim();
    if (name.length < 1 || name.length > 120) {
      setLeadError("Please enter your name.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
      setLeadError("Please enter a valid email.");
      return;
    }
    setLeadSubmitting(true);
    try {
      const { error } = await supabase.from("audit_leads").insert({
        name,
        email,
        url: normalizedUrl,
        overall_score: result?.summary.overallScore ?? null,
      });
      if (error) throw error;
      if (phase === "rateLimited") {
        toast({
          title: "You're on the list",
          description: "We'll email your audit report as soon as tomorrow's quota resets.",
        });
      } else {
        setPhase("unlocked");
      }
    } catch (err) {
      console.error("[HomepageAuditWidget] lead insert failed", err);
      setLeadError("Couldn't save your details. Please try again.");
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function handlePdf() {
    if (!result) return;
    try {
      await generateAnalysisPdf(result, normalizedUrl);
    } catch (err) {
      console.error("[HomepageAuditWidget] pdf failed", err);
      toast({ title: "PDF failed", description: "Could not generate the PDF. Try again.", variant: "destructive" });
    }
  }

  const overallScore = result?.summary.overallScore ?? 0;

  return (
    <section
      id="free-audit"
      aria-labelledby="free-audit-heading"
      className="relative border-t border-border/50 bg-gradient-to-b from-background via-background to-secondary/20 py-16 sm:py-20"
    >
      <div className="container px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            Free · No credit card
          </div>
          <h2 id="free-audit-heading" className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight mb-3">
            Run a free audit in <span className="text-gradient">under 3 minutes</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Objective, criteria-based scoring across 7 categories. See exactly where your site is winning — and where it's leaking clients.
          </p>
        </div>

        <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 bg-card shadow-lg p-5 sm:p-7">
          {/* URL form — always visible until preview/unlocked */}
          {(phase === "idle" || phase === "analyzing" || phase === "error") && (
            <form onSubmit={handleSubmit} noValidate>
              <Label htmlFor="audit-url" className="text-sm font-medium">Your website URL</Label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Input
                  id="audit-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder="https://your-site.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={phase === "analyzing"}
                  aria-invalid={!!inputError}
                  aria-describedby={inputError ? "audit-url-error" : undefined}
                  className="h-12 text-base"
                />
                {/* Honeypot — hidden from users, visible to bots. */}
                <div aria-hidden="true" className="hidden">
                  <label>
                    Website (leave blank)
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      name="website_hp"
                    />
                  </label>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={phase === "analyzing"}
                  className="h-12 bg-[#2746C7] text-white hover:bg-[#1f3aa8] gap-2 sm:min-w-[200px]"
                >
                  {phase === "analyzing" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Running...
                    </>
                  ) : (
                    <>
                      Run My Free Audit <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
              {inputError && (
                <p id="audit-url-error" className="mt-2 text-sm text-destructive">{inputError}</p>
              )}
              {phase === "error" && errorMsg && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          )}

          {/* Progress state */}
          {phase === "analyzing" && (
            <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden />
                <p className="text-sm sm:text-base font-medium text-foreground" aria-live="polite">
                  {STATUS_LINES[statusIdx]}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                This typically takes 1–3 minutes. Keep this tab open — we're running Google PageSpeed 3× for accuracy.
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/50">
                <div className="h-full w-1/3 rounded-full bg-primary motion-safe:animate-pulse" />
              </div>
            </div>
          )}

          {/* Preview: score + verdict + blurred grid + lead form */}
          {phase === "preview" && result && (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                <ScoreRing score={overallScore} />
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Overall audit score for {new URL(normalizedUrl).hostname}
                  </div>
                  <p className="text-base sm:text-lg font-medium text-foreground">{verdictFor(overallScore)}</p>
                </div>
              </div>

              {/* Blurred category grid */}
              <div className="relative mt-6">
                <div
                  aria-hidden="true"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 blur-sm select-none pointer-events-none"
                >
                  {CATEGORY_KEYS.map(({ key, label }) => {
                    const cat = result[key] as { score?: number } | undefined;
                    const s = typeof cat?.score === "number" ? Math.round(cat.score) : 50;
                    return (
                      <div key={String(key)} className="rounded-lg border border-border/60 bg-background p-3">
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="text-2xl font-bold text-foreground mt-1">{s}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-background/90 border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5 shadow-sm">
                    <Lock className="w-3 h-3" /> Unlock full breakdown below
                  </div>
                </div>
              </div>

              <form onSubmit={handleLeadSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lead-name" className="text-sm">Your name</Label>
                  <Input
                    id="lead-name"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    maxLength={120}
                    autoComplete="name"
                    className="mt-1 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-email" className="text-sm">Work email</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    maxLength={255}
                    autoComplete="email"
                    className="mt-1 h-11"
                  />
                </div>
                {leadError && (
                  <p className="sm:col-span-2 text-sm text-destructive">{leadError}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={leadSubmitting}
                  className="sm:col-span-2 h-12 bg-[#2746C7] text-white hover:bg-[#1f3aa8] gap-2"
                >
                  {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Show my full report
                </Button>
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  We'll email you the PDF. No spam — one-off delivery.
                </p>
              </form>
            </div>
          )}

          {/* Unlocked full breakdown */}
          {phase === "unlocked" && result && (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={overallScore} />
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Overall audit score for {new URL(normalizedUrl).hostname}
                  </div>
                  <p className="text-base sm:text-lg font-medium text-foreground mb-3">{verdictFor(overallScore)}</p>
                  <Button onClick={handlePdf} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" /> Download PDF report
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORY_KEYS.map(({ key, label }) => {
                  const cat = result[key] as { score?: number } | undefined;
                  const s = typeof cat?.score === "number" ? Math.round(cat.score) : 0;
                  const color = s >= 80 ? "text-green-600" : s >= 60 ? "text-primary" : s >= 40 ? "text-amber-600" : "text-destructive";
                  return (
                    <div key={String(key)} className="rounded-lg border border-border/60 bg-background p-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className={`text-2xl font-bold mt-1 ${color}`}>{s}</div>
                    </div>
                  );
                })}
              </div>

              {result.summary?.overview && (
                <div className="mt-6 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Executive summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary.overview}</p>
                </div>
              )}
            </div>
          )}

          {/* Rate limited state — lead-only capture, no retry */}
          {phase === "rateLimited" && (
            <div>
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
                <p className="text-foreground">{rateLimitMsg}</p>
              </div>
              <form onSubmit={handleLeadSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rl-name" className="text-sm">Your name</Label>
                  <Input id="rl-name" value={leadName} onChange={(e) => setLeadName(e.target.value)} maxLength={120} autoComplete="name" className="mt-1 h-11" />
                </div>
                <div>
                  <Label htmlFor="rl-email" className="text-sm">Work email</Label>
                  <Input id="rl-email" type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} maxLength={255} autoComplete="email" className="mt-1 h-11" />
                </div>
                {leadError && <p className="sm:col-span-2 text-sm text-destructive">{leadError}</p>}
                <Button type="submit" size="lg" disabled={leadSubmitting} className="sm:col-span-2 h-12 bg-[#2746C7] text-white hover:bg-[#1f3aa8] gap-2">
                  {leadSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Notify me when my audit is ready
                </Button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Free audits are limited to 3 per visitor per day and 50 site-wide per day.
        </p>
      </div>
    </section>
  );
}

export default HomepageAuditWidget;