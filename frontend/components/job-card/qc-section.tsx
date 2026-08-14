"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { DMSJobCard, JobCardQCResult } from "@/types/dms";
import * as jobCardsSvc from "@/services/jobCards";
import { uploadFile } from "@/services/common";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { QCSectionHeader } from "./qc-grouped-list";
import {
  evaluateMeasurementResult,
  groupQCResultsBySection,
  hasMandatoryQCFails,
  isQCChecklistComplete,
  isQCRowComplete,
  type QCResultValue,
} from "./qc-utils";

interface QCSectionProps {
  jobCard: DMSJobCard;
  onSaved: () => Promise<unknown>;
  onChecklistState?: (
    rows: JobCardQCResult[],
    meta: { complete: boolean; hasMandatoryFails: boolean }
  ) => void;
}

export function QCSection({ jobCard, onSaved, onChecklistState }: QCSectionProps) {
  const [templates, setTemplates] = useState<
    Array<{ name: string; checklist_name: string; checklist_type?: string }>
  >([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [template, setTemplate] = useState(jobCard.qc_checklist_template || "");
  const [rows, setRows] = useState<JobCardQCResult[]>(jobCard.qc_results || []);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const autoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    autoAppliedRef.current = null;
  }, [jobCard.name]);

  useEffect(() => {
    setTemplate(jobCard.qc_checklist_template || "");
    setRows(jobCard.qc_results || []);
  }, [jobCard.name, jobCard.qc_checklist_template, jobCard.qc_results]);

  const applyTemplate = useCallback(
    async (selected: string, force = false, silent = false) => {
      if (!selected) return;
      setApplying(true);
      try {
        const result = await jobCardsSvc.applyQCChecklistTemplate(
          jobCard.name,
          selected,
          force
        );
        setTemplate(result.qc_checklist_template || selected);
        setRows(result.qc_results || []);
        if (!silent) toast.success("QC checklist loaded from template");
        await onSaved();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to apply template";
        if (!force && message.toLowerCase().includes("already has")) {
          if (window.confirm("Replace existing QC results with this template?")) {
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
      .fetchQCChecklistTemplates()
      .then((data) => {
        if (!cancelled) {
          setTemplates(data);
          if (!jobCard.qc_checklist_template && !template && data.length) {
            const defaultTpl =
              data.find((t) => Boolean(t.is_default)) || data[0];
            if (defaultTpl) setTemplate(defaultTpl.name);
          }
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load QC templates");
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
    if (rows.length > 0 || (jobCard.qc_results || []).length) return;
    if (jobCard.status !== "QC In Progress") return;

    const templateToApply = jobCard.qc_checklist_template || template;
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
    jobCard.qc_checklist_template,
    jobCard.qc_results,
    template,
    rows.length,
    applyTemplate,
  ]);

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (!value) return;
    if (rows.length > 0 && value !== jobCard.qc_checklist_template) {
      if (window.confirm("Replace existing QC results with lines from this template?")) {
        void applyTemplate(value, true);
      }
      return;
    }
    void applyTemplate(value, false);
  };

  const updateRow = (index: number, patch: Partial<JobCardQCResult>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleMeasurementChange = (index: number, raw: string) => {
    const value = raw === "" ? undefined : parseFloat(raw);
    const row = rows[index];
    const patch: Partial<JobCardQCResult> = {
      measurement_value: Number.isNaN(value as number) ? undefined : value,
    };
    const measured = evaluateMeasurementResult({ ...row, ...patch });
    if (measured) patch.result = measured;
    updateRow(index, patch);
  };

  const handlePhotoUpload = async (index: number, file: File) => {
    setUploadingPhotoIndex(index);
    try {
      const url = await uploadFile(file);
      updateRow(index, { photo: url });
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhotoIndex(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = rows.map((row) => ({
        check_item_text: row.check_item_text,
        category: row.category,
        section_classification: row.section_classification,
        is_mandatory: row.is_mandatory,
        requires_photo: row.requires_photo,
        requires_measurement: row.requires_measurement,
        min_value: row.min_value,
        max_value: row.max_value,
        result: row.result,
        measurement_value: row.measurement_value,
        photo: row.photo,
        notes: row.notes,
      }));
      await jobCardsSvc.saveQCResults(jobCard.name, template, payload);
      toast.success("QC results saved");
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save QC results");
    } finally {
      setSaving(false);
    }
  };

  const checklistComplete = isQCChecklistComplete(rows);
  const groupedRows = groupQCResultsBySection(rows);

  useEffect(() => {
    onChecklistState?.(rows, {
      complete: checklistComplete,
      hasMandatoryFails: hasMandatoryQCFails(rows),
    });
  }, [rows, checklistComplete, onChecklistState]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Quality Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label>QC Checklist Template</Label>
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
                  {t.checklist_name || t.name}
                  {t.checklist_type ? ` (${t.checklist_type})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose a template to load checklist items. Complete each row, then save before passing
            or failing QC.
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
            <div className="space-y-3">
              {groupedRows.map((group) => {
                const done = group.items.filter(({ row }) => isQCRowComplete(row)).length;
                return (
                  <div key={group.section} className="overflow-hidden rounded-lg border">
                    <QCSectionHeader
                      title={group.section}
                      count={`${done}/${group.items.length}`}
                    />
                    <div className="grid md:grid-cols-2">
                      {group.items.map(({ row, index }) => {
                        const needsMeasurement =
                          row.requires_measurement === 1 || row.requires_measurement === true;
                        const needsPhoto =
                          (row.requires_photo === 1 || row.requires_photo === true) &&
                          row.result === "Fail";
                        const mandatory =
                          row.is_mandatory === 1 || row.is_mandatory === true;
                        return (
                          <div
                            key={row.name || `qc-${index}`}
                            className="space-y-1.5 border-b border-border/60 p-2.5 last:border-b-0 md:odd:border-r md:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[13px] font-normal leading-snug text-muted-foreground">
                                {row.check_item_text || "–"}
                                {mandatory ? (
                                  <span className="ml-1 text-destructive">*</span>
                                ) : null}
                              </p>
                              <ToggleGroup
                                type="single"
                                variant="outline"
                                size="sm"
                                value={row.result || "Pass"}
                                onValueChange={(value) => {
                                  if (value) {
                                    updateRow(index, { result: value as QCResultValue });
                                  }
                                }}
                                className="shrink-0"
                              >
                                <ToggleGroupItem
                                  value="Pass"
                                  className={cn(
                                    "px-2.5 text-[11px] font-semibold",
                                    "data-[state=on]:border-emerald-600 data-[state=on]:bg-emerald-600 data-[state=on]:text-white"
                                  )}
                                >
                                  OK
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="Fail"
                                  className={cn(
                                    "px-2.5 text-[11px] font-semibold",
                                    "data-[state=on]:border-destructive data-[state=on]:bg-destructive data-[state=on]:text-white"
                                  )}
                                >
                                  NOT OK
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="N/A"
                                  className="px-2.5 text-[11px] font-semibold"
                                >
                                  N/A
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </div>
                            <Input
                              placeholder={
                                row.result === "Fail" ? "Comments (required)" : "Comments"
                              }
                              value={row.notes || ""}
                              onChange={(e) => updateRow(index, { notes: e.target.value })}
                            />
                            {needsMeasurement ? (
                              <Input
                                type="number"
                                step="any"
                                placeholder={
                                  row.min_value != null && row.max_value != null
                                    ? `Measurement (${row.min_value} – ${row.max_value})`
                                    : "Measurement"
                                }
                                value={row.measurement_value ?? ""}
                                onChange={(e) =>
                                  handleMeasurementChange(index, e.target.value)
                                }
                              />
                            ) : null}
                            {needsPhoto ? (
                              <div className="space-y-1">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingPhotoIndex === index}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) void handlePhotoUpload(index, file);
                                  }}
                                />
                                {row.photo ? (
                                  <p className="text-xs text-muted-foreground">Photo uploaded</p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
                  Complete every row (measurements, notes for Fail, photo when required) to enable
                  Pass / Fail QC.
                </p>
              )}
              {hasMandatoryQCFails(rows) && (
                <p className="text-xs text-destructive">
                  Mandatory item(s) failed — cannot pass QC until resolved.
                </p>
              )}
            </div>
          </>
        )}

        {rows.length === 0 && !applying && (
          <p className="text-sm text-muted-foreground">
            Select a QC checklist template to load checklist items.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
