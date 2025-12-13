import logoPrimaryLight from "@/assets/logo-primary-light.png";
import logoPrimaryDark from "@/assets/logo-primary-dark.png";
import logoIconLight from "@/assets/logo-icon-light.png";
import logoIconDark from "@/assets/logo-icon-dark.png";

export default function LogoPreview() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">OptimizeMySuite Logo Assets</h1>
          <p className="text-muted-foreground">Preview of all generated brand assets</p>
        </div>

        {/* Primary Logos */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Primary Logos</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Light Version */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Primary Logo (Light)</h3>
              <div className="bg-white border border-border rounded-xl p-8 flex items-center justify-center">
                <img 
                  src={logoPrimaryLight} 
                  alt="OptimizeMySuite Primary Logo - Light" 
                  className="max-w-full h-auto max-h-32"
                />
              </div>
              <p className="text-xs text-muted-foreground">Use on white/light backgrounds</p>
            </div>

            {/* Dark Version */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Primary Logo (Dark)</h3>
              <div className="bg-slate-900 border border-border rounded-xl p-8 flex items-center justify-center">
                <img 
                  src={logoPrimaryDark} 
                  alt="OptimizeMySuite Primary Logo - Dark" 
                  className="max-w-full h-auto max-h-32"
                />
              </div>
              <p className="text-xs text-muted-foreground">Use on dark/slate backgrounds</p>
            </div>
          </div>
        </section>

        {/* Icon Versions */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Icon Versions</h2>
          
          {/* Light Icons */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Icon (Light Background)</h3>
            <div className="flex items-end gap-8 flex-wrap">
              {/* App Icon Size */}
              <div className="space-y-2">
                <div className="bg-white border border-border rounded-xl p-4 flex items-center justify-center w-32 h-32">
                  <img 
                    src={logoIconLight} 
                    alt="OptimizeMySuite Icon - Light (App Size)" 
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">App Icon (96px)</p>
              </div>

              {/* Medium Size */}
              <div className="space-y-2">
                <div className="bg-white border border-border rounded-xl p-3 flex items-center justify-center w-20 h-20">
                  <img 
                    src={logoIconLight} 
                    alt="OptimizeMySuite Icon - Light (Medium)" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">Medium (48px)</p>
              </div>

              {/* Favicon Size */}
              <div className="space-y-2">
                <div className="bg-white border border-border rounded-xl p-2 flex items-center justify-center w-12 h-12">
                  <img 
                    src={logoIconLight} 
                    alt="OptimizeMySuite Icon - Light (Favicon)" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">Favicon (32px)</p>
              </div>

              {/* Tiny */}
              <div className="space-y-2">
                <div className="bg-white border border-border rounded-xl p-1.5 flex items-center justify-center w-8 h-8">
                  <img 
                    src={logoIconLight} 
                    alt="OptimizeMySuite Icon - Light (Tiny)" 
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">16px</p>
              </div>
            </div>
          </div>

          {/* Dark Icons */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Icon (Dark Background)</h3>
            <div className="flex items-end gap-8 flex-wrap">
              {/* App Icon Size */}
              <div className="space-y-2">
                <div className="bg-slate-900 border border-border rounded-xl p-4 flex items-center justify-center w-32 h-32">
                  <img 
                    src={logoIconDark} 
                    alt="OptimizeMySuite Icon - Dark (App Size)" 
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">App Icon (96px)</p>
              </div>

              {/* Medium Size */}
              <div className="space-y-2">
                <div className="bg-slate-900 border border-border rounded-xl p-3 flex items-center justify-center w-20 h-20">
                  <img 
                    src={logoIconDark} 
                    alt="OptimizeMySuite Icon - Dark (Medium)" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">Medium (48px)</p>
              </div>

              {/* Favicon Size */}
              <div className="space-y-2">
                <div className="bg-slate-900 border border-border rounded-xl p-2 flex items-center justify-center w-12 h-12">
                  <img 
                    src={logoIconDark} 
                    alt="OptimizeMySuite Icon - Dark (Favicon)" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">Favicon (32px)</p>
              </div>

              {/* Tiny */}
              <div className="space-y-2">
                <div className="bg-slate-900 border border-border rounded-xl p-1.5 flex items-center justify-center w-8 h-8">
                  <img 
                    src={logoIconDark} 
                    alt="OptimizeMySuite Icon - Dark (Tiny)" 
                    className="w-4 h-4 object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">16px</p>
              </div>
            </div>
          </div>
        </section>

        {/* Asset Files */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Asset Files</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">logo-primary-light.png</p>
              <p className="text-xs text-muted-foreground">Full logo, light backgrounds</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">logo-primary-dark.png</p>
              <p className="text-xs text-muted-foreground">Full logo, dark backgrounds</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">logo-icon-light.png</p>
              <p className="text-xs text-muted-foreground">Icon only, light backgrounds</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground">logo-icon-dark.png</p>
              <p className="text-xs text-muted-foreground">Icon only, dark backgrounds</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
