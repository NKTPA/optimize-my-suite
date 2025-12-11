import { Bot, PhoneCall, Calendar, Clock } from "lucide-react";
import { Button } from "./ui/button";

interface AIServicePitchProps {
  paragraph: string;
  bullets: string[];
}

export function AIServicePitch({ paragraph, bullets }: AIServicePitchProps) {
  const icons = [PhoneCall, Clock, Calendar];

  return (
    <div className="gradient-hero rounded-2xl p-8 text-primary-foreground">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-primary-foreground/20 rounded-xl">
          <Bot className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Multiply Your Results with AI</h3>
          <p className="text-primary-foreground/90 leading-relaxed">{paragraph}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {bullets.map((bullet, index) => {
          const Icon = icons[index] || PhoneCall;
          return (
            <div key={index} className="bg-primary-foreground/10 rounded-xl p-4">
              <Icon className="w-6 h-6 mb-2 text-primary-foreground/80" />
              <p className="text-sm text-primary-foreground/90">{bullet}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-primary-foreground/20">
        <p className="text-sm text-primary-foreground/80 flex-1">
          Want an AI receptionist that answers calls 24/7 and books jobs from this site?
        </p>
        <Button 
          variant="secondary" 
          size="lg"
          className="whitespace-nowrap bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          Ask About AI Answering
        </Button>
      </div>
    </div>
  );
}
