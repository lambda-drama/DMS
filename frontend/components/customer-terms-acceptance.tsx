"use client";

import { ChevronDown, FileText, Loader2, Printer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { printCustomerTerms, type TermsPrintContext } from "@/lib/print-terms";

export type CustomerTermsRecord = {
  name: string;
  terms_title?: string;
  language?: string;
  arabic?: number | boolean;
  more_details?: string;
};

export type BilingualCustomerTerms = {
  english: CustomerTermsRecord | null;
  arabic: CustomerTermsRecord | null;
};

interface CustomerTermsAcceptanceProps {
  terms: BilingualCustomerTerms | null;
  loading?: boolean;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  className?: string;
  /** Context printed above the terms (document title + detail rows). */
  printContext?: TermsPrintContext;
}

function TermsColumn({
  terms,
  languageLabel,
  dir,
  alignClass,
}: {
  terms: CustomerTermsRecord;
  languageLabel: string;
  dir: "ltr" | "rtl";
  alignClass?: string;
}) {
  const title = terms.terms_title?.trim() || languageLabel;

  return (
    <div className="min-w-0 flex flex-col rounded-md border bg-background">
      <div className={cn("border-b px-3 py-2 text-sm font-semibold", alignClass)} dir={dir}>
        {languageLabel}
        {title !== languageLabel ? (
          <span className="block text-xs font-normal text-muted-foreground">{title}</span>
        ) : null}
      </div>
      <div
        dir={dir}
        className={cn(
          "prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto p-3 text-sm",
          alignClass
        )}
        dangerouslySetInnerHTML={{
          __html: terms.more_details || "<p>No terms content.</p>",
        }}
      />
    </div>
  );
}

export function CustomerTermsAcceptance({
  terms,
  loading = false,
  accepted,
  onAcceptedChange,
  className,
  printContext,
}: CustomerTermsAcceptanceProps) {
  const hasEnglish = Boolean(terms?.english);
  const hasArabic = Boolean(terms?.arabic);
  const hasBoth = hasEnglish && hasArabic;

  return (
    <div className={cn("space-y-3 rounded-lg border bg-muted/30 p-3 sm:p-4", className)}>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading terms and conditions…
        </div>
      ) : !hasEnglish && !hasArabic ? (
        <p className="text-sm text-destructive">
          No customer terms found. Add two records in DMS Customer Terms and Conditions — leave
          Arabic unchecked for English, and check Arabic for the Arabic version.
        </p>
      ) : (
        <>
          <Collapsible defaultOpen={false}>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/60">
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Terms and Conditions / الشروط والأحكام</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!hasEnglish && !hasArabic}
                onClick={() => printCustomerTerms(terms, printContext)}
                title="Print terms and conditions"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
            <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                {terms?.english ? (
                  <TermsColumn
                    terms={terms.english}
                    languageLabel="English"
                    dir="ltr"
                  />
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-sm text-destructive">
                    English terms not configured (record without Arabic checked).
                  </div>
                )}
                {terms?.arabic ? (
                  <TermsColumn
                    terms={terms.arabic}
                    languageLabel="العربية"
                    dir="rtl"
                    alignClass="text-right"
                  />
                ) : (
                  <div
                    className="rounded-md border border-dashed p-4 text-sm text-destructive text-right"
                    dir="rtl"
                  >
                    Arabic terms not configured (check Arabic on that record).
                  </div>
                )}
              </div>
              {!hasBoth ? (
                <p className="mt-2 text-xs text-destructive">
                  Both English and Arabic terms are required before customer can sign.
                </p>
              ) : null}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-background p-3">
            <Checkbox
              id="accept-customer-terms"
              checked={accepted}
              disabled={!hasBoth}
              onCheckedChange={(v) => onAcceptedChange(Boolean(v))}
              className="mt-0.5"
            />
            <Label htmlFor="accept-customer-terms" className="cursor-pointer text-sm leading-snug">
              <span className="block">
                I have read and accept the terms and conditions above (English and Arabic). I
                understand this approval is required before signing.
              </span>
              <span className="mt-1 block text-muted-foreground" dir="rtl">
                لقد قرأت وأوافق على الشروط والأحكام أعلاه (بالإنجليزية والعربية). أفهم أن هذه
                الموافقة مطلوبة قبل التوقيع.
              </span>
            </Label>
          </div>
        </>
      )}
    </div>
  );
}
