import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { MobileNavSheet } from "@/components/marketing/MobileNavSheet";
import { cn } from "@/lib/utils";

/** Shared top bar for public marketing pages. */
export function MarketingNav({
  auditHref,
  onStartFreeTrial,
}: {
  auditHref: string;
  onStartFreeTrial: () => void;
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <HeaderBrand textFallback />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/pricing" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm">Pricing</Button>
          </Link>
          <a href="/sample-audit-report.pdf" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm">Sample report</Button>
          </a>
          <Link to="/auth" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <a href={auditHref}>
            <Button size="sm" className="px-2.5 text-xs sm:px-4 sm:text-sm">Run a free audit</Button>
          </a>
          <MobileNavSheet onStartFreeTrial={onStartFreeTrial} />
        </div>
      </div>
    </nav>
  );
}

/** Standard marketing section: 1200px column, divider on top. */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("border-t border-border", className)}>
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-24">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  as = "h2",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  as?: "h1" | "h2";
}) {
  const Heading = as;
  return (
    <div className="mb-12">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{eyebrow}</p>
      <Heading
        className={cn(
          "font-semibold tracking-[-0.02em] text-foreground",
          as === "h1" ? "text-4xl md:text-5xl leading-[1.05]" : "text-3xl md:text-[40px] leading-[1.1]",
        )}
      >
        {title}
      </Heading>
      {description && <p className="mt-4 max-w-[620px] text-lg text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Plain bordered card: white, 10px radius, no shadow. */
export function PlainCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border border-border bg-card p-6", className)}>{children}</div>;
}

const linkCls = "text-sm text-muted-foreground hover:text-foreground transition-colors";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="mb-2 font-semibold text-foreground">OptimizeMySuite</p>
          <p className="text-sm text-muted-foreground">White-label website audits for agencies and consultants.</p>
        </div>
        <div>
          <p className="mb-4 text-sm font-medium text-foreground">Product</p>
          <ul className="space-y-2">
            <li><Link to="/pricing" className={linkCls}>Pricing</Link></li>
            <li><a href="/#features" className={linkCls}>Features</a></li>
            <li><a href="/#revenue" className={linkCls}>How it works</a></li>
            <li><a href="/sample-audit-report.pdf" target="_blank" rel="noopener noreferrer" className={linkCls}>Sample report</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-medium text-foreground">Support</p>
          <ul className="space-y-2">
            <li><Link to="/auth" className={linkCls}>Log in</Link></li>
            <li><a href="mailto:support@optimizemysuite.com" className={linkCls}>Contact support</a></li>
            <li><a href="/#faq" className={linkCls}>FAQ</a></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-sm font-medium text-foreground">Company</p>
          <ul className="space-y-2">
            <li><a href="https://vibingsolutions.ai" target="_blank" rel="noopener noreferrer" className={linkCls}>Built by VibingSolutions.ai</a></li>
            <li><Link to="/privacy" className={linkCls}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={linkCls}>Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© {year} OptimizeMySuite</p>
        </div>
      </div>
    </footer>
  );
}
