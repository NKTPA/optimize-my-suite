import { CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Finding {
  type: "success" | "warning" | "error" | "info";
  text: string;
}

interface FindingsListProps {
  findings: (Finding | string)[];
  className?: string;
}

export function FindingsList({ findings, className }: FindingsListProps) {
  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
    info: Info,
  };

  const colors = {
    success: "text-success",
    warning: "text-warning",
    error: "text-destructive",
    info: "text-info",
  };

  const bgColors = {
    success: "bg-success/10",
    warning: "bg-warning/10",
    error: "bg-destructive/10",
    info: "bg-info/10",
  };

  // Normalize findings to always have type and text
  const normalizedFindings = findings.map((finding): Finding => {
    if (typeof finding === "string") {
      return { type: "info", text: finding };
    }
    return finding;
  });

  return (
    <ul className={cn("space-y-2", className)}>
      {normalizedFindings.map((finding, index) => {
        const Icon = icons[finding.type] || Info;
        return (
          <li
            key={index}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              bgColors[finding.type] || "bg-info/10"
            )}
          >
            <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", colors[finding.type] || "text-info")} />
            <span className="text-sm text-foreground leading-relaxed">{finding.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
