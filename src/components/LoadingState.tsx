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
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center animate-pulse-slow">
          <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full gradient-hero opacity-30 animate-ping" />
      </div>

      <div className="space-y-4 text-center">
        {loadingSteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isPast = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex items-center gap-3 transition-all duration-500 ${
                isActive
                  ? "opacity-100 scale-100"
                  : isPast
                  ? "opacity-40 scale-95"
                  : "opacity-30 scale-95"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {step.text}
              </span>
              {isActive && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground text-center max-w-md">
        This usually takes 30-60 seconds. We're thoroughly analyzing your website to provide actionable insights.
      </p>
    </div>
  );
}
