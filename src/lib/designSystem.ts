/**
 * Agency-Grade Design System Generator
 * Generates unique, industry-specific design systems for home-service businesses
 */

import { 
  Snowflake, Flame, Wrench, Settings, AirVent, Gauge, Fan, ThermometerSun,
  Droplets, PipetteIcon, Waves, ShowerHead,
  Zap, Lightbulb, Plug, Power, Cable, CircuitBoard,
  Home as HomeIcon, Hammer, HardHat, Layers,
  Leaf, TreePine, Flower2, Sprout, Mountain,
  Bug, Shield, ShieldCheck, ShieldAlert,
  Heart, Sparkles, Smile, Star,
  Car, DoorOpen, Lock, Key,
  Sun, Battery, Bolt,
  SprayCan, Droplet, Wind,
  Clock, Award, Users, Phone, CheckCircle, BadgeCheck, CalendarCheck, Headphones,
  type LucideIcon
} from "lucide-react";

// ============= TYPOGRAPHY PAIRINGS =============
export interface TypographyPair {
  heading: string;
  headingWeight: string;
  body: string;
  bodyWeight: string;
  googleFontsUrl: string;
}

const typographyPairings: Record<string, TypographyPair> = {
  modern: {
    heading: "'Plus Jakarta Sans', sans-serif",
    headingWeight: "800",
    body: "'Inter', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap",
  },
  professional: {
    heading: "'Outfit', sans-serif",
    headingWeight: "700",
    body: "'Source Sans 3', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Source+Sans+3:wght@400;500;600&display=swap",
  },
  bold: {
    heading: "'Sora', sans-serif",
    headingWeight: "700",
    body: "'DM Sans', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap",
  },
  elegant: {
    heading: "'Playfair Display', serif",
    headingWeight: "700",
    body: "'Lato', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Lato:wght@400;500;600&display=swap",
  },
  friendly: {
    heading: "'Nunito', sans-serif",
    headingWeight: "800",
    body: "'Open Sans', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Open+Sans:wght@400;500;600&display=swap",
  },
  luxury: {
    heading: "'Cormorant Garamond', serif",
    headingWeight: "700",
    body: "'Raleway', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Raleway:wght@400;500;600&display=swap",
  },
  tech: {
    heading: "'Space Grotesk', sans-serif",
    headingWeight: "700",
    body: "'IBM Plex Sans', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
  },
  clean: {
    heading: "'Manrope', sans-serif",
    headingWeight: "800",
    body: "'Work Sans', sans-serif",
    bodyWeight: "400",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Work+Sans:wght@400;500;600&display=swap",
  },
};

// ============= COLOR THEMES =============
export interface ColorTheme {
  // Core colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;
  
  // Secondary palette
  secondary: string;
  secondaryDark: string;
  
  // Accent & CTA
  accent: string;
  accentLight: string;
  cta: string;
  ctaLight: string;
  ctaHover: string;
  
  // Neutrals
  dark: string;
  gray: string;
  grayLight: string;
  surface: string;
  
  // Gradients
  heroGradient: string;
  cardGradient: string;
  overlayGradient: string;
  ctaGradient: string;
  darkGradient: string;
  subtleGradient: string;
  
  // Labels
  industryLabel: string;
}

// ============= ICON SETS =============
export interface IconSet {
  primary: LucideIcon;
  icons: LucideIcon[];
  trustIcons: LucideIcon[];
}

// ============= STYLE CONFIG =============
export interface StyleConfig {
  borderRadius: {
    card: string;
    button: string;
    badge: string;
    image: string;
  };
  shadows: {
    card: string;
    cardHover: string;
    button: string;
    image: string;
  };
  iconStyle: 'rounded' | 'sharp' | 'soft';
  cardStyle: 'flat' | 'elevated' | 'glass';
  buttonStyle: 'solid' | 'gradient' | 'outline';
}

// ============= COMPLETE DESIGN SYSTEM =============
export interface DesignSystem {
  industry: string;
  colors: ColorTheme;
  typography: TypographyPair;
  icons: IconSet;
  style: StyleConfig;
}

// ============= INDUSTRY CONFIGURATIONS =============

const industryConfigs: Record<string, { 
  colors: ColorTheme; 
  icons: IconSet; 
  typographyKey: string;
  styleConfig: StyleConfig;
}> = {
  hvac: {
    colors: {
      primary: "#0A84FF",
      primaryDark: "#0056D6",
      primaryLight: "#E8F4FF",
      primaryGlow: "rgba(10, 132, 255, 0.15)",
      secondary: "#F8FAFC",
      secondaryDark: "#E2E8F0",
      accent: "#06B6D4",
      accentLight: "#ECFEFF",
      cta: "#F97316",
      ctaLight: "#FFF7ED",
      ctaHover: "#EA580C",
      dark: "#0F172A",
      gray: "#64748B",
      grayLight: "#94A3B8",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #0A84FF 0%, #0056D6 50%, #06B6D4 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(10, 132, 255, 0.03) 0%, rgba(6, 182, 212, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
      darkGradient: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      subtleGradient: "linear-gradient(135deg, #F8FAFC 0%, #E8F4FF 100%)",
      industryLabel: "HVAC Specialists",
    },
    icons: {
      primary: Snowflake,
      icons: [Snowflake, Flame, Fan, ThermometerSun, AirVent, Gauge, Wrench, Settings],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, CalendarCheck],
    },
    typographyKey: 'modern',
    styleConfig: {
      borderRadius: { card: '1rem', button: '0.75rem', badge: '9999px', image: '1.5rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(10, 132, 255, 0.1)',
        cardHover: '0 20px 40px -12px rgba(10, 132, 255, 0.2)',
        button: '0 10px 40px -10px rgba(249, 115, 22, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      iconStyle: 'rounded',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
  plumbing: {
    colors: {
      primary: "#2563EB",
      primaryDark: "#1D4ED8",
      primaryLight: "#DBEAFE",
      primaryGlow: "rgba(37, 99, 235, 0.15)",
      secondary: "#F8FAFC",
      secondaryDark: "#E2E8F0",
      accent: "#0EA5E9",
      accentLight: "#E0F2FE",
      cta: "#DC2626",
      ctaLight: "#FEE2E2",
      ctaHover: "#B91C1C",
      dark: "#0F172A",
      gray: "#64748B",
      grayLight: "#94A3B8",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #0EA5E9 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(37, 99, 235, 0.03) 0%, rgba(14, 165, 233, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
      darkGradient: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      subtleGradient: "linear-gradient(135deg, #F8FAFC 0%, #DBEAFE 100%)",
      industryLabel: "Plumbing Experts",
    },
    icons: {
      primary: Droplets,
      icons: [Droplets, Wrench, PipetteIcon, Waves, ShowerHead, Gauge, Settings, Shield],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, Headphones],
    },
    typographyKey: 'professional',
    styleConfig: {
      borderRadius: { card: '0.75rem', button: '0.5rem', badge: '9999px', image: '1rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(37, 99, 235, 0.1)',
        cardHover: '0 20px 40px -12px rgba(37, 99, 235, 0.2)',
        button: '0 10px 40px -10px rgba(220, 38, 38, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      iconStyle: 'rounded',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
  electrical: {
    colors: {
      primary: "#F59E0B",
      primaryDark: "#D97706",
      primaryLight: "#FEF3C7",
      primaryGlow: "rgba(245, 158, 11, 0.15)",
      secondary: "#FFFBEB",
      secondaryDark: "#FDE68A",
      accent: "#EAB308",
      accentLight: "#FEF9C3",
      cta: "#1D4ED8",
      ctaLight: "#DBEAFE",
      ctaHover: "#1E40AF",
      dark: "#1C1917",
      gray: "#57534E",
      grayLight: "#A8A29E",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(245, 158, 11, 0.03) 0%, rgba(234, 179, 8, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)",
      darkGradient: "linear-gradient(180deg, #1C1917 0%, #292524 100%)",
      subtleGradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
      industryLabel: "Electrical Pros",
    },
    icons: {
      primary: Zap,
      icons: [Zap, Lightbulb, Plug, Power, Cable, CircuitBoard, Settings, Shield],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, CalendarCheck],
    },
    typographyKey: 'bold',
    styleConfig: {
      borderRadius: { card: '0.5rem', button: '0.5rem', badge: '0.375rem', image: '0.75rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(245, 158, 11, 0.15)',
        cardHover: '0 20px 40px -12px rgba(245, 158, 11, 0.25)',
        button: '0 10px 40px -10px rgba(29, 78, 216, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      iconStyle: 'sharp',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
  roofing: {
    colors: {
      primary: "#B91C1C",
      primaryDark: "#991B1B",
      primaryLight: "#FEE2E2",
      primaryGlow: "rgba(185, 28, 28, 0.15)",
      secondary: "#FEF2F2",
      secondaryDark: "#FECACA",
      accent: "#78716C",
      accentLight: "#F5F5F4",
      cta: "#0F766E",
      ctaLight: "#CCFBF1",
      ctaHover: "#115E59",
      dark: "#1C1917",
      gray: "#57534E",
      grayLight: "#A8A29E",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #B91C1C 0%, #991B1B 50%, #7F1D1D 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(185, 28, 28, 0.03) 0%, rgba(120, 113, 108, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
      darkGradient: "linear-gradient(180deg, #1C1917 0%, #292524 100%)",
      subtleGradient: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
      industryLabel: "Roofing Specialists",
    },
    icons: {
      primary: HomeIcon,
      icons: [HomeIcon, Hammer, HardHat, Layers, Shield, Wrench, Settings, Award],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, Users],
    },
    typographyKey: 'professional',
    styleConfig: {
      borderRadius: { card: '0.5rem', button: '0.375rem', badge: '0.25rem', image: '0.5rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(185, 28, 28, 0.1)',
        cardHover: '0 20px 40px -12px rgba(185, 28, 28, 0.2)',
        button: '0 10px 40px -10px rgba(15, 118, 110, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
      },
      iconStyle: 'sharp',
      cardStyle: 'elevated',
      buttonStyle: 'solid',
    },
  },
  landscaping: {
    colors: {
      primary: "#16A34A",
      primaryDark: "#15803D",
      primaryLight: "#DCFCE7",
      primaryGlow: "rgba(22, 163, 74, 0.15)",
      secondary: "#F0FDF4",
      secondaryDark: "#BBF7D0",
      accent: "#84CC16",
      accentLight: "#ECFCCB",
      cta: "#CA8A04",
      ctaLight: "#FEF9C3",
      ctaHover: "#A16207",
      dark: "#14532D",
      gray: "#4D7C0F",
      grayLight: "#65A30D",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #16A34A 0%, #15803D 50%, #166534 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(22, 163, 74, 0.03) 0%, rgba(132, 204, 22, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #CA8A04 0%, #A16207 100%)",
      darkGradient: "linear-gradient(180deg, #14532D 0%, #166534 100%)",
      subtleGradient: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
      industryLabel: "Landscaping Pros",
    },
    icons: {
      primary: Leaf,
      icons: [Leaf, TreePine, Flower2, Sprout, Mountain, Sun, Wrench, Settings],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, CalendarCheck],
    },
    typographyKey: 'friendly',
    styleConfig: {
      borderRadius: { card: '1.5rem', button: '9999px', badge: '9999px', image: '1.5rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(22, 163, 74, 0.1)',
        cardHover: '0 20px 40px -12px rgba(22, 163, 74, 0.2)',
        button: '0 10px 40px -10px rgba(202, 138, 4, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
      },
      iconStyle: 'soft',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
  dental: {
    colors: {
      primary: "#0D9488",
      primaryDark: "#0F766E",
      primaryLight: "#CCFBF1",
      primaryGlow: "rgba(13, 148, 136, 0.15)",
      secondary: "#F0FDFA",
      secondaryDark: "#99F6E4",
      accent: "#14B8A6",
      accentLight: "#CCFBF1",
      cta: "#0891B2",
      ctaLight: "#ECFEFF",
      ctaHover: "#0E7490",
      dark: "#134E4A",
      gray: "#115E59",
      grayLight: "#2DD4BF",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #0D9488 0%, #0F766E 50%, #115E59 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F0FDFA 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(13, 148, 136, 0.03) 0%, rgba(20, 184, 166, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
      darkGradient: "linear-gradient(180deg, #134E4A 0%, #115E59 100%)",
      subtleGradient: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)",
      industryLabel: "Dental Care",
    },
    icons: {
      primary: Heart,
      icons: [Heart, Smile, Sparkles, Shield, Star, Clock, Users, Award],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, Heart],
    },
    typographyKey: 'elegant',
    styleConfig: {
      borderRadius: { card: '1.5rem', button: '9999px', badge: '9999px', image: '2rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(13, 148, 136, 0.1)',
        cardHover: '0 20px 40px -12px rgba(13, 148, 136, 0.2)',
        button: '0 10px 40px -10px rgba(8, 145, 178, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      },
      iconStyle: 'soft',
      cardStyle: 'glass',
      buttonStyle: 'gradient',
    },
  },
  "med spa": {
    colors: {
      primary: "#8B5CF6",
      primaryDark: "#7C3AED",
      primaryLight: "#EDE9FE",
      primaryGlow: "rgba(139, 92, 246, 0.15)",
      secondary: "#FAF5FF",
      secondaryDark: "#E9D5FF",
      accent: "#A855F7",
      accentLight: "#F3E8FF",
      cta: "#EC4899",
      ctaLight: "#FCE7F3",
      ctaHover: "#DB2777",
      dark: "#3B0764",
      gray: "#6B21A8",
      grayLight: "#9333EA",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(139, 92, 246, 0.03) 0%, rgba(168, 85, 247, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
      darkGradient: "linear-gradient(180deg, #3B0764 0%, #581C87 100%)",
      subtleGradient: "linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)",
      industryLabel: "Med Spa & Wellness",
    },
    icons: {
      primary: Sparkles,
      icons: [Sparkles, Heart, Star, Smile, Droplet, Wind, Shield, Award],
      trustIcons: [Shield, Clock, Star, Award, Heart, Sparkles],
    },
    typographyKey: 'luxury',
    styleConfig: {
      borderRadius: { card: '2rem', button: '9999px', badge: '9999px', image: '2rem' },
      shadows: { 
        card: '0 4px 30px -4px rgba(139, 92, 246, 0.15)',
        cardHover: '0 20px 50px -12px rgba(139, 92, 246, 0.25)',
        button: '0 10px 40px -10px rgba(236, 72, 153, 0.5)',
        image: '0 25px 50px -12px rgba(139, 92, 246, 0.2)',
      },
      iconStyle: 'soft',
      cardStyle: 'glass',
      buttonStyle: 'gradient',
    },
  },
  "pest control": {
    colors: {
      primary: "#059669",
      primaryDark: "#047857",
      primaryLight: "#D1FAE5",
      primaryGlow: "rgba(5, 150, 105, 0.15)",
      secondary: "#ECFDF5",
      secondaryDark: "#A7F3D0",
      accent: "#10B981",
      accentLight: "#D1FAE5",
      cta: "#DC2626",
      ctaLight: "#FEE2E2",
      ctaHover: "#B91C1C",
      dark: "#064E3B",
      gray: "#047857",
      grayLight: "#34D399",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #ECFDF5 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(5, 150, 105, 0.03) 0%, rgba(16, 185, 129, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
      darkGradient: "linear-gradient(180deg, #064E3B 0%, #065F46 100%)",
      subtleGradient: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
      industryLabel: "Pest Control Experts",
    },
    icons: {
      primary: Bug,
      icons: [Bug, Shield, ShieldCheck, ShieldAlert, HomeIcon, Wrench, Settings, Award],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, ShieldCheck],
    },
    typographyKey: 'professional',
    styleConfig: {
      borderRadius: { card: '0.75rem', button: '0.5rem', badge: '9999px', image: '1rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(5, 150, 105, 0.1)',
        cardHover: '0 20px 40px -12px rgba(5, 150, 105, 0.2)',
        button: '0 10px 40px -10px rgba(220, 38, 38, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
      },
      iconStyle: 'rounded',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
  "garage door": {
    colors: {
      primary: "#374151",
      primaryDark: "#1F2937",
      primaryLight: "#F3F4F6",
      primaryGlow: "rgba(55, 65, 81, 0.15)",
      secondary: "#F9FAFB",
      secondaryDark: "#E5E7EB",
      accent: "#6B7280",
      accentLight: "#F3F4F6",
      cta: "#EF4444",
      ctaLight: "#FEE2E2",
      ctaHover: "#DC2626",
      dark: "#111827",
      gray: "#4B5563",
      grayLight: "#9CA3AF",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #374151 0%, #1F2937 50%, #111827 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(55, 65, 81, 0.03) 0%, rgba(107, 114, 128, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      darkGradient: "linear-gradient(180deg, #111827 0%, #1F2937 100%)",
      subtleGradient: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)",
      industryLabel: "Garage Door Specialists",
    },
    icons: {
      primary: DoorOpen,
      icons: [DoorOpen, Car, Lock, Key, Wrench, Settings, Shield, Award],
      trustIcons: [Shield, Clock, Star, Award, BadgeCheck, Wrench],
    },
    typographyKey: 'bold',
    styleConfig: {
      borderRadius: { card: '0.375rem', button: '0.25rem', badge: '0.25rem', image: '0.5rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(55, 65, 81, 0.15)',
        cardHover: '0 20px 40px -12px rgba(55, 65, 81, 0.25)',
        button: '0 10px 40px -10px rgba(239, 68, 68, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
      },
      iconStyle: 'sharp',
      cardStyle: 'flat',
      buttonStyle: 'solid',
    },
  },
  solar: {
    colors: {
      primary: "#F59E0B",
      primaryDark: "#D97706",
      primaryLight: "#FEF3C7",
      primaryGlow: "rgba(245, 158, 11, 0.15)",
      secondary: "#FFFBEB",
      secondaryDark: "#FDE68A",
      accent: "#10B981",
      accentLight: "#D1FAE5",
      cta: "#0EA5E9",
      ctaLight: "#E0F2FE",
      ctaHover: "#0284C7",
      dark: "#1C1917",
      gray: "#57534E",
      grayLight: "#A8A29E",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 40%, #10B981 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(245, 158, 11, 0.03) 0%, rgba(16, 185, 129, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
      darkGradient: "linear-gradient(180deg, #1C1917 0%, #292524 100%)",
      subtleGradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
      industryLabel: "Solar Energy Experts",
    },
    icons: {
      primary: Sun,
      icons: [Sun, Bolt, Battery, Zap, Leaf, HomeIcon, Settings, Shield],
      trustIcons: [Shield, Clock, Star, Award, Leaf, Sun],
    },
    typographyKey: 'tech',
    styleConfig: {
      borderRadius: { card: '1rem', button: '0.75rem', badge: '9999px', image: '1rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(245, 158, 11, 0.15)',
        cardHover: '0 20px 40px -12px rgba(245, 158, 11, 0.25)',
        button: '0 10px 40px -10px rgba(14, 165, 233, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.2)',
      },
      iconStyle: 'rounded',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
  cleaning: {
    colors: {
      primary: "#0EA5E9",
      primaryDark: "#0284C7",
      primaryLight: "#E0F2FE",
      primaryGlow: "rgba(14, 165, 233, 0.15)",
      secondary: "#F0F9FF",
      secondaryDark: "#BAE6FD",
      accent: "#06B6D4",
      accentLight: "#CFFAFE",
      cta: "#16A34A",
      ctaLight: "#DCFCE7",
      ctaHover: "#15803D",
      dark: "#0C4A6E",
      gray: "#0369A1",
      grayLight: "#38BDF8",
      surface: "#FFFFFF",
      heroGradient: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #06B6D4 100%)",
      cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)",
      overlayGradient: "linear-gradient(180deg, rgba(14, 165, 233, 0.03) 0%, rgba(6, 182, 212, 0.02) 100%)",
      ctaGradient: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
      darkGradient: "linear-gradient(180deg, #0C4A6E 0%, #075985 100%)",
      subtleGradient: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
      industryLabel: "Cleaning Professionals",
    },
    icons: {
      primary: SprayCan,
      icons: [SprayCan, Sparkles, Droplet, Wind, HomeIcon, Star, Settings, Shield],
      trustIcons: [Shield, Clock, Star, Award, Sparkles, CheckCircle],
    },
    typographyKey: 'clean',
    styleConfig: {
      borderRadius: { card: '1.25rem', button: '9999px', badge: '9999px', image: '1.5rem' },
      shadows: { 
        card: '0 4px 20px -4px rgba(14, 165, 233, 0.1)',
        cardHover: '0 20px 40px -12px rgba(14, 165, 233, 0.2)',
        button: '0 10px 40px -10px rgba(22, 163, 74, 0.5)',
        image: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      },
      iconStyle: 'soft',
      cardStyle: 'elevated',
      buttonStyle: 'gradient',
    },
  },
};

// Default config for unknown industries
const defaultConfig = industryConfigs.hvac;

/**
 * Normalize industry string to match config keys
 */
function normalizeIndustry(industry: string): string {
  const normalized = industry.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    'hvac': 'hvac',
    'air conditioning': 'hvac',
    'ac': 'hvac',
    'heating': 'hvac',
    'cooling': 'hvac',
    'plumbing': 'plumbing',
    'plumber': 'plumbing',
    'electrical': 'electrical',
    'electrician': 'electrical',
    'roofing': 'roofing',
    'roofer': 'roofing',
    'roof': 'roofing',
    'landscaping': 'landscaping',
    'lawn care': 'landscaping',
    'lawn': 'landscaping',
    'garden': 'landscaping',
    'dental': 'dental',
    'dentist': 'dental',
    'med spa': 'med spa',
    'medspa': 'med spa',
    'medical spa': 'med spa',
    'spa': 'med spa',
    'pest control': 'pest control',
    'exterminator': 'pest control',
    'pest': 'pest control',
    'garage door': 'garage door',
    'garage': 'garage door',
    'solar': 'solar',
    'solar panel': 'solar',
    'cleaning': 'cleaning',
    'house cleaning': 'cleaning',
    'maid': 'cleaning',
    'janitorial': 'cleaning',
    'pressure washing': 'cleaning',
  };
  
  // Direct match
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'hvac'; // Default fallback
}

/**
 * Generate a complete design system for a given industry
 */
export function generateDesignSystem(industry: string): DesignSystem {
  const normalizedIndustry = normalizeIndustry(industry);
  const config = industryConfigs[normalizedIndustry] || defaultConfig;
  const typography = typographyPairings[config.typographyKey] || typographyPairings.modern;
  
  return {
    industry: normalizedIndustry,
    colors: config.colors,
    typography,
    icons: config.icons,
    style: config.styleConfig,
  };
}

/**
 * Get the Google Fonts URL for a design system
 */
export function getGoogleFontsUrl(designSystem: DesignSystem): string {
  return designSystem.typography.googleFontsUrl;
}

/**
 * Get CSS variables for the design system colors
 */
export function getColorCSSVariables(colors: ColorTheme): Record<string, string> {
  return {
    '--ds-primary': colors.primary,
    '--ds-primary-dark': colors.primaryDark,
    '--ds-primary-light': colors.primaryLight,
    '--ds-primary-glow': colors.primaryGlow,
    '--ds-secondary': colors.secondary,
    '--ds-secondary-dark': colors.secondaryDark,
    '--ds-accent': colors.accent,
    '--ds-accent-light': colors.accentLight,
    '--ds-cta': colors.cta,
    '--ds-cta-light': colors.ctaLight,
    '--ds-cta-hover': colors.ctaHover,
    '--ds-dark': colors.dark,
    '--ds-gray': colors.gray,
    '--ds-gray-light': colors.grayLight,
    '--ds-surface': colors.surface,
    '--ds-hero-gradient': colors.heroGradient,
    '--ds-card-gradient': colors.cardGradient,
    '--ds-overlay-gradient': colors.overlayGradient,
    '--ds-cta-gradient': colors.ctaGradient,
    '--ds-dark-gradient': colors.darkGradient,
    '--ds-subtle-gradient': colors.subtleGradient,
  };
}
