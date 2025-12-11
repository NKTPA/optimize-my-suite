import { BatchSiteStatus } from "@/types/batch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface BatchStatusBadgeProps {
  status: BatchSiteStatus;
}

export function BatchStatusBadge({ status }: BatchStatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="text-xs">
          Pending
        </Badge>
      );
    case "running":
      return (
        <Badge variant="default" className="text-xs bg-primary/80">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    case "done":
      return (
        <Badge variant="default" className="text-xs bg-success text-success-foreground">
          Done
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="text-xs">
          Error
        </Badge>
      );
    default:
      return null;
  }
}
