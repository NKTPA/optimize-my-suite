import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Shield, 
  Clock, Award, Users, Sparkles, Camera, MessageCircle,
  ChevronRight, Menu, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WebsiteBlueprint } from "@/types/blueprint";
import { useEffect, useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  fetchServiceImages, 
  inferServiceType, 
  ServiceImage,
} from "@/lib/serviceImages";
import { 
  generateDesignSystem, 
  getGoogleFontsUrl,
  type DesignSystem,
  type ColorTheme,
} from "@/lib/designSystem";

interface LocationState {
  blueprint: WebsiteBlueprint;
  businessName: string;
  phone?: string;
  email?: string;
  industry?: string;
}

const GeneratedSitePreview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Infer service type from business content
  const inferredServiceType = useMemo(() => {
    if (!state) return 'home services';
    return state.industry || inferServiceType({
      businessName: state.businessName,
      headline: state.blueprint?.hero?.headline,
      services: state.blueprint?.pages?.services?.sections?.map(s => s.name) || [],
      industry: state.industry,
    });
  }, [state]);

  // Generate unique design system for this client
  const designSystem = useMemo(() => generateDesignSystem(inferredServiceType), [inferredServiceType]);
  const { colors, icons, style, typography } = designSystem;
  const PrimaryIcon = icons.primary;

  // Load Google Fonts dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.href = getGoogleFontsUrl(designSystem);
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [designSystem]);

  // Fetch dynamic images
  useEffect(() => {
    const loadImages = async () => {
      setImagesLoading(true);
      try {
        const result = await fetchServiceImages(inferredServiceType, 10);
        setServiceImages(result.images);
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setImagesLoading(false);
      }
    };
    loadImages();
  }, [inferredServiceType]);

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
  const { hero, navigation, pages } = blueprint;

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

  // Helper to get image by index
  const getImage = (index: number) => serviceImages[index % serviceImages.length] || { url: '', alt: '' };

  const galleryContent = getGalleryContent();
  const galleryImages = galleryContent.length > 0 
    ? galleryContent.slice(0, 6)
    : serviceImages.slice(0, 6).map((img, i) => ({ name: `Project ${i + 1}`, content: img.alt || "Quality service completed" }));

  // Dynamic styles based on design system
  const fontStyles = {
    heading: { fontFamily: typography.heading, fontWeight: typography.headingWeight },
    body: { fontFamily: typography.body, fontWeight: typography.bodyWeight },
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: typography.body }}>
      {/* Internal Preview Banner */}
      <div 
        className="py-2.5 px-4"
        style={{ background: colors.ctaLight, borderBottom: `1px solid ${colors.cta}30` }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: colors.cta }}
            />
            <p className="text-xs sm:text-sm font-semibold" style={{ color: colors.cta }}>
              ✦ Internal Preview — Implementation Reference Only
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-1.5 text-xs sm:text-sm h-8"
            style={{ color: colors.cta }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Builder</span>
          </Button>
        </div>
      </div>

      {/* Premium Sticky Navigation */}
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}
        style={{ 
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'white',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.secondaryDark}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div 
                className="relative w-11 h-11 lg:w-12 lg:h-12 flex items-center justify-center text-white font-bold text-lg lg:text-xl overflow-hidden"
                style={{ background: colors.heroGradient, borderRadius: style.borderRadius.button }}
              >
                <PrimaryIcon className="w-6 h-6 absolute opacity-20 -top-1 -left-1" />
                <span className="relative z-10" style={fontStyles.heading}>{businessName?.charAt(0) || "A"}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg lg:text-xl font-bold" style={{ color: colors.dark, ...fontStyles.heading }}>
                  {businessName}
                </span>
                <p className="text-xs" style={{ color: colors.gray }}>{colors.industryLabel}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation?.map((navItem, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                  className="px-4 py-2.5 text-sm font-medium transition-all duration-200"
                  style={{ color: colors.dark, borderRadius: style.borderRadius.button }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {navItem}
                </button>
              ))}
            </div>

            {/* CTA + Mobile Menu */}
            <div className="flex items-center gap-3">
              <a 
                href={`tel:${phone || "5551234567"}`}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                style={{ 
                  background: colors.ctaGradient,
                  borderRadius: style.borderRadius.button,
                  boxShadow: style.shadows.button,
                }}
              >
                <Phone className="w-4 h-4 group-hover:animate-pulse" />
                <span className="text-sm">{hero?.primaryCTA?.split(' ').slice(0, 3).join(' ') || "Get Free Quote"}</span>
              </a>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 transition-colors"
                style={{ backgroundColor: colors.primaryLight, borderRadius: style.borderRadius.button }}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" style={{ color: colors.primary }} />
                ) : (
                  <Menu className="w-5 h-5" style={{ color: colors.primary }} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div 
              className="lg:hidden py-4 border-t animate-fade-in"
              style={{ backgroundColor: 'white', borderColor: colors.secondaryDark }}
            >
              <div className="space-y-1">
                {navigation?.map((navItem, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                    className="w-full text-left px-4 py-3.5 text-base font-medium transition-colors"
                    style={{ color: colors.dark, borderRadius: style.borderRadius.button }}
                  >
                    {navItem}
                  </button>
                ))}
              </div>
              <div className="pt-4 px-4">
                <a 
                  href={`tel:${phone || "5551234567"}`}
                  className="flex items-center justify-center gap-2 w-full py-4 text-white font-bold shadow-lg"
                  style={{ background: colors.ctaGradient, borderRadius: style.borderRadius.button }}
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
        {/* Enhanced Layered Background with Vignette */}
        <div 
          className="absolute inset-0" 
          style={{ 
            background: `
              radial-gradient(ellipse 80% 50% at 50% -10%, ${colors.primary}15 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 100% 0%, ${colors.accent}10 0%, transparent 50%),
              ${colors.overlayGradient}
            `,
          }} 
        />
        {/* Subtle Vignette Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: `radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, ${colors.dark}08 100%)`,
          }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04]"
          style={{ 
            backgroundImage: `radial-gradient(${colors.primary} 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Enhanced Floating Decorative Elements */}
        <div 
          className="absolute top-10 left-5 w-80 h-80 rounded-full blur-[100px] opacity-25 animate-pulse-slow"
          style={{ backgroundColor: colors.primary }}
        />
        <div 
          className="absolute bottom-10 right-5 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: colors.accent }}
        />
        <div 
          className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-[80px] opacity-10"
          style={{ backgroundColor: colors.cta }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 xl:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content - Mobile First */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              {/* Offer Badge with Enhanced Glow Effect */}
              {hero?.offerBadge && (
                <div 
                  className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-7 animate-scale-in"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.accentLight} 100%)`,
                    boxShadow: `0 0 30px ${colors.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                    borderRadius: style.borderRadius.badge,
                    border: `1px solid ${colors.primary}20`,
                  }}
                >
                  <PrimaryIcon className="w-4 h-4 animate-spin" style={{ color: colors.primary, animationDuration: '3s' }} />
                  <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>
                    {hero.offerBadge}
                  </span>
                </div>
              )}
              
              {/* Enhanced Main Headline - Larger & Tighter */}
              <h1 
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] tracking-tight mb-6 lg:mb-7 animate-fade-in"
                style={{ color: colors.dark, ...fontStyles.heading }}
              >
                {hero?.headline || `Expert ${colors.industryLabel} for Your Home`}
              </h1>
              
              {/* Enhanced Subheadline - Improved Readability */}
              <p 
                className="text-lg lg:text-xl xl:text-2xl leading-relaxed mb-8 lg:mb-10 max-w-xl mx-auto lg:mx-0"
                style={{ color: colors.gray, lineHeight: 1.7 }}
              >
                {hero?.subheadline || "Professional service with fast response, fair pricing, and guaranteed satisfaction."}
              </p>

              {/* Enhanced Bullet Points with Industry Icons */}
              {hero?.bullets && hero.bullets.length > 0 && (
                <ul className="space-y-4 mb-10 text-left max-w-md mx-auto lg:mx-0">
                  {hero.bullets.slice(0, 4).map((bullet, idx) => {
                    const IconComponent = icons.icons[idx % icons.icons.length];
                    return (
                      <li 
                        key={idx} 
                        className="flex items-start gap-4 animate-fade-in"
                        style={{ animationDelay: `${idx * 120}ms` }}
                      >
                        <div 
                          className="mt-0.5 w-8 h-8 flex items-center justify-center shrink-0 shadow-lg"
                          style={{ 
                            background: colors.heroGradient, 
                            borderRadius: style.borderRadius.button,
                            boxShadow: `0 4px 12px ${colors.primary}40`,
                          }}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-base" style={{ color: colors.dark }}>{bullet}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Enhanced CTA Buttons with Micro-animations */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <a 
                  href={`tel:${phone || "5551234567"}`}
                  className="group relative flex items-center justify-center gap-3 px-10 py-5 text-white font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:brightness-110 hover:shadow-3xl active:scale-[0.98] overflow-hidden"
                  style={{ 
                    background: colors.ctaGradient,
                    boxShadow: `0 20px 50px -12px ${colors.cta}60`,
                    borderRadius: style.borderRadius.button,
                  }}
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <Phone className="w-5 h-5 relative z-10 group-hover:animate-pulse" />
                  <span className="relative z-10">{hero?.primaryCTA || "Get Free Estimate"}</span>
                </a>
                {hero?.secondaryCTA && (
                  <button 
                    onClick={() => scrollToSection("services")}
                    className="px-10 py-5 font-semibold text-lg border-2 transition-all duration-300 hover:shadow-xl hover:bg-opacity-5 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                      borderColor: colors.primary,
                      color: colors.primary,
                      borderRadius: style.borderRadius.button,
                      backgroundColor: `${colors.primary}05`,
                    }}
                  >
                    {hero.secondaryCTA}
                  </button>
                )}
              </div>

              {/* Enhanced Trust Badges Row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 lg:gap-8">
                {[
                  { icon: Shield, text: "Licensed & Insured" },
                  { icon: Clock, text: "Fast Response" },
                  { icon: Star, text: "5-Star Rated", isStar: true },
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2.5 animate-fade-in px-3 py-1.5 rounded-full"
                    style={{ 
                      animationDelay: `${(idx + 4) * 100}ms`,
                      backgroundColor: `${colors.primary}08`,
                    }}
                  >
                    <item.icon 
                      className={`w-5 h-5 ${item.isStar ? 'fill-amber-400 text-amber-400' : ''}`}
                      style={!item.isStar ? { color: colors.primary } : undefined}
                    />
                    <span className="text-sm font-bold" style={{ color: colors.dark }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Enhanced Premium Hero Image */}
            <div className="order-1 lg:order-2 relative">
              {/* Enhanced Decorative Ring with Animation */}
              <div 
                className="absolute -inset-6 lg:-inset-8 opacity-40 blur-3xl animate-pulse-slow"
                style={{ background: colors.heroGradient, borderRadius: style.borderRadius.image }}
              />
              
              {/* Main Image Container with Premium Shadow */}
              <div 
                className="relative overflow-hidden border-4 border-white/90"
                style={{ 
                  borderRadius: style.borderRadius.image,
                  boxShadow: `0 40px 80px -20px ${colors.dark}30, 0 20px 40px -15px ${colors.primary}20`,
                }}
              >
                {imagesLoading ? (
                  <div className="w-full h-80 sm:h-96 lg:h-[560px] flex items-center justify-center" style={{ background: colors.subtleGradient }}>
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.primary }} />
                  </div>
                ) : (
                  <img 
                    src={getImage(0).url}
                    alt={getImage(0).alt || `${businessName} Professional Service`}
                    className="w-full h-80 sm:h-96 lg:h-[560px] object-cover"
                  />
                )}
                {/* Enhanced Gradient Overlay with Vignette */}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `
                      linear-gradient(180deg, transparent 30%, ${colors.primary}08 60%, ${colors.dark}90 100%),
                      radial-gradient(ellipse at center, transparent 50%, ${colors.dark}20 100%)
                    `,
                  }}
                />
                
                {/* Premium Badge Overlay - Top Right */}
                <div 
                  className="absolute top-5 right-5 lg:top-6 lg:right-6 px-4 py-3 backdrop-blur-xl border shadow-xl"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: style.borderRadius.button,
                    borderColor: 'rgba(255,255,255,0.3)',
                    boxShadow: `0 10px 40px -10px ${colors.dark}30`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ background: colors.heroGradient, borderRadius: '50%' }}
                    >
                      <PrimaryIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold" style={{ color: colors.dark }}>{colors.industryLabel}</span>
                  </div>
                </div>
                
                {/* Enhanced Floating Contact Card */}
                <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-auto lg:max-w-sm">
                  <div 
                    className="backdrop-blur-xl p-5 lg:p-6 border"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.97)', 
                      borderRadius: style.borderRadius.card,
                      borderColor: 'rgba(255,255,255,0.4)',
                      boxShadow: `0 20px 60px -15px ${colors.dark}40`,
                    }}
                  >
                    <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: colors.gray }}>
                      Call now for a free estimate
                    </p>
                    <a 
                      href={`tel:${phone || "5551234567"}`}
                      className="flex items-center gap-2.5 text-xl lg:text-2xl font-bold transition-colors hover:opacity-80"
                      style={{ color: colors.primary }}
                    >
                      <Phone className="w-5 h-5 lg:w-6 lg:h-6" />
                      {phone || "(555) 123-4567"}
                    </a>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: colors.secondaryDark }}>
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold" style={{ color: colors.gray }}>200+ 5-Star Reviews</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ENHANCED TRUST ROW ========== */}
      <section 
        className="py-8 lg:py-10 border-y relative overflow-hidden"
        style={{ backgroundColor: colors.secondary, borderColor: colors.secondaryDark }}
      >
        {/* Subtle background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{ 
            backgroundImage: `radial-gradient(${colors.primary} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 lg:gap-x-16">
            {[
              { icon: icons.trustIcons[0], text: "Licensed & Insured", color: colors.primary },
              { icon: icons.trustIcons[1], text: "Same-Day Service", color: colors.accent },
              { icon: icons.trustIcons[2], text: "24/7 Support", color: colors.cta },
              { icon: icons.trustIcons[3], text: "Satisfaction Guaranteed", color: colors.primary },
              { icon: icons.trustIcons[4], text: "Free Estimates", color: colors.accent },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 group transition-transform duration-200 hover:scale-105"
              >
                <div 
                  className="w-12 h-12 flex items-center justify-center shadow-md transition-shadow duration-300 group-hover:shadow-lg"
                  style={{ 
                    backgroundColor: `${item.color}12`, 
                    borderRadius: style.borderRadius.button,
                    border: `1px solid ${item.color}20`,
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="font-bold text-sm" style={{ color: colors.dark }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ENHANCED SERVICES SECTION ========== */}
      <section id="services" className="py-20 lg:py-28 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{ 
            backgroundImage: `radial-gradient(${colors.primary} 1.5px, transparent 1.5px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Subtle gradient overlay */}
        <div 
          className="absolute top-0 left-0 right-0 h-40 opacity-50"
          style={{ 
            background: `linear-gradient(180deg, ${colors.secondary} 0%, transparent 100%)`,
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* Enhanced Section Header */}
          <div className="text-center mb-14 lg:mb-20">
            <div 
              className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-6 shadow-sm"
              style={{ 
                backgroundColor: colors.primaryLight, 
                borderRadius: style.borderRadius.badge,
                border: `1px solid ${colors.primary}15`,
              }}
            >
              <PrimaryIcon className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>Our Services</span>
            </div>
            <h2 
              className="text-3xl lg:text-5xl xl:text-6xl mb-5 tracking-tight"
              style={{ color: colors.dark, ...fontStyles.heading, lineHeight: 1.1 }}
            >
              {pages?.services?.title || `Complete ${colors.industryLabel} Solutions`}
            </h2>
            <p 
              className="text-lg lg:text-xl max-w-2xl mx-auto"
              style={{ color: colors.gray, lineHeight: 1.7 }}
            >
              {pages?.services?.metaDescription || "Professional service solutions tailored to your needs."}
            </p>
          </div>

          {/* Enhanced Services Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {getServicesContent().slice(0, 6).map((service, idx) => {
              const IconComponent = icons.icons[idx % icons.icons.length];
              return (
                <div 
                  key={idx} 
                  className="group relative bg-white p-7 lg:p-9 border transition-all duration-500 hover:-translate-y-2"
                  style={{ 
                    borderColor: colors.secondaryDark,
                    boxShadow: style.shadows.card,
                    borderRadius: style.borderRadius.card,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = style.shadows.cardHover;
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = style.shadows.card;
                    e.currentTarget.style.borderColor = colors.secondaryDark;
                  }}
                >
                  {/* Accent line on hover */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ 
                      background: colors.heroGradient,
                      borderRadius: `${style.borderRadius.card} ${style.borderRadius.card} 0 0`,
                    }}
                  />
                  
                  {/* Enhanced Icon Container */}
                  <div 
                    className="w-16 h-16 lg:w-18 lg:h-18 flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                    style={{ 
                      background: colors.heroGradient, 
                      borderRadius: style.borderRadius.button,
                      boxShadow: `0 10px 30px -8px ${colors.primary}40`,
                    }}
                  >
                    <IconComponent className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
                  </div>
                  
                  <h3 
                    className="text-xl lg:text-2xl mb-4 tracking-tight"
                    style={{ color: colors.dark, ...fontStyles.heading }}
                  >
                    {service.name}
                  </h3>
                  <p 
                    className="mb-6 leading-relaxed text-base"
                    style={{ color: colors.gray, lineHeight: 1.7 }}
                  >
                    {service.content?.substring(0, 140)}...
                  </p>
                  
                  <button 
                    className="inline-flex items-center font-bold transition-all duration-300 group-hover:gap-3"
                    style={{ color: colors.primary }}
                    onClick={() => scrollToSection("contact")}
                  >
                    Get a Quote 
                    <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-2" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== ENHANCED WHY CHOOSE US ========== */}
      <section 
        id="why-choose-us" 
        className="py-20 lg:py-28 relative overflow-hidden"
        style={{ 
          background: `
            linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primaryLight}40 50%, ${colors.secondary} 100%)
          `,
        }}
      >
        {/* Decorative blurs */}
        <div 
          className="absolute top-20 left-10 w-72 h-72 rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: colors.primary }}
        />
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-[120px] opacity-15"
          style={{ backgroundColor: colors.accent }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 lg:mb-20">
            <div 
              className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-6 shadow-sm"
              style={{ 
                backgroundColor: colors.accentLight, 
                borderRadius: style.borderRadius.badge,
                border: `1px solid ${colors.accent}15`,
              }}
            >
              <Award className="w-4 h-4" style={{ color: colors.accent }} />
              <span className="text-sm font-bold tracking-wide" style={{ color: colors.accent }}>Why Choose Us</span>
            </div>
            <h2 
              className="text-3xl lg:text-5xl xl:text-6xl mb-5 tracking-tight"
              style={{ color: colors.dark, ...fontStyles.heading, lineHeight: 1.1 }}
            >
              The Team You Can Trust
            </h2>
            <p 
              className="text-lg lg:text-xl max-w-2xl mx-auto"
              style={{ color: colors.gray, lineHeight: 1.7 }}
            >
              Homeowners and businesses choose us for reliable, professional services
            </p>
          </div>

          {/* Enhanced Benefits Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: "Fully certified professionals with comprehensive coverage" },
              { icon: Clock, title: "Fast Response", desc: "Same-day service with flexible scheduling options" },
              { icon: Award, title: "Quality Guaranteed", desc: "100% satisfaction guarantee on all services" },
              { icon: Users, title: "Expert Team", desc: "Skilled technicians with years of experience" },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="group bg-white p-6 lg:p-8 border text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
                style={{ 
                  borderColor: colors.secondaryDark,
                  boxShadow: style.shadows.card,
                  borderRadius: style.borderRadius.card,
                }}
              >
                <div 
                  className="w-14 h-14 lg:w-16 lg:h-16 mx-auto flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110"
                  style={{ 
                    backgroundColor: colors.primaryLight, 
                    borderRadius: style.borderRadius.button,
                    border: `2px solid ${colors.primary}20`,
                  }}
                >
                  <item.icon className="w-7 h-7 lg:w-8 lg:h-8" style={{ color: colors.primary }} />
                </div>
                <h3 className="font-bold text-lg mb-3" style={{ color: colors.dark, ...fontStyles.heading }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.gray }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ENHANCED ABOUT SECTION ========== */}
      <section id="about-us" className="py-20 lg:py-28 relative overflow-hidden">
        {/* Subtle background accent */}
        <div 
          className="absolute top-0 right-0 w-1/2 h-full opacity-[0.02]"
          style={{ 
            backgroundImage: `radial-gradient(${colors.primary} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Enhanced Image */}
            <div className="relative">
              <div 
                className="absolute -inset-6 opacity-30 blur-3xl animate-pulse-slow"
                style={{ background: colors.subtleGradient, borderRadius: style.borderRadius.image }}
              />
              <div 
                className="relative overflow-hidden border-4 border-white"
                style={{ 
                  borderRadius: style.borderRadius.image,
                  boxShadow: `0 40px 80px -20px ${colors.dark}30, 0 20px 40px -15px ${colors.primary}15`,
                }}
              >
                {imagesLoading ? (
                  <div className="w-full h-96 lg:h-[500px] flex items-center justify-center" style={{ background: colors.subtleGradient }}>
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.primary }} />
                  </div>
                ) : (
                  <img 
                    src={getImage(2).url}
                    alt={getImage(2).alt || `${businessName} team`}
                    className="w-full h-96 lg:h-[500px] object-cover"
                  />
                )}
                <div 
                  className="absolute inset-0"
                  style={{ 
                    background: `
                      linear-gradient(180deg, transparent 40%, ${colors.dark}50 100%),
                      radial-gradient(ellipse at center, transparent 60%, ${colors.dark}20 100%)
                    `,
                  }}
                />
                
                {/* Experience badge */}
                <div 
                  className="absolute bottom-6 left-6 px-5 py-4 backdrop-blur-xl border"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: style.borderRadius.button,
                    borderColor: 'rgba(255,255,255,0.3)',
                    boxShadow: `0 10px 40px -10px ${colors.dark}30`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ background: colors.heroGradient, borderRadius: '50%' }}
                    >
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: colors.dark }}>15+</p>
                      <p className="text-xs font-semibold" style={{ color: colors.gray }}>Years Experience</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Content */}
            <div>
              <div 
                className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-6 shadow-sm"
                style={{ 
                  backgroundColor: colors.primaryLight, 
                  borderRadius: style.borderRadius.badge,
                  border: `1px solid ${colors.primary}15`,
                }}
              >
                <Users className="w-4 h-4" style={{ color: colors.primary }} />
                <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>About Us</span>
              </div>
              
              <h2 
                className="text-3xl lg:text-5xl xl:text-6xl mb-7 tracking-tight"
                style={{ color: colors.dark, ...fontStyles.heading, lineHeight: 1.1 }}
              >
                {pages?.about?.title || `About ${businessName}`}
              </h2>
              
              <div className="space-y-6 mb-10">
                {getAboutContent().slice(0, 3).map((section, idx) => (
                  <div key={idx} className="group">
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: colors.dark }}
                    >
                      {section.name}
                    </h3>
                    <p 
                      className="leading-relaxed text-base"
                      style={{ color: colors.gray, lineHeight: 1.8 }}
                    >
                      {section.content?.substring(0, 180)}...
                    </p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => scrollToSection("contact")}
                className="group relative inline-flex items-center px-9 py-5 font-bold text-lg text-white shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] overflow-hidden"
                style={{ 
                  background: colors.ctaGradient,
                  boxShadow: `0 20px 50px -12px ${colors.cta}60`,
                  borderRadius: style.borderRadius.button,
                }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10">Get In Touch</span>
                <ChevronRight className="w-5 h-5 ml-2 relative z-10 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ENHANCED GALLERY SECTION ========== */}
      <section 
        id="gallery" 
        className="py-20 lg:py-28"
        style={{ backgroundColor: colors.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 lg:mb-20">
            <div 
              className="inline-flex items-center gap-2.5 px-5 py-2.5 mb-6 shadow-sm"
              style={{ 
                backgroundColor: colors.primaryLight, 
                borderRadius: style.borderRadius.badge,
                border: `1px solid ${colors.primary}15`,
              }}
            >
              <Camera className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-sm font-bold tracking-wide" style={{ color: colors.primary }}>Our Work</span>
            </div>
            <h2 
              className="text-3xl lg:text-5xl xl:text-6xl mb-5 tracking-tight"
              style={{ color: colors.dark, ...fontStyles.heading, lineHeight: 1.1 }}
            >
              {pages?.gallery?.title || "Recent Projects"}
            </h2>
            <p 
              className="text-lg lg:text-xl max-w-2xl mx-auto"
              style={{ color: colors.gray, lineHeight: 1.7 }}
            >
              {pages?.gallery?.metaDescription || "See examples of our professional work"}
            </p>
          </div>

          {/* Enhanced Gallery Grid - Uniform Aspect Ratios with Premium Shadows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            {galleryImages.map((item, idx) => (
              <div 
                key={idx} 
                className="group relative overflow-hidden cursor-pointer aspect-[4/3] transition-all duration-500 hover:-translate-y-2"
                style={{ 
                  borderRadius: style.borderRadius.image,
                  boxShadow: `0 10px 40px -15px ${colors.dark}20`,
                }}
              >
                {imagesLoading ? (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: colors.subtleGradient }}>
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: colors.primary }} />
                  </div>
                ) : (
                  <img 
                    src={getImage(idx).url}
                    alt={getImage(idx).alt || item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                {/* Enhanced overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{ 
                    background: `linear-gradient(180deg, transparent 20%, ${colors.dark}40 60%, ${colors.primary}ee 100%)`,
                  }}
                />
                {/* Info slide up */}
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 text-white mb-2">
                    <div 
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}
                    >
                      <PrimaryIcon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-lg">{item.name}</span>
                  </div>
                  <p className="text-white/90 text-sm">{item.content}</p>
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
              className="inline-flex items-center gap-2 px-4 py-2 mb-5"
              style={{ backgroundColor: colors.accentLight, borderRadius: style.borderRadius.badge }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: colors.accent }} />
              <span className="text-sm font-bold" style={{ color: colors.accent }}>FAQ</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl mb-4"
              style={{ color: colors.dark, ...fontStyles.heading }}
            >
              {pages?.faq?.title || "Frequently Asked Questions"}
            </h2>
            <p style={{ color: colors.gray }}>
              Find answers to common questions
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {getFaqContent().map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="bg-white px-6 shadow-sm overflow-hidden transition-all duration-200"
                style={{ borderColor: colors.secondaryDark, borderWidth: '1px', borderRadius: style.borderRadius.card }}
              >
                <AccordionTrigger 
                  className="text-left font-bold hover:no-underline py-5"
                  style={{ color: colors.dark }}
                >
                  {faq.name}
                </AccordionTrigger>
                <AccordionContent 
                  className="pb-5 leading-relaxed"
                  style={{ color: colors.gray }}
                >
                  {faq.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <p className="mb-4" style={{ color: colors.gray }}>Still have questions?</p>
            <button 
              onClick={() => scrollToSection("contact")}
              className="inline-flex items-center px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
              style={{ background: colors.heroGradient, borderRadius: style.borderRadius.button }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* ========== ENHANCED CTA BAND ========== */}
      <section 
        className="py-20 lg:py-28 relative overflow-hidden"
        style={{ background: colors.heroGradient }}
      >
        {/* Enhanced Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-48 h-48 border-2 border-white rounded-full animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 w-72 h-72 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/20 rounded-full" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <PrimaryIcon className="w-14 h-14 mx-auto text-white/40 mb-8 animate-spin" style={{ animationDuration: '10s' }} />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white mb-6 tracking-tight" style={fontStyles.heading}>
            Ready to Get Started?
          </h2>
          <p className="text-lg lg:text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Contact us today for a free, no-obligation estimate. We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <a 
              href={`tel:${phone || "5551234567"}`}
              className="group relative flex items-center justify-center gap-3 px-10 py-5 bg-white font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-3xl overflow-hidden"
              style={{ color: colors.primary, borderRadius: style.borderRadius.button }}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
              <Phone className="w-5 h-5 relative z-10 group-hover:animate-pulse" />
              <span className="relative z-10">{phone || "(555) 123-4567"}</span>
            </a>
            <button 
              onClick={() => scrollToSection("contact")}
              className="px-10 py-5 font-bold text-lg border-2 border-white/50 text-white hover:bg-white/15 transition-all duration-300 hover:border-white hover:scale-[1.02]"
              style={{ borderRadius: style.borderRadius.button }}
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
        style={{ backgroundColor: colors.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 mb-5"
              style={{ backgroundColor: colors.primaryLight, borderRadius: style.borderRadius.badge }}
            >
              <Mail className="w-4 h-4" style={{ color: colors.primary }} />
              <span className="text-sm font-bold" style={{ color: colors.primary }}>Contact Us</span>
            </div>
            <h2 
              className="text-3xl lg:text-4xl xl:text-5xl mb-4"
              style={{ color: colors.dark, ...fontStyles.heading }}
            >
              {pages?.contact?.title || "Get Your Free Estimate"}
            </h2>
            <p 
              className="text-lg max-w-2xl mx-auto"
              style={{ color: colors.gray }}
            >
              {pages?.contact?.metaDescription || "Ready to get started? We're just a call away."}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-5">
              <div 
                className="bg-white p-6 lg:p-8 shadow-lg"
                style={{ borderColor: colors.secondaryDark, borderWidth: '1px', borderRadius: style.borderRadius.card }}
              >
                <h3 
                  className="text-xl font-bold mb-6"
                  style={{ color: colors.dark }}
                >
                  Contact Information
                </h3>
                
                {getContactContent().slice(0, 1).map((section, idx) => (
                  <p key={idx} className="mb-6" style={{ color: colors.gray }}>{section.content?.substring(0, 150)}...</p>
                ))}

                <div className="space-y-4">
                  {phone && (
                    <a href={`tel:${phone}`} className="flex items-center gap-4 group p-3 transition-colors" style={{ borderRadius: style.borderRadius.button }}>
                      <div 
                        className="w-12 h-12 flex items-center justify-center"
                        style={{ background: colors.heroGradient, borderRadius: style.borderRadius.button }}
                      >
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.gray }}>Phone</p>
                        <p className="font-bold group-hover:underline" style={{ color: colors.dark }}>{phone}</p>
                      </div>
                    </a>
                  )}
                  
                  {email && (
                    <a href={`mailto:${email}`} className="flex items-center gap-4 group p-3 transition-colors" style={{ borderRadius: style.borderRadius.button }}>
                      <div 
                        className="w-12 h-12 flex items-center justify-center"
                        style={{ background: colors.heroGradient, borderRadius: style.borderRadius.button }}
                      >
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.gray }}>Email</p>
                        <p className="font-bold group-hover:underline" style={{ color: colors.dark }}>{email}</p>
                      </div>
                    </a>
                  )}

                  <div className="flex items-center gap-4 p-3">
                    <div 
                      className="w-12 h-12 flex items-center justify-center"
                      style={{ background: colors.heroGradient, borderRadius: style.borderRadius.button }}
                    >
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: colors.gray }}>Service Area</p>
                      <p className="font-bold" style={{ color: colors.dark }}>{businessName} Metro Area</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours Card */}
              <div 
                className="p-6"
                style={{ background: colors.heroGradient, borderRadius: style.borderRadius.card }}
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
                className="bg-white p-6 lg:p-10 shadow-xl"
                style={{ borderColor: colors.secondaryDark, borderWidth: '1px', borderRadius: style.borderRadius.card }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 
                    className="text-xl lg:text-2xl font-bold"
                    style={{ color: colors.dark }}
                  >
                    Request a Free Quote
                  </h3>
                  <span 
                    className="text-xs px-3 py-1.5 font-semibold"
                    style={{ backgroundColor: colors.ctaLight, color: colors.cta, borderRadius: style.borderRadius.badge }}
                  >
                    Demo Form
                  </span>
                </div>
                
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.dark }}
                      >
                        Full Name *
                      </label>
                      <Input 
                        placeholder="John Smith" 
                        className="h-12 border-2 transition-colors" 
                        style={{ backgroundColor: colors.secondary, borderColor: colors.secondaryDark, borderRadius: style.borderRadius.button }}
                        disabled 
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-semibold mb-2"
                        style={{ color: colors.dark }}
                      >
                        Phone Number *
                      </label>
                      <Input 
                        placeholder="(555) 123-4567" 
                        className="h-12 border-2 transition-colors" 
                        style={{ backgroundColor: colors.secondary, borderColor: colors.secondaryDark, borderRadius: style.borderRadius.button }}
                        disabled 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.dark }}
                    >
                      Email Address
                    </label>
                    <Input 
                      placeholder="john@example.com" 
                      className="h-12 border-2 transition-colors" 
                      style={{ backgroundColor: colors.secondary, borderColor: colors.secondaryDark, borderRadius: style.borderRadius.button }}
                      disabled 
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.dark }}
                    >
                      Service Needed
                    </label>
                    <Input 
                      placeholder={`Select ${colors.industryLabel} Service`}
                      className="h-12 border-2 transition-colors" 
                      style={{ backgroundColor: colors.secondary, borderColor: colors.secondaryDark, borderRadius: style.borderRadius.button }}
                      disabled 
                    />
                  </div>

                  <div>
                    <label 
                      className="block text-sm font-semibold mb-2"
                      style={{ color: colors.dark }}
                    >
                      Message
                    </label>
                    <Textarea 
                      placeholder="Tell us about your project or issue..." 
                      className="min-h-[120px] border-2 transition-colors resize-none" 
                      style={{ backgroundColor: colors.secondary, borderColor: colors.secondaryDark, borderRadius: style.borderRadius.button }}
                      disabled 
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-4 font-bold text-lg text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-70"
                    style={{ 
                      background: colors.ctaGradient,
                      boxShadow: style.shadows.button,
                      borderRadius: style.borderRadius.button,
                    }}
                    disabled
                  >
                    <CheckCircle className="w-5 h-5" />
                    Submit Request (Demo)
                  </button>
                  <p className="text-center text-xs" style={{ color: colors.gray }}>
                    We respond to all inquiries within 24 hours
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ENHANCED FOOTER ========== */}
      <footer className="relative overflow-hidden" style={{ background: colors.darkGradient }}>
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{ 
            backgroundImage: `radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Gradient accent at top */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: colors.heroGradient }}
        />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14 mb-14">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-12 h-12 flex items-center justify-center text-white font-bold text-lg shadow-lg"
                  style={{ background: colors.heroGradient, borderRadius: style.borderRadius.button }}
                >
                  {businessName?.charAt(0) || "A"}
                </div>
                <span className="text-xl font-bold text-white" style={fontStyles.heading}>{businessName}</span>
              </div>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Your trusted {colors.industryLabel.toLowerCase()} in the area. Professional service with quality results.
              </p>
              <div className="flex gap-1.5 mb-2">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-500 text-xs">Trusted by 200+ customers</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-lg mb-5" style={fontStyles.heading}>Quick Links</h4>
              <ul className="space-y-3">
                {navigation?.slice(0, 5).map((item, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, "-"))}
                      className="text-gray-400 hover:text-white text-sm transition-all duration-200 hover:translate-x-1 inline-block"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold text-lg mb-5" style={fontStyles.heading}>Contact</h4>
              <ul className="space-y-4">
                {phone && (
                  <li>
                    <a href={`tel:${phone}`} className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors group">
                      <div 
                        className="w-9 h-9 flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${colors.primary}20`, borderRadius: style.borderRadius.button }}
                      >
                        <Phone className="w-4 h-4" style={{ color: colors.primary }} />
                      </div>
                      <span className="group-hover:underline">{phone}</span>
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <a href={`mailto:${email}`} className="flex items-center gap-3 text-gray-400 hover:text-white text-sm transition-colors group">
                      <div 
                        className="w-9 h-9 flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${colors.primary}20`, borderRadius: style.borderRadius.button }}
                      >
                        <Mail className="w-4 h-4" style={{ color: colors.primary }} />
                      </div>
                      <span className="group-hover:underline">{email}</span>
                    </a>
                  </li>
                )}
                <li className="flex items-center gap-3 text-gray-400 text-sm">
                  <div 
                    className="w-9 h-9 flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}20`, borderRadius: style.borderRadius.button }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: colors.primary }} />
                  </div>
                  <span>{businessName} Metro Area</span>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-white font-bold text-lg mb-5" style={fontStyles.heading}>Hours</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between text-gray-400 pb-2 border-b border-gray-700/50">
                  <span>Mon - Fri</span>
                  <span className="text-white font-semibold">8AM - 6PM</span>
                </li>
                <li className="flex justify-between text-gray-400 pb-2 border-b border-gray-700/50">
                  <span>Saturday</span>
                  <span className="text-white font-semibold">9AM - 4PM</span>
                </li>
                <li className="flex justify-between text-gray-400">
                  <span>Emergency</span>
                  <span className="text-white font-semibold">24/7</span>
                </li>
              </ul>
              <div 
                className="mt-5 flex items-center gap-3 px-4 py-3"
                style={{ 
                  backgroundColor: `${colors.primary}15`, 
                  borderRadius: style.borderRadius.button,
                  border: `1px solid ${colors.primary}30`,
                }}
              >
                <Shield className="w-5 h-5" style={{ color: colors.primary }} />
                <span className="text-gray-300 text-xs font-semibold">Licensed & Insured</span>
              </div>
            </div>
          </div>

          {/* Enhanced Bottom Bar */}
          <div 
            className="pt-8 mt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Preview generated for implementation reference
            </p>
          </div>
        </div>
      </footer>

      {/* ========== STICKY MOBILE CTA ========== */}
      <div 
        className="fixed bottom-0 left-0 right-0 lg:hidden p-3 border-t z-40"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', borderColor: colors.secondaryDark }}
      >
        <a 
          href={`tel:${phone || "5551234567"}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 font-bold text-white shadow-lg"
          style={{ background: colors.ctaGradient, borderRadius: style.borderRadius.button }}
        >
          <Phone className="w-5 h-5" />
          Call Now: {phone || "(555) 123-4567"}
        </a>
      </div>

      {/* Bottom Padding for Mobile CTA */}
      <div className="lg:hidden h-20" />
    </div>
  );
};

export default GeneratedSitePreview;
