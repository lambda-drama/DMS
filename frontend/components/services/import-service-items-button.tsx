'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/contexts/permissions-context';
import { importFrtSheet, uploadFrtWorkbook } from '@/services/frt-import';
import { cn } from '@/lib/utils';

interface ImportServiceItemsButtonProps {
  onImported?: () => void;
  className?: string;
}

export function ImportServiceItemsButton({
  onImported,
  className,
}: ImportServiceItemsButtonProps) {
  const { canCreate } = usePermissions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  if (!canCreate('vehicle-services')) return null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    try {
      const fileUrl = await uploadFrtWorkbook(file);
      const summary = await importFrtSheet(fileUrl);
      const sheets = summary.sheets_processed || 0;
      toast.success(
        `Imported ${sheets} model sheet(s): ${summary.services_created} new, ${summary.services_updated} updated`
      );
      if (summary.errors?.length) {
        toast.error(
          `${summary.errors.length} sheet(s) failed: ${summary.errors
            .map((err) => err.sheet)
            .join(', ')}`
        );
      }
      onImported?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Upload Excel"
        title="Upload Excel — each sheet is one vehicle model"
        disabled={loading}
        className={cn('h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2', className)}
        onClick={() => fileRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 shrink-0" />
        )}
        <span className="hidden sm:inline sm:ml-2">
          {loading ? 'Importing…' : 'Upload Excel'}
        </span>
      </Button>
    </>
  );
}
