import { Link } from "react-router-dom";
import { Menu, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { useState } from "react";

interface MobileNavSheetProps {
  onStartFreeTrial: () => void;
}

export function MobileNavSheet({ onStartFreeTrial }: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-11 w-11"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] max-w-sm flex flex-col p-0">
        <SheetHeader className="p-4 border-b border-border/60 text-left">
          <HeaderBrand textFallback />
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-4">
          <Link to="/pricing" onClick={close} className="flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors">
            Pricing
          </Link>
          <a
            href="/sample-audit-report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="flex items-center gap-2 min-h-[44px] px-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4" />
            See a Sample Report
          </a>
          <Link to="/auth" onClick={close} className="flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors">
            Login
          </Link>
          <button
            type="button"
            onClick={() => { close(); onStartFreeTrial(); }}
            className="flex items-center min-h-[44px] px-3 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors text-left"
          >
            Start Free Trial
          </button>
          <a href="#free-audit" onClick={close} className="mt-3">
            <Button
              size="lg"
              className="w-full gap-2 bg-[#2746C7] text-white hover:bg-[#1f3aa8] min-h-[48px]"
            >
              Get Your Free Audit
              <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}