import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Shield, 
  Clock, Award, Users, Wrench, Sparkles, Camera, MessageCircle,
  ChevronRight, ExternalLink, Menu, X, Zap, Droplets, Flame,
  Snowflake, Lightbulb, TreePine, Home as HomeIcon, Heart,
  ThermometerSun, Fan, Plug, PipetteIcon, Leaf, Hammer,
  Wind, Gauge, Settings, AlertTriangle, ThermometerSnowflake,
  AirVent, CircleDot, BadgeCheck, CalendarCheck, Headphones
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

// Premium HVAC Color Palette
const hvacTheme = {
  // Primary Cool Blue Gradient
  primary: "#0A84FF",
  primaryDark: "#0056D6",
  primaryLight: "#E8F4FF",
  primaryGlow: "rgba(10, 132, 255, 0.15)",
  
  // Secondary
  secondary: "#F8FAFC",
  secondaryDark: "#E2E8F0",
  
  // Accent - Electric Teal
  accent: "#06B6D4",
  accentLight: "#ECFEFF",
  
  // Safety Orange for CTAs
  ctaOrange: "#F97316",
  ctaOrangeLight: "#FFF7ED",
  
  // Neutrals
  dark: "#0F172A",
  gray: "#64748B",
  grayLight: "#94A3B8",
  
  // Gradients
  heroGradient: "linear-gradient(135deg, #0A84FF 0%, #0056D6 50%, #06B6D4 100%)",
  cardGradient: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
  overlayGradient: "linear-gradient(180deg, rgba(10, 132, 255, 0.03) 0%, rgba(6, 182, 212, 0.02) 100%)",
  ctaGradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
  darkGradient: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
};

// HVAC-Specific Custom Icons Component
const HVACIcons = {
  Thermostat: ThermometerSun,
  Cooling: Snowflake,
  Heating: Flame,
  Fan: Fan,
  Ventilation: Wind,
  AirQuality: AirVent,
  Diagnostics: Gauge,
  Maintenance: Wrench,
  Installation: Settings,
  Emergency: AlertTriangle,
  ACUnit: ThermometerSnowflake,
  Ductwork: CircleDot,
};

// HVAC-Specific Unsplash Images - Only HVAC Related (verified working images)
const hvacImages = {
  hero: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1400&q=90", // Construction worker
  heroAlt: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1400&q=90", // AC outdoor unit
  about: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1000&q=85", // Worker with equipment
  service1: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80", // AC outdoor unit
  service2: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80", // Modern home interior
  service3: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", // Technician at work
  gallery: [
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=700&q=85", // Technician working
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=700&q=85", // AC outdoor unit
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=700&q=85", // Worker with tools
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=85", // Equipment work
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=700&q=85", // Modern interior
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=85", // Modern home
  ],
};

const GeneratedSitePreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!state?.blueprint) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!state?.blueprint) {
    return null;
  }

  const { blueprint, businessName, phone, email } = state;
  const { hero, navigation, pages, technical } = blueprint;

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

  const hvacServiceIcons = [
    HVACIcons.Cooling,
    HVACIcons.Heating,
    HVACIcons.Maintenance,
    HVACIcons.Installation,
    HVACIcons.AirQuality,
    HVACIcons.Diagnostics,
  ];

  const galleryContent = getGalleryContent();
  const galleryImages = galleryContent.length > 0 
    ? galleryContent.slice(0, 6)
    : hvacImages.gallery.slice(0, 6).map((_, i) => ({ name: `HVAC Project ${i + 1}`, content: "Quality installation completed" }));

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Internal Preview Banner */}
      <div 
        className="py-2.5 px-4"
        style={{ background: hvacTheme.ctaOrangeLight, borderBottom: `1px solid ${hvacTheme.ctaOrange}30` }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: hvacTheme.ctaOrange }}
            />
            <p className="text-xs sm:text-sm font-semibold" style={{ color: hvacTheme.ctaOrange }}>
              ✦ Internal Preview — Implementation Reference Only
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs sm:text-sm h-8 hover:bg-orange-100"
            style={{ color: hvacTheme.ctaOrange }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Builder</span>
          </Button>
        </div>
      </div>

      {/* Premium Sticky Navigation */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : ''
        }`}
        style={{ 
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'white',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${hvacTheme.secondaryDark}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg lg:text-xl overflow-hidden"
                style={{ background: hvacTheme.heroGradient }}
              >
                <Snowflake className="w-6 h-6 absolute opacity-20 -top-1 -left-1" />
                <span className="relative z-10">{businessName?.charAt(0) || "A"}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg lg:text-xl font-bold" style={{ color: hvacTheme.dark }}>
                  {businessName}
                </span>
                <p className="text-xs" style={{ color: hvacTheme.gray }}>HVAC Specialists</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation?.map((navItem, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-blue-50"
                  style={{ color: hvacTheme.dark }}
                >
                  {navItem}
                </button>
              ))}
            </div>

            {/* CTA + Mobile Menu */}
            <div className="flex items-center gap-3">
              <a 
                href={`tel:${phone || "5551234567"}`}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                style={{ background: hvacTheme.ctaGradient }}
              >
                <Phone className="w-4 h-4 group-hover:animate-pulse" />
                <span className="text-sm">{hero?.primaryCTA || "Get Free Quote"}</span>
              </a>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl transition-colors"
                style={{ backgroundColor: hvacTheme.primaryLight }}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" style={{ color: hvacTheme.primary }} />
                ) : (
                  <Menu className="w-5 h-5" style={{ color: hvacTheme.primary }} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div 
              className="lg:hidden py-4 border-t animate-fade-in"
              style={{ backgroundColor: 'white', borderColor: hvacTheme.secondaryDark }}
            >
              <div className="space-y-1">
                {navigation?.map((navItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full text-left px-4 py-3.5 text-base font-medium rounded-xl transition-colors hover:bg-blue-50"
                    style={{ color: hvacTheme.dark }}
                  >
                    {navItem}
                  </button>
                ))}
              </div>
              <div className="pt-4 px-4">
                <a 
                  href={`tel:${phone || "5551234567"}`}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold shadow-lg"
                  style={{ background: hvacTheme.ctaGradient }}
                >
                  <Phone className="w-5 h-5" />
                  {phone || "(555) 123-4567"}
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ========== PREMIUM HERO SECTION ========== */}
      <section id="home" className="relative overflow-hidden">
        {/* Layered Background */}
        <div className="absolute inset-0" style={{ background: hvacTheme.overlayGradient }} />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03]"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230A84FF' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Floating Decorative Elements */}
        <div 
          className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: hvacTheme.primary }}
        />
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: hvacTheme.accent }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 xl:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content - Mobile First */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              {/* Offer Badge with Glow Effect */}
              {hero?.offerBadge && (
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 animate-scale-in"
                  style={{ 
                    background: `linear-gradient(135deg, ${hvacTheme.primaryLight} 0%, ${hvacTheme.accentLight} 100%)`,
                    boxShadow: `0 0 20px ${hvacTheme.primaryGlow}`,
                  }}
                >
                  <Snowflake className="w-4 h-4 animate-spin" style={{ color: hvacTheme.primary, animationDuration: '3s' }} />
                  <span className="text-sm font-bold" style={{ color: hvacTheme.primary }}>
                    {hero.offerBadge}
                  </span>
                </div>
              )}
              
              {/* Main Headline */}
              <h1 
                className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] mb-5 lg:mb-6 animate-fade-in"
                style={{ color: hvacTheme.dark }}
              >
                {hero?.headline || `Expert HVAC Services for ${businessName}`}
              </h1>
              
              {/* Subheadline */}
              <p 
                className="text-lg lg:text-xl leading-relaxed mb-7 lg:mb-8 max-w-xl mx-auto lg:mx-0"
                style={{ color: hvacTheme.gray }}
              >
                {hero?.subheadline || "Professional heating, cooling & air quality solutions. Fast response, fair pricing, guaranteed satisfaction."}
              </p>

              {/* Bullet Points with HVAC Icons */}
              {hero?.bullets && hero.bullets.length > 0 && (
                <ul className="space-y-3 mb-8 text-left max-w-md mx-auto lg:mx-0">
                  {hero.bullets.slice(0, 4).map((bullet, idx) => {
                    const icons = [Snowflake, ThermometerSun, Shield, Clock];
                    const Icon = icons[idx % icons.length];
                    return (
                      <li 
                        key={idx} 
                        className="flex items-start gap-3 animate-fade-in"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div 
                          className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: hvacTheme.heroGradient }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium" style={{ color: hvacTheme.dark }}>{bullet}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* CTA Buttons with Hover Effects */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8">
                <a 
                  href={`tel:${phone || "5551234567"}`}
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{ 
                    background: hvacTheme.ctaGradient,
                    boxShadow: `0 10px 40px -10px ${hvacTheme.ctaOrange}80`,
                  }}
                >
                  <Phone className="w-5 h-5 group-hover:animate-pulse" />
                  {hero?.primaryCTA || "Get Free Estimate"}
                </a>
                {hero?.secondaryCTA && (
                  <button 
                    onClick={() => scrollToSection("services")}
                    className="px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-all duration-300 hover:shadow-lg"
                    style={{ 
                      borderColor: hvacTheme.primary,
                      color: hvacTheme.primary,
                    }}
                  >
                    {hero.secondaryCTA}
                  </button>
                )}
              </div>

              {/* Trust Badges Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 lg:gap-6">
                {[
                  { icon: Shield, text: "Licensed & Insured" },
                  { icon: Clock, text: "24/7 Emergency" },
                  { icon: Star, text: "5-Star Rated", isStar: true },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 animate-fade-in"
                    style={{ animationDelay: `${(idx + 4) * 100}ms` }}
                  >
                    <item.icon 
                      className={`w-5 h-5 ${item.isStar ? 'fill-amber-400 text-amber-400' : ''}`}
                      style={!item.isStar ? { color: hvacTheme.primary } : undefined}
                    />
                    <span className="text-sm font-semibold" style={{ color: hvacTheme.dark }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Premium Hero Image with Overlays */}
            <div className="order-1 lg:order-2 relative">
              {/* Decorative Ring */}
              <div 
                className="absolute -inset-4 lg:-inset-6 rounded-3xl opacity-30 blur-2xl"
                style={{ background: hvacTheme.heroGradient }}
              />
              
              {/* Main Image Container */}
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={hvacImages.hero}
                  alt={`${businessName} HVAC Professional Service`}
                  className="w-full h-72 sm:h-80 lg:h-[520px] object-cover"
                />
                {/* Gradient Overlay */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: 'linear-gradient(180deg, transparent 40%, rgba(10, 132, 255, 0.1) 70%, rgba(15, 23, 42, 0.6) 100%)',
                  }}
                />
                
                {/* Floating Stats Badge */}
                <div 
                  className="absolute top-4 right-4 lg:top-6 lg:right-6 px-4 py-3 rounded-xl backdrop-blur-md border border-white/20"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                >
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-5 h-5" style={{ color: hvacTheme.primary }} />
                    <span className="text-sm font-bold" style={{ color: hvacTheme.dark }}>HVAC Experts</span>
                  </div>
                </div>
                
                {/* Floating Contact Card */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-auto lg:max-w-sm">
                  <div 
                    className="backdrop-blur-md rounded-xl p-4 lg:p-5 shadow-2xl border border-white/20"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  >
                    <p className="text-xs font-medium mb-1" style={{ color: hvacTheme.gray }}>
                      Call now for a free estimate
                    </p>
                    <a 
                      href={`tel:${phone || "5551234567"}`}
                      className="flex items-center gap-2 text-xl font-bold transition-colors hover:opacity-80"
                      style={{ color: hvacTheme.primary }}
                    >
                      <Phone className="w-5 h-5" />
                      {phone || "(555) 123-4567"}
                    </a>
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: hvacTheme.secondaryDark }}>
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-medium" style={{ color: hvacTheme.gray }}>200+ 5-Star Reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUST ROW ========== */}
      <section 
        className="py-6 lg:py-8 border-y"
        style={{ backgroundColor: hvacTheme.secondary, borderColor: hvacTheme.secondaryDark }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 lg:gap-x-14">
            {[
              { icon: BadgeCheck, text: "Licensed & Insured", color: hvacTheme.primary },
              { icon: Clock, text: "Same-Day Service", color: hvacTheme.accent },
              { icon: Headphones, text: "24/7 Support", color: hvacTheme.ctaOrange },
              { icon: Award, text: "Satisfaction Guaranteed", color: hvacTheme.primary },
              { icon: CalendarCheck, text: "Free Estimates", color: hvacTheme.accent },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="font-semibold text-sm" style={{ color: hvacTheme.dark }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICES SECTION ========== */}
      <section id="services" className="py-16 lg:py-24 relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{ 
            backgroundImage: `radial-gradient(${hvacTheme.primary} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
              style={{ backgroundColor: hvacTheme.primaryLight }}
            >
              <Settings className="w-4 h-4" style={{ color: hvacTheme.primary }} />
              <span className="text-sm font-bold" style={{ color: hvacTheme.primary }}>Our Services</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4"
              style={{ color: hvacTheme.dark }}
            >
              {pages?.services?.title || "Complete HVAC Solutions"}
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: hvacTheme.gray }}
            >
              {pages?.services?.metaDescription || "From installation to repair, we handle all your heating and cooling needs with expertise and care."}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {getServicesContent().slice(0, 6).map((service, idx) => {
              const IconComponent = hvacServiceIcons[idx % hvacServiceIcons.length];
              return (
                <div 
                  key={idx} 
                  className="group relative bg-white rounded-2xl p-6 lg:p-8 border transition-all duration-300 hover:-translate-y-1"
                  style={{ 
                    borderColor: hvacTheme.secondaryDark,
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 20px 40px -12px ${hvacTheme.primary}25`;
                    e.currentTarget.style.borderColor = hvacTheme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = hvacTheme.secondaryDark;
                  }}
                >
                  {/* Icon Container */}
                  <div 
                    className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: hvacTheme.heroGradient }}
                  >
                    <IconComponent className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  
                  <h3 
                    className="text-xl lg:text-2xl font-bold mb-3"
                    style={{ color: hvacTheme.dark }}
                  >
                    {service.name}
                  </h3>
                  <p 
                    className="mb-5 leading-relaxed"
                    style={{ color: hvacTheme.gray }}
                  >
                    {service.content}
                  </p>
                  
                  <button 
                    className="inline-flex items-center font-semibold transition-all duration-300 group-hover:gap-2"
                    style={{ color: hvacTheme.primary }}
                    onClick={() => scrollToSection("contact")}
                  >
                    Get a Quote 
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <section 
        id="why-choose-us" 
        className="py-16 lg:py-24"
        style={{ backgroundColor: hvacTheme.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
              style={{ backgroundColor: hvacTheme.accentLight }}
            >
              <Award className="w-4 h-4" style={{ color: hvacTheme.accent }} />
              <span className="text-sm font-bold" style={{ color: hvacTheme.accent }}>Why Choose Us</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4"
              style={{ color: hvacTheme.dark }}
            >
              The HVAC Team You Can Trust
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: hvacTheme.gray }}
            >
              Homeowners and businesses choose us for reliable, professional HVAC services
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: "Fully certified professionals with comprehensive coverage" },
              { icon: Clock, title: "Fast Response", desc: "Same-day service with flexible scheduling options" },
              { icon: ThermometerSun, title: "Expert Technicians", desc: "Factory-trained on all major HVAC brands" },
              { icon: Users, title: "Family Owned", desc: "Local business serving our community since 2010" },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="text-center p-5 lg:p-8 bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg"
                style={{ borderColor: hvacTheme.secondaryDark }}
              >
                <div 
                  className="w-14 h-14 lg:w-18 lg:h-18 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: hvacTheme.heroGradient }}
                >
                  <item.icon className="w-7 h-7 lg:w-9 lg:h-9 text-white" />
                </div>
                <h3 
                  className="text-base lg:text-xl font-bold mb-2"
                  style={{ color: hvacTheme.dark }}
                >
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: hvacTheme.gray }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ABOUT SECTION ========== */}
      <section id="about" className="py-16 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative">
              {/* Glow Effect */}
              <div 
                className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
                style={{ background: hvacTheme.heroGradient }}
              />
              
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={hvacImages.about}
                  alt={`${businessName} HVAC technician team`}
                  className="w-full h-80 lg:h-[480px] object-cover"
                />
                <div 
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(10, 132, 255, 0.2) 100%)' }}
                />
              </div>
              
              {/* Experience Badge */}
              <div 
                className="absolute -bottom-4 -right-4 lg:-bottom-6 lg:-right-6 px-6 py-5 rounded-2xl shadow-2xl text-white border-4 border-white"
                style={{ background: hvacTheme.heroGradient }}
              >
                <p className="text-4xl lg:text-5xl font-extrabold">10+</p>
                <p className="text-sm font-medium opacity-90">Years Experience</p>
              </div>
            </div>

            {/* Content */}
            <div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                style={{ backgroundColor: hvacTheme.primaryLight }}
              >
                <Users className="w-4 h-4" style={{ color: hvacTheme.primary }} />
                <span className="text-sm font-bold" style={{ color: hvacTheme.primary }}>About Us</span>
              </div>
              
              <h2 
                className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-6"
                style={{ color: hvacTheme.dark }}
              >
                {pages?.about?.title || `About ${businessName}`}
              </h2>
              
              <div className="space-y-5 mb-8">
                {getAboutContent().slice(0, 3).map((section, idx) => (
                  <div key={idx}>
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: hvacTheme.dark }}
                    >
                      {section.name}
                    </h3>
                    <p 
                      className="leading-relaxed"
                      style={{ color: hvacTheme.gray }}
                    >
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => scrollToSection("contact")}
                className="inline-flex items-center px-7 py-4 rounded-xl font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ 
                  background: hvacTheme.ctaGradient,
                  boxShadow: `0 10px 40px -10px ${hvacTheme.ctaOrange}60`,
                }}
              >
                Get In Touch <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== GALLERY SECTION ========== */}
      <section 
        id="gallery" 
        className="py-16 lg:py-24"
        style={{ backgroundColor: hvacTheme.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
              style={{ backgroundColor: hvacTheme.primaryLight }}
            >
              <Camera className="w-4 h-4" style={{ color: hvacTheme.primary }} />
              <span className="text-sm font-bold" style={{ color: hvacTheme.primary }}>Our Work</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4"
              style={{ color: hvacTheme.dark }}
            >
              {pages?.gallery?.title || "Recent HVAC Projects"}
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: hvacTheme.gray }}
            >
              {pages?.gallery?.metaDescription || "See examples of our professional installations and repairs"}
            </p>
          </div>

          {/* Gallery Grid - Masonry Style */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
            {galleryImages.map((item, idx) => (
              <div 
                key={idx} 
                className={`group relative rounded-2xl overflow-hidden shadow-lg cursor-pointer ${
                  idx === 0 ? 'row-span-2' : ''
                }`}
                style={{ aspectRatio: idx === 0 ? '3/4' : '4/3' }}
              >
                <img 
                  src={hvacImages.gallery[idx] || hvacImages.gallery[0]}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(10, 132, 255, 0.9) 100%)' }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-2 text-white mb-1">
                    <Snowflake className="w-4 h-4" />
                    <span className="font-bold">{item.name}</span>
                  </div>
                  <p className="text-white/80 text-sm">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section id="faq" className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
              style={{ backgroundColor: hvacTheme.accentLight }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: hvacTheme.accent }} />
              <span className="text-sm font-bold" style={{ color: hvacTheme.accent }}>FAQ</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4"
              style={{ color: hvacTheme.dark }}
            >
              {pages?.faq?.title || "Frequently Asked Questions"}
            </h2>
            <p style={{ color: hvacTheme.gray }}>
              Find answers to common HVAC questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {getFaqContent().map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="bg-white rounded-xl border px-6 shadow-sm overflow-hidden transition-all duration-200"
                style={{ borderColor: hvacTheme.secondaryDark }}
              >
                <AccordionTrigger 
                  className="text-left font-bold hover:no-underline py-5"
                  style={{ color: hvacTheme.dark }}
                >
                  {faq.name}
                </AccordionTrigger>
                <AccordionContent 
                  className="pb-5 leading-relaxed"
                  style={{ color: hvacTheme.gray }}
                >
                  {faq.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <p className="mb-4" style={{ color: hvacTheme.gray }}>Still have questions?</p>
            <button 
              onClick={() => scrollToSection("contact")}
              className="inline-flex items-center px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
              style={{ background: hvacTheme.heroGradient }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* ========== CTA BAND ========== */}
      <section 
        className="py-16 lg:py-20 relative overflow-hidden"
        style={{ background: hvacTheme.heroGradient }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white rounded-full" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Snowflake className="w-12 h-12 mx-auto text-white/30 mb-6 animate-spin" style={{ animationDuration: '10s' }} />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-4">
            Ready for Better Comfort?
          </h2>
          <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Contact us today for a free, no-obligation estimate. We're here to keep you comfortable year-round!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={`tel:${phone || "5551234567"}`}
              className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white font-bold text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{ color: hvacTheme.primary }}
            >
              <Phone className="w-5 h-5 group-hover:animate-pulse" />
              {phone || "(555) 123-4567"}
            </a>
            <button 
              onClick={() => scrollToSection("contact")}
              className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-white/40 text-white hover:bg-white/10 transition-all duration-300"
            >
              Request Online Quote
            </button>
          </div>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section 
        id="contact" 
        className="py-16 lg:py-24"
        style={{ backgroundColor: hvacTheme.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
              style={{ backgroundColor: hvacTheme.primaryLight }}
            >
              <Mail className="w-4 h-4" style={{ color: hvacTheme.primary }} />
              <span className="text-sm font-bold" style={{ color: hvacTheme.primary }}>Contact Us</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4"
              style={{ color: hvacTheme.dark }}
            >
              {pages?.contact?.title || "Get Your Free Estimate"}
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: hvacTheme.gray }}
            >
              {pages?.contact?.metaDescription || "Ready to improve your home comfort? We're just a call away."}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-5">
              <div 
                className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border"
                style={{ borderColor: hvacTheme.secondaryDark }}
              >
                <h3 
                  className="text-xl font-bold mb-6"
                  style={{ color: hvacTheme.dark }}
                >
                  Contact Information
                </h3>
                
                {getContactContent().slice(0, 1).map((section, idx) => (
                  <p key={idx} className="mb-6" style={{ color: hvacTheme.gray }}>{section.content}</p>
                ))}

                <div className="space-y-4">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-4 group p-3 rounded-xl transition-colors hover:bg-blue-50">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: hvacTheme.heroGradient }}
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: hvacTheme.gray }}>Phone</p>
                        <p className="font-bold group-hover:underline" style={{ color: hvacTheme.dark }}>{phone}</p>
                      </div>
                    </a>
                  )}
                  
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-4 group p-3 rounded-xl transition-colors hover:bg-blue-50">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: hvacTheme.heroGradient }}
                      >
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: hvacTheme.gray }}>Email</p>
                        <p className="font-bold group-hover:underline" style={{ color: hvacTheme.dark }}>{email}</p>
                      </div>
                    </a>
                  )}

                  <div className="flex items-center gap-4 p-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: hvacTheme.heroGradient }}
                    >
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: hvacTheme.gray }}>Service Area</p>
                      <p className="font-bold" style={{ color: hvacTheme.dark }}>{businessName} Metro Area</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours Card */}
              <div 
                className="rounded-2xl p-6"
                style={{ background: hvacTheme.heroGradient }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-white" />
                  <h4 className="font-bold text-white">Business Hours</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>Monday - Friday</span>
                    <span className="font-semibold text-white">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Saturday</span>
                    <span className="font-semibold text-white">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Sunday & Emergencies</span>
                    <span className="font-semibold text-white">24/7 On-Call</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div 
                className="bg-white rounded-2xl p-6 lg:p-10 shadow-xl border"
                style={{ borderColor: hvacTheme.secondaryDark }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 
                    className="text-xl lg:text-2xl font-bold"
                    style={{ color: hvacTheme.dark }}
                  >
                    Request a Free Quote
                  </h3>
                  <span 
                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{ backgroundColor: hvacTheme.ctaOrangeLight, color: hvacTheme.ctaOrange }}
                  >
                    Demo Form
                  </span>
                </div>
                
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: hvacTheme.dark }}
                      >
                        Full Name *
                      </label>
                      <Input 
                        placeholder="John Smith" 
                        className="h-12 border-2 transition-colors focus:border-blue-500" 
                        style={{ backgroundColor: hvacTheme.secondary, borderColor: hvacTheme.secondaryDark }}
                        disabled 
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: hvacTheme.dark }}
                      >
                        Phone Number *
                      </label>
                      <Input 
                        placeholder="(555) 123-4567" 
                        className="h-12 border-2 transition-colors focus:border-blue-500" 
                        style={{ backgroundColor: hvacTheme.secondary, borderColor: hvacTheme.secondaryDark }}
                        disabled 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: hvacTheme.dark }}
                    >
                      Email Address
                    </label>
                    <Input 
                      placeholder="john@example.com" 
                      className="h-12 border-2 transition-colors focus:border-blue-500" 
                      style={{ backgroundColor: hvacTheme.secondary, borderColor: hvacTheme.secondaryDark }}
                      disabled 
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: hvacTheme.dark }}
                    >
                      Service Needed *
                    </label>
                    <Input 
                      placeholder="AC Repair, Installation, Maintenance..." 
                      className="h-12 border-2 transition-colors focus:border-blue-500" 
                      style={{ backgroundColor: hvacTheme.secondary, borderColor: hvacTheme.secondaryDark }}
                      disabled 
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: hvacTheme.dark }}
                    >
                      Project Details
                    </label>
                    <Textarea 
                      placeholder="Tell us about your HVAC needs..." 
                      rows={4} 
                      className="border-2 transition-colors focus:border-blue-500"
                      style={{ backgroundColor: hvacTheme.secondary, borderColor: hvacTheme.secondaryDark }}
                      disabled 
                    />
                  </div>
                  
                  <button 
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                    style={{ 
                      background: hvacTheme.ctaGradient,
                      boxShadow: `0 10px 30px -10px ${hvacTheme.ctaOrange}60`,
                    }}
                    disabled
                  >
                    {hero?.primaryCTA || "Get My Free Quote"}
                  </button>

                  <p 
                    className="text-center text-xs"
                    style={{ color: hvacTheme.gray }}
                  >
                    By submitting, you agree to our terms and privacy policy.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PREMIUM FOOTER ========== */}
      <footer 
        className="py-14 lg:py-20"
        style={{ background: hvacTheme.darkGradient }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                  style={{ background: hvacTheme.heroGradient }}
                >
                  <Snowflake className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">{businessName}</span>
                  <p className="text-xs text-gray-400">HVAC Specialists</p>
                </div>
              </div>
              <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
                Your trusted local HVAC experts. Professional heating, cooling, and air quality solutions with guaranteed satisfaction.
              </p>
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 text-lg font-bold transition-colors hover:opacity-80"
                  style={{ color: hvacTheme.accent }}
                >
                  <Phone className="w-5 h-5" />
                  {phone}
                </a>
              )}
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold mb-5 uppercase tracking-wider text-gray-400">Quick Links</h4>
              <ul className="space-y-3">
                {navigation?.slice(0, 6).map((navItem, idx) => (
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
            
            {/* Contact & Hours */}
            <div>
              <h4 className="text-sm font-bold mb-5 uppercase tracking-wider text-gray-400">Contact & Hours</h4>
              <div className="space-y-3 text-gray-400 text-sm">
                {phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {phone}</p>}
                {email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {email}</p>}
                <div className="pt-2">
                  <p className="font-medium text-white mb-1">Business Hours</p>
                  <p>Mon-Fri: 8am-6pm</p>
                  <p>Sat: 9am-4pm</p>
                  <p>Emergency: 24/7</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div 
            className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span>© {new Date().getFullYear()} {businessName}</span>
              <span className="hidden sm:inline">•</span>
              <span>Licensed & Insured</span>
              <span className="hidden sm:inline">•</span>
              <span>All Rights Reserved</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-500">
              <span className="hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-gray-300 cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-3 sm:hidden z-40 border-t"
        style={{ backgroundColor: 'white', borderColor: hvacTheme.secondaryDark }}
      >
        <a 
          href={`tel:${phone || "5551234567"}`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg"
          style={{ background: hvacTheme.ctaGradient }}
        >
          <Phone className="w-5 h-5" />
          Call Now - {phone || "(555) 123-4567"}
        </a>
      </div>

      {/* ========== INTERNAL TECHNICAL NOTES ========== */}
      <div 
        className="py-12 border-t-4"
        style={{ backgroundColor: hvacTheme.ctaOrangeLight, borderColor: hvacTheme.ctaOrange }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: hvacTheme.ctaOrange }}
            />
            <h3 className="text-xl font-bold" style={{ color: hvacTheme.dark }}>
              Internal Implementation Notes
            </h3>
            <span 
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ backgroundColor: `${hvacTheme.ctaOrange}20`, color: hvacTheme.ctaOrange }}
            >
              Not visible to clients
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: hvacTheme.secondaryDark }}>
              <h4 className="font-bold mb-3 flex items-center gap-2" style={{ color: hvacTheme.dark }}>
                <ExternalLink className="w-4 h-4" style={{ color: hvacTheme.primary }} />
                Layout Notes
              </h4>
              <p className="text-sm" style={{ color: hvacTheme.gray }}>
                {technical?.layout || "Single page with anchor navigation, mobile-first design"}
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: hvacTheme.secondaryDark }}>
              <h4 className="font-bold mb-3" style={{ color: hvacTheme.dark }}>Performance</h4>
              <ul className="text-sm space-y-1.5" style={{ color: hvacTheme.gray }}>
                {technical?.performance?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span style={{ color: hvacTheme.primary }}>•</span>
                    {item}
                  </li>
                )) || <li>• Standard optimization applied</li>}
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-5 border shadow-sm" style={{ borderColor: hvacTheme.secondaryDark }}>
              <h4 className="font-bold mb-3" style={{ color: hvacTheme.dark }}>Accessibility</h4>
              <ul className="text-sm space-y-1.5" style={{ color: hvacTheme.gray }}>
                {technical?.accessibility?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span style={{ color: hvacTheme.primary }}>•</span>
                    {item}
                  </li>
                )) || <li>• WCAG 2.1 AA compliance</li>}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t" style={{ borderColor: `${hvacTheme.ctaOrange}30` }}>
            <h4 className="font-bold mb-4" style={{ color: hvacTheme.dark }}>SEO Titles & Meta Descriptions</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages && Object.entries(pages).map(([pageName, pageData]) => (
                <div 
                  key={pageName} 
                  className="bg-white p-4 rounded-xl border shadow-sm"
                  style={{ borderColor: hvacTheme.secondaryDark }}
                >
                  <p 
                    className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: hvacTheme.primary }}
                  >
                    {pageName}
                  </p>
                  <p 
                    className="font-medium text-sm mb-1 line-clamp-1"
                    style={{ color: hvacTheme.dark }}
                  >
                    {pageData?.seoTitle || "N/A"}
                  </p>
                  <p 
                    className="text-xs line-clamp-2"
                    style={{ color: hvacTheme.gray }}
                  >
                    {pageData?.metaDescription || "N/A"}
                  </p>
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
