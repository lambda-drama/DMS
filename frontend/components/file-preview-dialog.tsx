'use client';

import { ExternalLink, FileQuestion } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif'];
const PDF_EXTENSIONS = ['pdf'];

export type FilePreviewKind = 'image' | 'pdf' | 'other';

function extensionOf(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const last = clean.split('/').pop() || '';
  const dot = last.lastIndexOf('.');
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : '';
}

/** How the browser can render the file inline (PDF and images only). */
export function filePreviewKind(url: string): FilePreviewKind {
  const ext = extensionOf(url);
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (PDF_EXTENSIONS.includes(ext)) return 'pdf';
  return 'other';
}

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `/files/...` or `/private/files/...` URL. */
  url?: string | null;
  title?: string;
}

/**
 * In-place viewer for an attachment: images and PDFs render inside the dialog so
 * the user can just look at the document. Anything else offers a new tab, where
 * the browser decides whether it can display or has to download it.
 */
export function FilePreviewDialog({ open, onOpenChange, url, title }: FilePreviewDialogProps) {
  const src = (url || '').trim();
  const kind = src ? filePreviewKind(src) : 'other';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,900px)] w-[min(96vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 space-y-0 border-b px-4 py-3 text-left">
          <DialogTitle className="truncate pr-8 text-base">{title || 'Attachment'}</DialogTitle>
          <DialogDescription className="sr-only">Attachment preview</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-3">
          {!src ? (
            <p className="text-sm text-muted-foreground">Nothing to view.</p>
          ) : kind === 'image' ? (
            <img
              src={src}
              alt={title || 'Attachment'}
              className="max-h-full max-w-full rounded-md border bg-white object-contain shadow-sm"
            />
          ) : kind === 'pdf' ? (
            <iframe
              title={title || 'Attachment'}
              src={src}
              className="h-full w-full rounded-md border bg-white shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This file type cannot be shown here.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t bg-card px-4 py-3">
          {src ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open in new tab
              </a>
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
