import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, Shield, 
  Clock, Award, Users, Wrench, Sparkles, Camera, MessageCircle,
  ChevronRight, ExternalLink
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

// Industry-specific Unsplash images
const getIndustryImages = (industry: string = "") => {
  const industryLower = industry.toLowerCase();
  
  const imageMap: Record<string, { hero: string; gallery: string[] }> = {
    hvac: {
      hero: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
        "https://images.unsplash.com/photo-1631545806609-8f27d9ef1e5b?w=600&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=600&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
      ]
    },
    plumbing: {
      hero: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=600&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
      ]
    },
    electrical: {
      hero: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
        "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80",
        "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=600&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
        "https://images.unsplash.com/photo-1631545806609-8f27d9ef1e5b?w=600&q=80",
      ]
    },
    dental: {
      hero: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80",
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
      hero: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80",
        "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
        "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80",
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
      ]
    },
    landscaping: {
      hero: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80",
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
      hero: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80",
        "https://images.unsplash.com/photo-1592595896616-c37162298647?w=600&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80",
      ]
    },
  };

  // Find matching industry
  for (const [key, value] of Object.entries(imageMap)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }

  // Default home services images
  return {
    hero: "https://images.unsplash.com/photo-1581094794329-c8112c4e5190?w=800&q=80",
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
  const images = getIndustryImages(industry);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Extract services from sections
  const getServicesContent = () => {
    const servicesPage = pages?.services;
    if (!servicesPage?.sections) return [];
    return servicesPage.sections;
  };

  // Extract FAQ content
  const getFaqContent = () => {
    const faqPage = pages?.faq;
    if (!faqPage?.sections) return [];
    return faqPage.sections;
  };

  // Extract about content
  const getAboutContent = () => {
    const aboutPage = pages?.about;
    if (!aboutPage?.sections) return [];
    return aboutPage.sections;
  };

  // Extract gallery content
  const getGalleryContent = () => {
    const galleryPage = pages?.gallery;
    if (!galleryPage?.sections) return [];
    return galleryPage.sections;
  };

  // Extract contact content
  const getContactContent = () => {
    const contactPage = pages?.contact;
    if (!contactPage?.sections) return [];
    return contactPage.sections;
  };

  // Extract home page sections for "Why Choose Us"
  const getWhyChooseUsContent = () => {
    const homePage = pages?.home;
    if (!homePage?.sections) return [];
    return homePage.sections.filter(s => 
      s.name.toLowerCase().includes("why") || 
      s.name.toLowerCase().includes("trust") ||
      s.name.toLowerCase().includes("choose")
    );
  };

  const serviceIcons = [Wrench, Sparkles, Shield, Clock, Award, Users];
  const galleryContent = getGalleryContent();
  const galleryImages = galleryContent.length > 0 
    ? galleryContent.slice(0, 6)
    : images.gallery.slice(0, 6).map((_, i) => ({ name: `Project ${i + 1}`, content: "Quality work completed" }));

  return (
    <div className="min-h-screen bg-background">
      {/* Internal Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              Internal Preview Mode — Demo layout for implementation reference
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-2 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </Button>
        </div>
      </div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  {businessName?.charAt(0) || "B"}
                </span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:block">{businessName}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1">
              {navigation?.map((navItem, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                  {navItem}
                </button>
              ))}
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25" 
              size="sm" 
              onClick={() => scrollToSection("contact")}
            >
              <Phone className="w-4 h-4 mr-2" />
              {hero?.primaryCTA || "Get a Quote"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium Two-Column */}
      <section id="home" className="relative py-16 lg:py-24 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              {hero?.offerBadge && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{hero.offerBadge}</span>
                </div>
              )}
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight tracking-tight">
                {hero?.headline || "Welcome to " + businessName}
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
                {hero?.subheadline || "Your trusted local service provider"}
              </p>

              {hero?.bullets && hero.bullets.length > 0 && (
                <ul className="space-y-3 py-2">
                  {hero.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 text-base px-8"
                  onClick={() => scrollToSection("contact")}
                >
                  {hero?.primaryCTA || "Get Started"}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                {hero?.secondaryCTA && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 text-base px-8"
                    onClick={() => scrollToSection("services")}
                  >
                    {hero.secondaryCTA}
                  </Button>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Fast Response</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span>Satisfaction Guaranteed</span>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Widget */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-3xl blur-2xl" />
              <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
                {/* Widget Header */}
                <div className="bg-primary px-6 py-5">
                  <h3 className="text-lg font-semibold text-primary-foreground">Get Your Free Quote</h3>
                  <p className="text-primary-foreground/80 text-sm">We respond within 30 minutes</p>
                </div>
                
                {/* Widget Content */}
                <div className="p-6 space-y-5">
                  {/* Quick Contact */}
                  <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Call Now</p>
                      <p className="text-lg font-bold text-foreground">{phone || "(555) 123-4567"}</p>
                    </div>
                  </div>

                  {/* Key Selling Points */}
                  <div className="space-y-3">
                    {[
                      "Free estimates, no obligation",
                      "Same-day service available",
                      "100% satisfaction guaranteed"
                    ].map((point, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm text-foreground">{point}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    onClick={() => scrollToSection("contact")}
                  >
                    Request Free Quote
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    ⭐️ 4.9/5 rating from 200+ happy customers
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Our Services
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {pages?.services?.title || "What We Offer"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {pages?.services?.metaDescription || "Professional services tailored to your needs"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getServicesContent().map((service, idx) => {
              const IconComponent = serviceIcons[idx % serviceIcons.length];
              return (
                <div 
                  key={idx} 
                  className="group bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{service.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.content}</p>
                  <button className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by Hundreds of Customers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Here's why homeowners and businesses choose us for their needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Licensed & Insured", desc: "Fully licensed professionals with comprehensive insurance coverage" },
              { icon: Clock, title: "Fast Response", desc: "Quick response times and flexible scheduling to meet your needs" },
              { icon: Award, title: "Quality Work", desc: "Consistently high-quality workmanship backed by our guarantee" },
              { icon: Users, title: "Friendly Team", desc: "Professional, courteous technicians who respect your property" },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6 bg-card rounded-2xl border border-border/50">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {getWhyChooseUsContent().length > 0 && (
            <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {getWhyChooseUsContent().map((section, idx) => (
                <div key={idx} className="flex gap-4 p-5 bg-card rounded-xl border border-border/50">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{section.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl transform rotate-3" />
              <img 
                src={images.hero}
                alt={`${businessName} team at work`}
                className="relative rounded-2xl shadow-2xl w-full h-[400px] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-card p-4 rounded-xl shadow-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">10+</p>
                    <p className="text-sm text-muted-foreground">Years Experience</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full">
                About Us
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                {pages?.about?.title || "About " + businessName}
              </h2>
              
              <div className="space-y-4">
                {getAboutContent().slice(0, 3).map((section, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{section.name}</h3>
                    <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="border-2"
                onClick={() => scrollToSection("contact")}
              >
                Get In Touch
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Our Work
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {pages?.gallery?.title || "Recent Projects"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {pages?.gallery?.metaDescription || "See examples of our quality craftsmanship"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((item, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <img 
                  src={images.gallery[idx] || images.gallery[0]}
                  alt={item.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-2 text-white mb-1">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <p className="text-white/80 text-xs">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-28 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              FAQ
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {pages?.faq?.title || "Frequently Asked Questions"}
            </h2>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about our services
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {getFaqContent().map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="bg-card rounded-xl border border-border/50 px-6 shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-5">
                  {faq.name}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Button onClick={() => scrollToSection("contact")}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
        
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
              Contact Us
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {pages?.contact?.title || "Get In Touch"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {pages?.contact?.metaDescription || "Ready to get started? Contact us today for a free quote"}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-foreground mb-6">Contact Information</h3>
                
                {getContactContent().slice(0, 1).map((section, idx) => (
                  <p key={idx} className="text-muted-foreground mb-6">{section.content}</p>
                ))}

                <div className="space-y-5">
                  {phone && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-semibold text-foreground">{phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {email && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground">{email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Area</p>
                      <p className="font-semibold text-foreground">{businessName} Service Area</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours Card */}
              <div className="bg-primary/5 rounded-2xl border border-primary/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Business Hours</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Monday - Friday</span>
                    <span className="font-medium text-foreground">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Saturday</span>
                    <span className="font-medium text-foreground">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sunday</span>
                    <span className="font-medium text-foreground">Emergency Only</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Request a Free Quote</h3>
                  <span className="text-xs px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full font-medium">
                    Demo Form
                  </span>
                </div>
                
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <Input placeholder="John Smith" className="h-12" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number *
                      </label>
                      <Input placeholder="(555) 123-4567" className="h-12" disabled />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <Input placeholder="john@example.com" className="h-12" disabled />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Service Needed *
                    </label>
                    <Input placeholder="What service do you need?" className="h-12" disabled />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Project Details
                    </label>
                    <Textarea 
                      placeholder="Tell us about your project, timeline, and any specific requirements..." 
                      rows={4} 
                      disabled 
                    />
                  </div>
                  
                  <Button 
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg text-base" 
                    disabled
                  >
                    {hero?.primaryCTA || "Get My Free Quote"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    By submitting, you agree to our terms and privacy policy.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center">
                  <span className="text-background font-bold text-lg">
                    {businessName?.charAt(0) || "B"}
                  </span>
                </div>
                <span className="text-xl font-bold">{businessName}</span>
              </div>
              <p className="text-background/70 max-w-sm mb-6">
                Your trusted local service provider. Quality work, fair prices, and customer satisfaction guaranteed.
              </p>
              <div className="flex gap-4">
                {phone && (
                  <div className="flex items-center gap-2 text-sm text-background/80">
                    <Phone className="w-4 h-4" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-5 uppercase tracking-wide text-background/50">Quick Links</h4>
              <ul className="space-y-3">
                {navigation?.slice(0, 5).map((navItem, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                      className="text-sm text-background/70 hover:text-background transition-colors"
                    >
                      {navItem}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-5 uppercase tracking-wide text-background/50">Contact</h4>
              <div className="space-y-3 text-sm text-background/70">
                {phone && <p>{phone}</p>}
                {email && <p>{email}</p>}
                <p>Mon-Fri: 8am-6pm</p>
                <p>Sat: 9am-4pm</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/50">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-background/50">
              <span className="hover:text-background/70 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-background/70 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Internal Technical Notes */}
      <div className="bg-muted border-t-4 border-amber-500/30 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h3 className="text-xl font-bold text-foreground">Internal Implementation Notes</h3>
            <span className="text-xs px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full font-medium">
              Not visible to clients
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-primary" />
                Layout Notes
              </h4>
              <p className="text-sm text-muted-foreground">{technical?.layout || "Single page with anchor navigation"}</p>
            </div>
            
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <h4 className="font-semibold text-foreground mb-3">Performance</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {technical?.performance?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                )) || <li>• Standard optimization</li>}
              </ul>
            </div>
            
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
              <h4 className="font-semibold text-foreground mb-3">Accessibility</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {technical?.accessibility?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                )) || <li>• WCAG 2.1 AA compliance</li>}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="font-semibold text-foreground mb-4">SEO Titles & Meta Descriptions</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages && Object.entries(pages).map(([pageName, pageData]) => (
                <div key={pageName} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">{pageName}</p>
                  <p className="font-medium text-foreground text-sm mb-1 line-clamp-1">{pageData?.seoTitle || "N/A"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{pageData?.metaDescription || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedSitePreview;
