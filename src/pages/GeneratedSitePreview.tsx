import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Star, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WebsiteBlueprint } from "@/types/blueprint";
import { useEffect } from "react";

interface LocationState {
  blueprint: WebsiteBlueprint;
  businessName: string;
  phone?: string;
  email?: string;
}

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

  const { blueprint, businessName, phone, email } = state;
  const { hero, navigation, pages, technical } = blueprint;

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

  return (
    <div className="min-h-screen bg-background">
      {/* Internal Banner */}
      <div className="bg-destructive/10 border-b border-destructive/20 py-2 px-4">
        <div className="container flex items-center justify-between">
          <p className="text-sm text-destructive font-medium">
            ⚠️ INTERNAL PREVIEW ONLY — Demo site layout for implementation reference
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </Button>
        </div>
      </div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-foreground">{businessName}</span>
            <div className="hidden md:flex items-center gap-6">
              {navigation?.map((navItem, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {navItem}
                </button>
              ))}
            </div>
            <Button variant="hero" size="sm" onClick={() => scrollToSection("contact")}>
              {hero?.primaryCTA || "Get a Quote"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            {hero?.offerBadge && (
              <div className="inline-block mb-6 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground border border-accent/30">
                <span className="text-sm font-semibold">{hero.offerBadge}</span>
              </div>
            )}
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
              {hero?.headline || "Welcome to " + businessName}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {hero?.subheadline || "Your trusted local service provider"}
            </p>

            {hero?.bullets && hero.bullets.length > 0 && (
              <ul className="flex flex-col items-center gap-3 mb-8">
                {hero.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" onClick={() => scrollToSection("contact")}>
                {hero?.primaryCTA || "Get Started"}
              </Button>
              {hero?.secondaryCTA && (
                <Button variant="outline" size="lg" onClick={() => scrollToSection("services")}>
                  {hero.secondaryCTA}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 lg:py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {pages?.services?.title || "Our Services"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {pages?.services?.metaDescription || "Professional services tailored to your needs"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getServicesContent().map((service, idx) => (
              <div 
                key={idx} 
                className="bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-shadow"
              >
                <h3 className="text-xl font-semibold text-foreground mb-3">{service.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      {getWhyChooseUsContent().length > 0 && (
        <section id="why-choose-us" className="py-16 lg:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Why Choose Us
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {getWhyChooseUsContent().map((section, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{section.name}</h3>
                    <p className="text-muted-foreground text-sm">{section.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section id="about" className="py-16 lg:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {pages?.about?.title || "About Us"}
              </h2>
            </div>

            <div className="space-y-8">
              {getAboutContent().map((section, idx) => (
                <div key={idx} className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-3">{section.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-16 lg:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {pages?.gallery?.title || "Our Work"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {pages?.gallery?.metaDescription || "See examples of our quality craftsmanship"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getGalleryContent().length > 0 ? (
              getGalleryContent().map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-secondary/50 rounded-xl aspect-video flex items-center justify-center border border-border"
                >
                  <div className="text-center p-6">
                    <p className="text-sm text-muted-foreground font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.content}</p>
                  </div>
                </div>
              ))
            ) : (
              // Placeholder gallery items
              Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="bg-secondary/50 rounded-xl aspect-video flex items-center justify-center border border-border"
                >
                  <p className="text-sm text-muted-foreground">[Project Image {idx + 1}]</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 lg:py-24 bg-secondary/30">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {pages?.faq?.title || "Frequently Asked Questions"}
              </h2>
            </div>

            <div className="space-y-4">
              {getFaqContent().map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground flex items-center justify-between">
                      {faq.name}
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </h3>
                    <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                      {faq.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 lg:py-24">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {pages?.contact?.title || "Contact Us"}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {pages?.contact?.metaDescription || "Get in touch with us today"}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Get In Touch</h3>
                
                {getContactContent().map((section, idx) => (
                  <p key={idx} className="text-muted-foreground">{section.content}</p>
                ))}

                <div className="space-y-4 pt-4">
                  {phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service Area</p>
                      <p className="font-medium text-foreground">{businessName} Service Area</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Contact Form */}
              <div className="bg-card rounded-xl p-6 border border-border shadow-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Request a Quote</h3>
                <p className="text-xs text-muted-foreground mb-4 italic">
                  [Demo form - does not submit]
                </p>
                
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Name
                      </label>
                      <Input placeholder="Your name" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Phone
                      </label>
                      <Input placeholder="Your phone" disabled />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email
                    </label>
                    <Input placeholder="Your email" disabled />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Service Needed
                    </label>
                    <Input placeholder="What service do you need?" disabled />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Message
                    </label>
                    <Textarea placeholder="Tell us about your project..." rows={4} disabled />
                  </div>
                  
                  <Button variant="hero" className="w-full" disabled>
                    {hero?.primaryCTA || "Get My Free Quote"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4">{businessName}</h4>
              <p className="text-sm opacity-80">
                Your trusted local service provider.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide opacity-60">Quick Links</h4>
              <ul className="space-y-2">
                {navigation?.slice(0, 4).map((navItem, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => scrollToSection(navItem.toLowerCase().replace(/\s+/g, "-"))}
                      className="text-sm opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {navItem}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide opacity-60">Contact</h4>
              <div className="space-y-2 text-sm opacity-80">
                {phone && <p>{phone}</p>}
                {email && <p>{email}</p>}
              </div>
            </div>
          </div>
          
          <div className="border-t border-background/20 mt-8 pt-8 text-center">
            <p className="text-sm opacity-60">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Technical Notes Banner (Internal) */}
      <div className="bg-muted border-t border-border py-8">
        <div className="container">
          <h3 className="text-lg font-semibold text-foreground mb-4">Technical Notes (Internal)</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Layout</h4>
              <p className="text-muted-foreground">{technical?.layout || "Single page with anchor navigation"}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Performance</h4>
              <ul className="text-muted-foreground space-y-1">
                {technical?.performance?.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                )) || <li>• Standard optimization</li>}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Accessibility</h4>
              <ul className="text-muted-foreground space-y-1">
                {technical?.accessibility?.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                )) || <li>• WCAG 2.1 AA compliance</li>}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="font-medium text-foreground mb-3">SEO Titles & Meta Descriptions</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pages && Object.entries(pages).map(([pageName, pageData]) => (
                <div key={pageName} className="bg-card p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{pageName}</p>
                  <p className="font-medium text-foreground text-sm mb-1">{pageData?.seoTitle || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">{pageData?.metaDescription || "N/A"}</p>
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
