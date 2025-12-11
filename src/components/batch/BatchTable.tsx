import { BatchSite } from "@/types/batch";
import { BatchStatusBadge } from "./BatchStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Download, AlertCircle } from "lucide-react";

interface BatchTableProps {
  sites: BatchSite[];
  onViewImplementation: (site: BatchSite) => void;
  onDownloadPdf: (site: BatchSite) => void;
}

export function BatchTable({ sites, onViewImplementation, onDownloadPdf }: BatchTableProps) {
  if (sites.length === 0) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-48">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.map((site, index) => (
            <TableRow key={site.id}>
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell className="font-medium">{site.name || "–"}</TableCell>
              <TableCell className="text-muted-foreground max-w-[300px] truncate">
                {site.url}
              </TableCell>
              <TableCell>
                <BatchStatusBadge status={site.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {site.status === "done" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewImplementation(site)}
                        className="h-8 px-2 text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Pack
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadPdf(site)}
                        className="h-8 px-2 text-xs gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </Button>
                    </>
                  )}
                  {site.status === "error" && site.errorMessage && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          View Error
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="text-sm">{site.errorMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
