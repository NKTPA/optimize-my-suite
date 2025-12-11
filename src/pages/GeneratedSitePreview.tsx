import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Shield, 
  Clock, Award, Users, Wrench, Sparkles, Camera, MessageCircle,
  ChevronRight, ExternalLink, Menu, X, Zap, Droplets, Flame,
  Snowflake, Lightbulb, TreePine, Home as HomeIcon, Heart,
  ThermometerSun, Fan, Plug, PipetteIcon, Leaf, Hammer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WebsiteBlueprint } from "@/types/blueprint";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LocationState {
  blueprint: WebsiteBlueprint;
  businessName: string;
  phone?: string;
  email?: string;
  industry?: string;
}

// Industry-specific color palettes
const getIndustryTheme = (industry: string = "") => {
  const industryLower = industry.toLowerCase();
  
  const themes: Record<string, { 
    primary: string; 
    primaryLight: string;
    secondary: string; 
    accent: string;
    gradient: string;
    heroGradient: string;
  }> = {
    hvac: {
      primary: "rgb(59, 130, 246)",
      primaryLight: "rgba(59, 130, 246, 0.1)",
      secondary: "rgb(241, 245, 249)",
      accent: "rgb(14, 165, 233)",
      gradient: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(14, 165, 233) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 100%)"
    },
    electrical: {
      primary: "rgb(245, 158, 11)",
      primaryLight: "rgba(245, 158, 11, 0.1)",
      secondary: "rgb(28, 25, 23)",
      accent: "rgb(251, 191, 36)",
      gradient: "linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(234, 88, 12) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.03) 50%, transparent 100%)"
    },
    plumbing: {
      primary: "rgb(37, 99, 235)",
      primaryLight: "rgba(37, 99, 235, 0.1)",
      secondary: "rgb(100, 116, 139)",
      accent: "rgb(56, 189, 248)",
      gradient: "linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(56, 189, 248) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, rgba(56, 189, 248, 0.03) 50%, transparent 100%)"
    },
    landscaping: {
      primary: "rgb(34, 197, 94)",
      primaryLight: "rgba(34, 197, 94, 0.1)",
      secondary: "rgb(120, 113, 108)",
      accent: "rgb(132, 204, 22)",
      gradient: "linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(132, 204, 22) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, rgba(132, 204, 22, 0.03) 50%, transparent 100%)"
    },
    roofing: {
      primary: "rgb(185, 28, 28)",
      primaryLight: "rgba(185, 28, 28, 0.1)",
      secondary: "rgb(100, 116, 139)",
      accent: "rgb(239, 68, 68)",
      gradient: "linear-gradient(135deg, rgb(185, 28, 28) 0%, rgb(153, 27, 27) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(185, 28, 28, 0.08) 0%, rgba(239, 68, 68, 0.03) 50%, transparent 100%)"
    },
    dental: {
      primary: "rgb(20, 184, 166)",
      primaryLight: "rgba(20, 184, 166, 0.1)",
      secondary: "rgb(241, 245, 249)",
      accent: "rgb(94, 234, 212)",
      gradient: "linear-gradient(135deg, rgb(20, 184, 166) 0%, rgb(94, 234, 212) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(20, 184, 166, 0.08) 0%, rgba(94, 234, 212, 0.03) 50%, transparent 100%)"
    },
    "med spa": {
      primary: "rgb(168, 85, 247)",
      primaryLight: "rgba(168, 85, 247, 0.1)",
      secondary: "rgb(250, 245, 255)",
      accent: "rgb(192, 132, 252)",
      gradient: "linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(192, 132, 252) 100%)",
      heroGradient: "linear-gradient(180deg, rgba(168, 85, 247, 0.06) 0%, rgba(192, 132, 252, 0.02) 50%, transparent 100%)"
    },
  };

  for (const [key, value] of Object.entries(themes)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }

  // Default professional blue theme
  return {
    primary: "rgb(59, 130, 246)",
    primaryLight: "rgba(59, 130, 246, 0.1)",
    secondary: "rgb(241, 245, 249)",
    accent: "rgb(14, 165, 233)",
    gradient: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(14, 165, 233) 100%)",
    heroGradient: "linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(14, 165, 233, 0.03) 50%, transparent 100%)"
  };
};

// Industry-specific icons
const getIndustryIcons = (industry: string = "") => {
  const industryLower = industry.toLowerCase();
  
  const iconSets: Record<string, typeof Shield[]> = {
    hvac: [Snowflake, Flame, ThermometerSun, Fan, Shield, Clock],
    electrical: [Zap, Lightbulb, Plug, Shield, Clock, Award],
    plumbing: [Droplets, PipetteIcon, Wrench, Shield, Clock, Award],
    landscaping: [TreePine, Leaf, HomeIcon, Shield, Clock, Award],
    roofing: [HomeIcon, Hammer, Shield, Clock, Award, Users],
    dental: [Heart, Sparkles, Shield, Star, Users, Award],
    "med spa": [Sparkles, Heart, Star, Shield, Users, Award],
  };

  for (const [key, value] of Object.entries(iconSets)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }

  return [Wrench, Sparkles, Shield, Clock, Award, Users];
};

// Industry-specific Unsplash images - MUCH more targeted
const getIndustryImages = (industry: string = "") => {
  const industryLower = industry.toLowerCase();
  
  const imageMap: Record<string, { hero: string; secondary: string; gallery: string[] }> = {
    hvac: {
      hero: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1631545806609-8f27d9ef1e5b?w=600&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=600&q=80",
      ]
    },
    plumbing: {
      hero: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80",
        "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=600&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      ]
    },
    electrical: {
      hero: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=600&q=80",
        "https://images.unsplash.com/photo-1631545806609-8f27d9ef1e5b?w=600&q=80",
      ]
    },
    dental: {
      hero: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80",
        "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80",
        "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&q=80",
        "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&q=80",
        "https://images.unsplash.com/photo-1445527815219-ecbfec67492e?w=600&q=80",
        "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&q=80",
      ]
    },
    "med spa": {
      hero: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80",
        "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80",
        "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80",
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      ]
    },
    landscaping: {
      hero: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
        "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
        "https://images.unsplash.com/photo-1592595896616-c37162298647?w=600&q=80",
      ]
    },
    roofing: {
      hero: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1200&q=80",
      secondary: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
        "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&q=80",
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
      ]
    },
  };

  for (const [key, value] of Object.entries(imageMap)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }

  return {
    hero: "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=1200&q=80",
    secondary: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
      "https://images.unsplash.com/photo-1592595896616-c37162298647?w=600&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
    ]
  };
};

const GeneratedSitePreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!state?.blueprint) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state?.blueprint) {
    return null;
  }

  const { blueprint, businessName, phone, email, industry } = state;
  const { hero, navigation, pages, technical } = blueprint;
  const theme = getIndustryTheme(industry);
  const images = getIndustryImages(industry);
  const industryIcons = getIndustryIcons(industry);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getServicesContent = () => pages?.services?.sections || [];
  const getFaqContent = () => pages?.faq?.sections || [];
  const getAboutContent = () => pages?.about?.sections || [];
  const getGalleryContent = () => pages?.gallery?.sections || [];
  const getContactContent = () => pages?.contact?.sections || [];
  const getWhyChooseUsContent = () => {
    const homePage = pages?.home;
    if (!homePage?.sections) return [];
    return homePage.sections.filter(s => 
      s.name.toLowerCase().includes("why") || 
      s.name.toLowerCase().includes("trust") ||
      s.name.toLowerCase().includes("choose")
    );
  };

  const galleryContent = getGalleryContent();
  const galleryImages = galleryContent.length > 0 
    ? galleryContent.slice(0, 6)
    : images.gallery.slice(0, 6).map((_, i) => ({ name: `Project ${i + 1}`, content: "Quality work completed" }));

  return (
    <div className="min-h-screen bg-white">
      {/* Internal Preview Banner */}
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs sm:text-sm text-amber-700 font-medium">
              Internal Preview — Implementation Reference Only
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-1.5 text-amber-700 hover:bg-amber-100 text-xs sm:text-sm h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      </div>

      {/* Mobile-First Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg lg:text-xl shadow-lg"
                style={{ background: theme.gradient }}
              >
                {businessName?.charAt(0) || "B"}
              </div>
              <span className="text-lg lg:text-xl font-bold text-gray-900 hidden sm:block">{businessName}</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation?.map((navItem, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-colors"
                >
                  {navItem}
                </button>
              ))}
            </div>

            {/* CTA + Mobile Menu */}
            <div className="flex items-center gap-3">
              <a 
                href={`tel:${phone || "5551234567"}`}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-transform hover:scale-105"
                style={{ background: theme.gradient }}
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{hero?.primaryCTA || "Call Now"}</span>
              </a>
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t bg-white">
              <div className="space-y-1">
                {navigation?.map((navItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    {navItem}
                  </button>
                ))}
              </div>
              <div className="pt-4 px-4">
                <a 
                  href={`tel:${phone || "5551234567"}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold shadow-lg"
                  style={{ background: theme.gradient }}
                >
                  <Phone className="w-5 h-5" />
                  {phone || "(555) 123-4567"}
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION - Mobile First, Premium Design */}
      <section id="home" className="relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{ background: theme.heroGradient }}
        />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-12 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content - Mobile First */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              {/* Offer Badge */}
              {hero?.offerBadge && (
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
                  <span className="text-sm font-semibold" style={{ color: theme.primary }}>
                    {hero.offerBadge}
                  </span>
                </div>
              )}
              
              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight mb-4 lg:mb-6">
                {hero?.headline || `Welcome to ${businessName}`}
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed mb-6 lg:mb-8 max-w-xl mx-auto lg:mx-0">
                {hero?.subheadline || "Your trusted local service provider"}
              </p>

              {/* Bullets - Mobile Optimized */}
              {hero?.bullets && hero.bullets.length > 0 && (
                <ul className="space-y-3 mb-8 text-left max-w-md mx-auto lg:mx-0">
                  {hero.bullets.slice(0, 4).map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div 
                        className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: theme.primaryLight }}
                      >
                        <CheckCircle className="w-4 h-4" style={{ color: theme.primary }} />
                      </div>
                      <span className="text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTAs - Mobile First Stack */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8">
                <a 
                  href={`tel:${phone || "5551234567"}`}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all hover:scale-105"
                  style={{ background: theme.gradient }}
                >
                  <Phone className="w-5 h-5" />
                  {hero?.primaryCTA || "Get Free Quote"}
                </a>
                {hero?.secondaryCTA && (
                  <button 
                    onClick={() => scrollToSection("services")}
                    className="px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    {hero.secondaryCTA}
                  </button>
                )}
              </div>

              {/* Trust Badges Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 lg:gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{ color: theme.primary }} />
                  <span className="font-medium">Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" style={{ color: theme.primary }} />
                  <span className="font-medium">24/7 Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">5-Star Rated</span>
                </div>
              </div>
            </div>

            {/* Right - Hero Image + Contact Card */}
            <div className="order-1 lg:order-2 relative">
              {/* Main Hero Image */}
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={images.hero}
                  alt={`${businessName} professional service`}
                  className="w-full h-64 sm:h-80 lg:h-[500px] object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Floating Contact Card */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-auto lg:max-w-xs">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl">
                    <p className="text-xs text-gray-500 mb-1">Call now for a free estimate</p>
                    <a 
                      href={`tel:${phone || "5551234567"}`}
                      className="flex items-center gap-2 text-lg font-bold"
                      style={{ color: theme.primary }}
                    >
                      <Phone className="w-5 h-5" />
                      {phone || "(555) 123-4567"}
                    </a>
                    <div className="flex items-center gap-1 mt-2">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">200+ reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST ROW */}
      <section className="py-8 lg:py-12 border-y bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12">
            {[
              { icon: Shield, text: "Licensed & Insured" },
              { icon: Clock, text: "Same-Day Service" },
              { icon: Award, text: "Satisfaction Guaranteed" },
              { icon: Users, text: "Family Owned" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <item.icon className="w-6 h-6" style={{ color: theme.primary }} />
                <span className="font-semibold text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-16">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              Our Services
            </span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              {pages?.services?.title || "What We Offer"}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {pages?.services?.metaDescription || "Professional services tailored to your needs"}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {getServicesContent().slice(0, 6).map((service, idx) => {
              const IconComponent = industryIcons[idx % industryIcons.length];
              return (
                <div 
                  key={idx} 
                  className="group bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300"
                >
                  <div 
                    className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <IconComponent className="w-7 h-7 lg:w-8 lg:h-8" style={{ color: theme.primary }} />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">{service.name}</h3>
                  <p className="text-gray-600 mb-5 leading-relaxed">{service.content}</p>
                  <button 
                    className="inline-flex items-center font-semibold transition-colors"
                    style={{ color: theme.primary }}
                    onClick={() => scrollToSection("contact")}
                  >
                    Get Quote <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="why-choose-us" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              Why Choose Us
            </span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Hundreds of Customers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Here's why homeowners and businesses choose us
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: "Fully licensed professionals with comprehensive insurance" },
              { icon: Clock, title: "Fast Response", desc: "Quick response times and flexible scheduling" },
              { icon: Award, title: "Quality Work", desc: "High-quality workmanship backed by our guarantee" },
              { icon: Users, title: "Friendly Team", desc: "Professional, courteous technicians" },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6 lg:p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div 
                  className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: theme.primaryLight }}
                >
                  <item.icon className="w-8 h-8 lg:w-10 lg:h-10" style={{ color: theme.primary }} />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Additional content from blueprint */}
          {getWhyChooseUsContent().length > 0 && (
            <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {getWhyChooseUsContent().map((section, idx) => (
                <div key={idx} className="flex gap-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div 
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryLight }}
                  >
                    <Star className="w-6 h-6" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{section.name}</h3>
                    <p className="text-gray-600 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div 
                className="absolute -inset-4 rounded-3xl opacity-20 blur-xl"
                style={{ background: theme.gradient }}
              />
              <img 
                src={images.secondary}
                alt={`${businessName} team`}
                className="relative rounded-2xl lg:rounded-3xl shadow-2xl w-full h-80 lg:h-[450px] object-cover"
              />
              {/* Experience Badge */}
              <div 
                className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 px-6 py-4 rounded-xl shadow-xl text-white"
                style={{ background: theme.gradient }}
              >
                <p className="text-3xl lg:text-4xl font-bold">10+</p>
                <p className="text-sm opacity-90">Years Experience</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
              >
                About Us
              </span>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6">
                {pages?.about?.title || `About ${businessName}`}
              </h2>
              
              <div className="space-y-4 mb-8">
                {getAboutContent().slice(0, 3).map((section, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{section.name}</h3>
                    <p className="text-gray-600 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => scrollToSection("contact")}
                className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: theme.gradient }}
              >
                Get In Touch <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              Our Work
            </span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              {pages?.gallery?.title || "Recent Projects"}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {pages?.gallery?.metaDescription || "See examples of our quality craftsmanship"}
            </p>
          </div>

          {/* Gallery Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {galleryImages.map((item, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3]"
              >
                <img 
                  src={images.gallery[idx] || images.gallery[0]}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-2 text-white mb-1">
                    <Camera className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <p className="text-white/80 text-sm">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              FAQ
            </span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              {pages?.faq?.title || "Frequently Asked Questions"}
            </h2>
            <p className="text-lg text-gray-600">
              Find answers to common questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {getFaqContent().map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="bg-white rounded-xl border border-gray-200 px-6 shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-5">
                  {faq.name}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-5 leading-relaxed">
                  {faq.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <button 
              onClick={() => scrollToSection("contact")}
              className="inline-flex items-center px-6 py-3 rounded-xl font-semibold text-white shadow-lg"
              style={{ background: theme.gradient }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section 
        className="py-16 lg:py-20"
        style={{ background: theme.gradient }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Contact us today for a free, no-obligation quote. We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`tel:${phone || "5551234567"}`}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white font-bold text-lg shadow-xl transition-transform hover:scale-105"
              style={{ color: theme.primary }}
            >
              <Phone className="w-5 h-5" />
              {phone || "(555) 123-4567"}
            </a>
            <button 
              onClick={() => scrollToSection("contact")}
              className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-white/50 text-white hover:bg-white/10 transition-colors"
            >
              Request Online Quote
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12 lg:mb-16">
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{ backgroundColor: theme.primaryLight, color: theme.primary }}
            >
              Contact Us
            </span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-4">
              {pages?.contact?.title || "Get In Touch"}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {pages?.contact?.metaDescription || "Ready to get started? Contact us today"}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h3>
                
                {getContactContent().slice(0, 1).map((section, idx) => (
                  <p key={idx} className="text-gray-600 mb-6">{section.content}</p>
                ))}

                <div className="space-y-5">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-4 group">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryLight }}
                      >
                        <Phone className="w-5 h-5" style={{ color: theme.primary }} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-bold text-gray-900 group-hover:underline">{phone}</p>
                      </div>
                    </a>
                  )}
                  
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-4 group">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryLight }}
                      >
                        <Mail className="w-5 h-5" style={{ color: theme.primary }} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-bold text-gray-900 group-hover:underline">{email}</p>
                      </div>
                    </a>
                  )}

                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: theme.primaryLight }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Service Area</p>
                      <p className="font-bold text-gray-900">{businessName} Service Area</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div 
                className="rounded-2xl p-6 lg:p-8"
                style={{ backgroundColor: theme.primaryLight }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5" style={{ color: theme.primary }} />
                  <h4 className="font-bold text-gray-900">Business Hours</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="font-semibold text-gray-900">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-semibold text-gray-900">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-semibold text-gray-900">Emergency Only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 lg:p-10 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Request a Free Quote</h3>
                  <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                    Demo Form
                  </span>
                </div>
                
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
                      <Input placeholder="John Smith" className="h-12 bg-gray-50 border-gray-200" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number *</label>
                      <Input placeholder="(555) 123-4567" className="h-12 bg-gray-50 border-gray-200" disabled />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                    <Input placeholder="john@example.com" className="h-12 bg-gray-50 border-gray-200" disabled />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Service Needed *</label>
                    <Input placeholder="What service do you need?" className="h-12 bg-gray-50 border-gray-200" disabled />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Project Details</label>
                    <Textarea 
                      placeholder="Tell us about your project..." 
                      rows={4} 
                      className="bg-gray-50 border-gray-200"
                      disabled 
                    />
                  </div>
                  
                  <button 
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: theme.gradient }}
                    disabled
                  >
                    {hero?.primaryCTA || "Get My Free Quote"}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    By submitting, you agree to our terms and privacy policy.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ background: theme.gradient }}
                >
                  {businessName?.charAt(0) || "B"}
                </div>
                <span className="text-xl font-bold">{businessName}</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
                Your trusted local service provider. Quality work, fair prices, and customer satisfaction guaranteed.
              </p>
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 text-lg font-semibold"
                  style={{ color: theme.accent }}
                >
                  <Phone className="w-5 h-5" />
                  {phone}
                </a>
              )}
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold mb-5 uppercase tracking-wider text-gray-400">Quick Links</h4>
              <ul className="space-y-3">
                {navigation?.slice(0, 5).map((navItem, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {navItem}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold mb-5 uppercase tracking-wider text-gray-400">Contact</h4>
              <div className="space-y-3 text-gray-400">
                {phone && <p>{phone}</p>}
                {email && <p>{email}</p>}
                <p>Mon-Fri: 8am-6pm</p>
                <p>Sat: 9am-4pm</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg sm:hidden z-40">
        <a 
          href={`tel:${phone || "5551234567"}`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-lg"
          style={{ background: theme.gradient }}
        >
          <Phone className="w-5 h-5" />
          Call Now - {phone || "(555) 123-4567"}
        </a>
      </div>

      {/* Internal Technical Notes */}
      <div className="bg-amber-50 border-t-4 border-amber-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h3 className="text-xl font-bold text-gray-900">Internal Implementation Notes</h3>
            <span className="text-xs px-3 py-1 bg-amber-200 text-amber-800 rounded-full font-medium">
              Not visible to clients
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" style={{ color: theme.primary }} />
                Layout Notes
              </h4>
              <p className="text-sm text-gray-600">{technical?.layout || "Single page with anchor navigation"}</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3">Performance</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {technical?.performance?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span style={{ color: theme.primary }}>•</span>
                    {item}
                  </li>
                )) || <li>• Standard optimization</li>}
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3">Accessibility</h4>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {technical?.accessibility?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span style={{ color: theme.primary }}>•</span>
                    {item}
                  </li>
                )) || <li>• WCAG 2.1 AA compliance</li>}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-amber-200">
            <h4 className="font-bold text-gray-900 mb-4">SEO Titles & Meta Descriptions</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages && Object.entries(pages).map(([pageName, pageData]) => (
                <div key={pageName} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: theme.primary }}>{pageName}</p>
                  <p className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{pageData?.seoTitle || "N/A"}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{pageData?.metaDescription || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="h-20 sm:hidden" />
    </div>
  );
};

export default GeneratedSitePreview;
