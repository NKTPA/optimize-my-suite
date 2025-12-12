import { Loader2, Globe, Search, FileText, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const loadingSteps = [
  { icon: Globe, text: "Fetching website content..." },
  { icon: Search, text: "Analyzing page structure..." },
  { icon: FileText, text: "Extracting key elements..." },
  { icon: Sparkles, text: "Generating recommendations..." },
];

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Main loader */}
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center shadow-glow animate-glow-pulse">
          <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
        </div>
        <div className="absolute -inset-2 rounded-full gradient-hero opacity-20 animate-ping" />
      </div>

      {/* Steps */}
      <div className="space-y-3 text-center max-w-sm">
        {loadingSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isPast = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-500 ${
                isActive
                  ? "bg-primary/10 scale-100"
                  : isPast
                  ? "opacity-50 scale-95"
                  : "opacity-30 scale-95"
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${isActive ? "bg-primary/20" : "bg-transparent"}`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`flex-1 text-left text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {step.text}
              </span>
              {isActive && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-sm text-muted-foreground text-center max-w-md leading-relaxed">
        This usually takes 30-60 seconds. We're thoroughly analyzing your website to provide actionable insights.
      </p>
    </div>
  );
}
