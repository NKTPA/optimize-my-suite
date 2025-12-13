/**
 * BRAND CONFIGURATION
 * Single source of truth for logo/brand assets.
 * To swap logos, update ONLY these paths - layout code remains untouched.
 */

import logoIconLight from "@/assets/logo-icon-light.png";
import logoIconDark from "@/assets/logo-icon-dark.png";
import logoPrimaryLight from "@/assets/logo-primary-light.png";
import logoPrimaryDark from "@/assets/logo-primary-dark.png";

export const BRAND_CONFIG = {
  name: "OptimizeMySuite",
  tagline: "Website Analysis & Optimization for Agencies",
  
  // Logo assets - update these paths to swap logos
  logos: {
    primary: {
      light: logoPrimaryLight,
      dark: logoPrimaryDark,
    },
    icon: {
      light: logoIconLight,
      dark: logoIconDark,
    },
  },
  
  alt: "OptimizeMySuite Logo",
  
  // Maximum natural dimensions before dev warning (prevents blurry logos)
  maxNaturalDimensions: {
    width: 400,
    height: 100,
  },
} as const;

export type BrandConfig = typeof BRAND_CONFIG;
