"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Car, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { DMSJobCard, RoadTestItemResult } from "@/types/dms";
import * as jobCardsSvc from "@/services/jobCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  hasCriticalRoadTestFails,
  isRoadTestChecklistComplete,
  type RoadTestResultValue,
} from "./road-test-utils";

interface RoadTestSectionProps {
  jobCard: DMSJobCard;
  onSaved: () => Promise<unknown>;
  onChecklistState?: (
    rows: RoadTestItemResult[],
    meta: { complete: boolean; hasCriticalFails: boolean }
  ) => void;
}

export function RoadTestSection({ jobCard, onSaved, onChecklistState }: RoadTestSectionProps) {
  const [templates, setTemplates] = useState<
    Array<{ name: string; template_name: string; template_type?: string }>
  >([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [template, setTemplate] = useState(jobCard.road_test_template || "");
  const [rows, setRows] = useState<RoadTestItemResult[]>(jobCard.road_test_results || []);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const autoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    autoAppliedRef.current = null;
  }, [jobCard.name]);

  useEffect(() => {
    setTemplate(jobCard.road_test_template || "");
    setRows(jobCard.road_test_results || []);
  }, [jobCard.name, jobCard.road_test_template, jobCard.road_test_results]);

  const applyTemplate = useCallback(
    async (selected: string, force = false, silent = false) => {
      if (!selected) return;
      setApplying(true);
      try {
        const result = await jobCardsSvc.applyRoadTestTemplate(jobCard.name, selected, force);
        setTemplate(result.road_test_template || selected);
        setRows(result.road_test_results || []);
        if (!silent) toast.success("Road test checklist loaded from template");
        await onSaved();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to apply template";
        if (!force && message.toLowerCase().includes("already has")) {
          if (window.confirm("Replace existing road test results with this template?")) {
            await applyTemplate(selected, true, silent);
            return;
          }
        } else {
          toast.error(message);
        }
      } finally {
        setApplying(false);
      }
    },
    [jobCard.name, onSaved]
  );

  useEffect(() => {
    let cancelled = false;
    setTemplatesLoading(true);
    jobCardsSvc
      .fetchRoadTestTemplates()
      .then((data) => {
        if (!cancelled) {
          setTemplates(data);
          if (!jobCard.road_test_template && !template && data.length) {
            const defaultTpl =
              data.find((t) => Boolean(t.is_default)) || data[0];
            if (defaultTpl) setTemplate(defaultTpl.name);
          }
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load road test templates");
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (applying || templatesLoading) return;
    if (rows.length > 0 || (jobCard.road_test_results || []).length) return;
    if (jobCard.status !== "Road Test In Progress") return;

    const templateToApply = jobCard.road_test_template || template;
    if (!templateToApply) return;

    const key = `${jobCard.name}:${templateToApply}`;
    if (autoAppliedRef.current === key) return;
    autoAppliedRef.current = key;

    void applyTemplate(templateToApply, false, true);
  }, [
    applying,
    templatesLoading,
    jobCard.name,
    jobCard.status,
    jobCard.road_test_template,
    jobCard.road_test_results,
    template,
    rows.length,
    applyTemplate,
  ]);

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (!value) return;
    if (rows.length > 0 && value !== jobCard.road_test_template) {
      if (window.confirm("Replace existing road test results with lines from this template?")) {
        void applyTemplate(value, true);
      }
      return;
    }
    void applyTemplate(value, false);
  };

  const updateRow = (index: number, patch: Partial<RoadTestItemResult>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = rows.map((row) => ({
        test_item: row.test_item,
        test_description: row.test_description,
        category: row.category,
        test_condition: row.test_condition,
        is_critical: row.is_critical,
        result: row.result,
        observations: row.observations,
      }));
      await jobCardsSvc.saveRoadTestResults(jobCard.name, template, payload);
      toast.success("Road test results saved");
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save road test results");
    } finally {
      setSaving(false);
    }
  };

  const checklistComplete = isRoadTestChecklistComplete(rows);

  useEffect(() => {
    onChecklistState?.(rows, {
      complete: checklistComplete,
      hasCriticalFails: hasCriticalRoadTestFails(rows),
    });
  }, [rows, checklistComplete, onChecklistState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Road Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label>Road Test Template</Label>
          <Select
            value={template || undefined}
            onValueChange={handleTemplateChange}
            disabled={templatesLoading || applying}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={templatesLoading ? "Loading templates…" : "Select template…"}
              />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.template_name || t.name}
                  {t.template_type ? ` (${t.template_type})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose a template to load checklist items. Enter result and observations for each row,
            then save before passing or failing the road test.
          </p>
        </div>

        {applying && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading checklist…
          </div>
        )}

        {rows.length > 0 && (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Critical</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.name || `${row.test_item}-${index}`}>
                      <TableCell className="font-medium min-w-[140px]">
                        {row.test_description || row.test_item}
                      </TableCell>
                      <TableCell>{row.category || "–"}</TableCell>
                      <TableCell>{row.test_condition || "–"}</TableCell>
                      <TableCell>
                        {row.is_critical === 1 || row.is_critical === true ? "Yes" : "No"}
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Select
                          value={row.result || "Pass"}
                          onValueChange={(value) =>
                            updateRow(index, { result: value as RoadTestResultValue })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pass">Pass</SelectItem>
                            <SelectItem value="Fail">Fail</SelectItem>
                            <SelectItem value="N/A">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <Textarea
                          rows={2}
                          placeholder={row.result === "Fail" ? "Required for Fail" : "Optional"}
                          value={row.observations || ""}
                          onChange={(e) => updateRow(index, { observations: e.target.value })}
                          className="min-h-[60px]"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save results
              </Button>
              {!checklistComplete && (
                <p className="text-xs text-muted-foreground">
                  Complete every row (observations required for Fail) to enable Pass / Fail.
                </p>
              )}
            </div>
          </>
        )}

        {rows.length === 0 && !applying && (
          <p className="text-sm text-muted-foreground">
            Select a road test template to load checklist items.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { isRoadTestChecklistComplete, hasCriticalRoadTestFails } from "./road-test-utils";
