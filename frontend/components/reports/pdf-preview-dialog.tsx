'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Printer, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Full HTML document for the PDF preview */
  html: string | null;
}

export function PdfPreviewDialog({
  open,
  onOpenChange,
  title,
  html,
}: PdfPreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => html || '', [html]);

  useEffect(() => {
    if (!open) return;
    // Focus iframe after open so keyboard print works
    const t = window.setTimeout(() => iframeRef.current?.contentWindow?.focus(), 200);
    return () => window.clearTimeout(t);
  }, [open, srcDoc]);

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,920px)] w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 space-y-0 border-b px-4 py-3 text-left">
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle className="font-serif-display text-base font-semibold tracking-tight">
              Preview — {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-muted/30 p-3">
          {srcDoc ? (
            <iframe
              ref={iframeRef}
              title={`PDF preview — ${title}`}
              srcDoc={srcDoc}
              className="h-full w-full rounded-md border bg-white shadow-sm"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nothing to preview
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t bg-card px-4 py-3 sm:justify-between">
          <p className="text-[11px] text-muted-foreground">
            Review the layout, then print or save as PDF from the print dialog.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-dms-gold text-[#0F172A] hover:bg-dms-gold/90"
              onClick={handlePrint}
              disabled={!srcDoc}
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
