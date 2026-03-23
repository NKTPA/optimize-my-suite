import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brandConfig";

type HeaderBrandVariant = "default" | "compact" | "auth";

interface HeaderBrandProps {
  /** Navigation target when clicking the brand */
  to?: string;
  /** Size variant for different header contexts */
  variant?: HeaderBrandVariant;
  /** Use icon-only logo instead of full primary logo */
  iconOnly?: boolean;
  /** Show text fallback instead of logo image */
  textFallback?: boolean;
  /** Additional className for the container */
  className?: string;
}

// Fixed height constraints per variant (matches header heights)
const VARIANT_CONSTRAINTS = {
  default: {
    containerHeight: "h-8",
    logoMaxHeight: "max-h-[32px]",
    iconSize: "w-8 h-8",
    textSize: "text-lg",
  },
  compact: {
    containerHeight: "h-7",
    logoMaxHeight: "max-h-[28px]",
    iconSize: "w-7 h-7",
    textSize: "text-base",
  },
  auth: {
    containerHeight: "h-10",
    logoMaxHeight: "max-h-[40px]",
    iconSize: "w-10 h-10",
    textSize: "text-xl",
  },
} as const;

/**
 * HeaderBrand Component
 * 
 * Locked, reusable component for consistent brand display across headers.
 * Enforces strict sizing constraints to prevent layout breaks on logo swaps.
 * 
 * To swap logos: Update ONLY src/lib/brandConfig.ts
 */
export function HeaderBrand({
  to = "/",
  variant = "default",
  iconOnly = false,
  textFallback = false,
  className = "",
}: HeaderBrandProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const constraints = VARIANT_CONSTRAINTS[variant];

  // Dev-only warning for oversized logo images
  useEffect(() => {
    if (import.meta.env.MODE !== "development") return;
    if (textFallback) return;

    const img = imgRef.current;
    if (!img) return;

    const checkDimensions = () => {
      const { naturalWidth, naturalHeight } = img;
      const { maxNaturalDimensions } = BRAND_CONFIG;

      if (
        naturalWidth > maxNaturalDimensions.width ||
        naturalHeight > maxNaturalDimensions.height
      ) {
        console.warn(
          `[HeaderBrand] Logo natural dimensions (${naturalWidth}x${naturalHeight}) ` +
          `exceed recommended max (${maxNaturalDimensions.width}x${maxNaturalDimensions.height}). ` +
          `Consider using a smaller source image to prevent blurriness.`
        );
      }
    };

    if (img.complete) {
      checkDimensions();
    } else {
      img.addEventListener("load", checkDimensions);
      return () => img.removeEventListener("load", checkDimensions);
    }
  }, [textFallback]);

  // Text fallback rendering (current default behavior)
  if (textFallback) {
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 flex-shrink-0 ${className}`}
      >
        <div className={`flex items-center justify-center ${constraints.iconSize} rounded-lg bg-primary/10`}>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <span className={`${constraints.textSize} font-black tracking-tight text-foreground`}>
          Optimize<span className="text-gradient">MySuite</span>
        </span>
      </Link>
    );
  }

  // Logo image rendering with strict constraints
  const logoSrc = iconOnly
    ? BRAND_CONFIG.logos.icon.light
    : BRAND_CONFIG.logos.primary.light;

  return (
    <Link
      to={to}
      className={`flex items-center flex-shrink-0 ${constraints.containerHeight} ${className}`}
    >
      <img
        ref={imgRef}
        src={logoSrc}
        alt={BRAND_CONFIG.alt}
        className={`${constraints.logoMaxHeight} w-auto object-contain`}
        // Prevent layout shift during load
        style={{ minWidth: iconOnly ? "28px" : "100px" }}
      />
    </Link>
  );
}

/**
 * HeaderBrandText Component
 * 
 * Simple text-only brand for inline usage (e.g., footers).
 * Does not include navigation link.
 */
export function HeaderBrandText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold text-foreground ${className}`}>
      {BRAND_CONFIG.name}
    </span>
  );
}
