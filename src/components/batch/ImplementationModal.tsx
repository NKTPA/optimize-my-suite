import { BatchSite } from "@/types/batch";
import { ImplementationPack } from "@/components/ImplementationPack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImplementationModalProps {
  site: BatchSite | null;
  open: boolean;
  onClose: () => void;
}

export function ImplementationModal({ site, open, onClose }: ImplementationModalProps) {
  if (!site || !site.implementationPlan) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl">
            Implementation Pack: {site.name || site.url}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="py-4">
            <ImplementationPack plan={site.implementationPlan} url={site.url} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
