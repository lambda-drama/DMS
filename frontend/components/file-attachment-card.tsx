'use client';

import { useRef, useState } from 'react';
import { ExternalLink, FileText, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePreviewDialog } from '@/components/file-preview-dialog';
import { uploadFile } from '@/services/common';

interface FileAttachmentCardProps {
  title?: string;
  description?: string;
  /** Uploaded file URL (Frappe `/files/...` or `/private/files/...`). */
  value?: string | null;
  /** Omit to render a read-only view (e.g. the copy shown on the Job Card). */
  onChange?: (url: string) => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

/** Human-readable file name from a Frappe `/files/...` URL. */
export function attachmentFileName(url: string): string {
  const last = url.split('?')[0].split('/').pop() || url;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function fileNameFromUrl(url: string): string {
  return attachmentFileName(url);
}

/**
 * Single-file attachment card: upload, replace, open or remove one document.
 * Reused by the Service Estimate (editable) and the Job Card (read-only copy).
 */
export function FileAttachmentCard({
  title = 'Attachment',
  description,
  value,
  onChange,
  disabled = false,
  busy = false,
  className,
}: FileAttachmentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const readOnly = !onChange;
  const working = busy || uploading;

  async function handleFile(file: File) {
    if (!onChange) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      await onChange(url);
      toast.success('Attachment uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload the file');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4" />
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {value ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              title="View attachment"
              className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:underline"
            >
              {fileNameFromUrl(value)}
            </button>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new tab"
              title="Open in new tab"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {!readOnly ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                disabled={working}
                aria-label="Remove attachment"
                onClick={() => void onChange?.('')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No attachment yet.</p>
        )}

        {!readOnly ? (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || working}
              onClick={() => inputRef.current?.click()}
            >
              {working ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {value ? 'Replace file' : 'Upload file'}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>

    <FilePreviewDialog
      open={previewOpen}
      onOpenChange={setPreviewOpen}
      url={value}
      title={value ? attachmentFileName(value) : title}
    />
    </>
  );
}
