'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { importFrtSheet, uploadFrtWorkbook, type FrtImportResult } from '@/services/frt-import';

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [brand, setBrand] = useState('JETOUR');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FrtImportResult | null>(null);

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Choose an Excel workbook first');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const fileUrl = await uploadFrtWorkbook(file);
      const summary = await importFrtSheet(fileUrl, brand.trim() || 'JETOUR');
      setResult(summary);
      toast.success(
        `Imported ${summary.sheets_processed} model sheet(s): ${summary.services_created} new services, ${summary.services_updated} updated`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">DMS configuration and data tools</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import FRT labour sheet
          </CardTitle>
          <CardDescription>
            Upload the FRT Excel workbook. Each model tab (e.g. X50-JX50 → model X50, code JX50)
            creates one Vehicle Model, then service rows on that tab become Vehicle Service Items.
            To import service packages, use <strong>DMS Settings</strong> in ERPNext Desk →
            Imports → Import Service Packages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frt-brand">Brand</Label>
            <Input
              id="frt-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="JETOUR"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frt-file">Excel workbook (.xls / .xlsx)</Label>
            <Input
              id="frt-file"
              ref={fileRef}
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
            {fileName ? (
              <p className="text-xs text-muted-foreground">Selected: {fileName}</p>
            ) : null}
          </div>

          <Button type="button" onClick={handleImport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import FRT sheet
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Import summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                Sheets processed: <strong>{result.sheets_processed}</strong>
              </p>
              <p>
                Services created: <strong>{result.services_created}</strong>
              </p>
              <p>
                Services updated: <strong>{result.services_updated}</strong>
              </p>
              <p>
                Rows skipped: <strong>{result.services_skipped}</strong>
              </p>
            </div>

            {result.details?.length ? (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Sheet</th>
                      <th className="px-3 py-2 text-left">Model</th>
                      <th className="px-3 py-2 text-right">Created</th>
                      <th className="px-3 py-2 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.details.map((row) => (
                      <tr key={row.sheet} className="border-t">
                        <td className="px-3 py-2">{row.sheet}</td>
                        <td className="px-3 py-2">
                          {row.model_name} ({row.model_code})
                        </td>
                        <td className="px-3 py-2 text-right">{row.services_created}</td>
                        <td className="px-3 py-2 text-right">{row.services_updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {result.errors?.length ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 font-medium text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Sheet errors
                </p>
                <ul className="list-disc space-y-1 pl-5 text-destructive">
                  {result.errors.map((err) => (
                    <li key={`${err.sheet}-${err.error}`}>
                      {err.sheet}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
