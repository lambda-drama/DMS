'use client';

import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmBrandLink } from '@/components/crm/crm-brand-link';
import { CrmColorLink } from '@/components/crm/crm-color-link';
import {
  fetchCrmBranches,
  fetchCrmCompanyCurrency,
  fetchCrmVehicleModels,
  type LeadFormOptions,
} from '@/services/crm';

export type LeadFormState = {
  lead_name: string;
  first_name: string;
  last_name: string;
  organization_name: string;
  customer_type: string;
  mobile_no: string;
  phone: string;
  email: string;
  preferred_contact_method: string;
  language: string;
  source: string;
  campaign: string;
  country: string;
  branch: string;
  assigned_team: string;
  lead_owner: string;
  company: string;
  priority: string;
  status: string;
  brand: string;
  model: string;
  variant: string;
  new_or_used: string;
  quantity: string;
  budget_range: string;
  preferred_color: string;
  intended_use: string;
  timeframe: string;
  trade_in_required: boolean;
  trade_in_vehicle: string;
  trade_in_year: string;
  trade_in_mileage: string;
  trade_in_expected_value: string;
  finance_method: string;
  finance_notes: string;
  lead_score: string;
  urgency: string;
  need: boolean;
  authority: boolean;
  budget_confirmed: boolean;
  timing_confirmed: boolean;
  competitor: string;
  qualification_notes: string;
  next_action: string;
  next_action_due: string;
  preferred_appointment: string;
  contact_notes: string;
  consent_marketing: boolean;
  consent_channel: boolean;
  consent_source: string;
  notes: string;
};

export const emptyLeadForm = (): LeadFormState => ({
  lead_name: '',
  first_name: '',
  last_name: '',
  organization_name: '',
  customer_type: 'Individual',
  mobile_no: '',
  phone: '',
  email: '',
  preferred_contact_method: 'Phone',
  language: '',
  source: 'Showroom Walk-in',
  campaign: '',
  country: '',
  branch: '',
  assigned_team: '',
  lead_owner: '',
  company: '',
  priority: 'Standard',
  status: 'New',
  brand: '',
  model: '',
  variant: '',
  new_or_used: 'New',
  quantity: '1',
  budget_range: '',
  preferred_color: '',
  intended_use: '',
  timeframe: '',
  trade_in_required: false,
  trade_in_vehicle: '',
  trade_in_year: '',
  trade_in_mileage: '',
  trade_in_expected_value: '',
  finance_method: '',
  finance_notes: '',
  lead_score: '0',
  urgency: '',
  need: false,
  authority: false,
  budget_confirmed: false,
  timing_confirmed: false,
  competitor: '',
  qualification_notes: '',
  next_action: 'First contact call',
  next_action_due: '',
  preferred_appointment: '',
  contact_notes: '',
  consent_marketing: false,
  consent_channel: false,
  consent_source: '',
  notes: '',
});

/** Convert Frappe datetime to datetime-local input value. */
export function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function leadFromDoc(doc: Record<string, unknown>): LeadFormState {
  const base = emptyLeadForm();
  const str = (k: keyof LeadFormState) => String(doc[k] ?? base[k] ?? '');
  const bool = (k: string) => Boolean(cintLike(doc[k]));
  return {
    ...base,
    lead_name: str('lead_name'),
    first_name: str('first_name'),
    last_name: str('last_name'),
    organization_name: str('organization_name'),
    customer_type: str('customer_type') || 'Individual',
    mobile_no: str('mobile_no'),
    phone: str('phone'),
    email: str('email'),
    preferred_contact_method: str('preferred_contact_method') || 'Phone',
    language: str('language'),
    source: str('source') || 'Showroom Walk-in',
    campaign: str('campaign'),
    country: str('country'),
    branch: str('branch'),
    assigned_team: str('assigned_team'),
    lead_owner: str('lead_owner'),
    company: str('company'),
    priority: str('priority') || 'Standard',
    status: str('status') || 'New',
    brand: str('brand'),
    model: str('model'),
    variant: str('variant'),
    new_or_used: str('new_or_used') || 'New',
    quantity: str('quantity') || '1',
    budget_range: str('budget_range'),
    preferred_color: str('preferred_color'),
    intended_use: str('intended_use'),
    timeframe: str('timeframe'),
    trade_in_required: bool('trade_in_required'),
    trade_in_vehicle: str('trade_in_vehicle'),
    trade_in_year: str('trade_in_year'),
    trade_in_mileage: str('trade_in_mileage'),
    trade_in_expected_value: str('trade_in_expected_value'),
    finance_method: str('finance_method'),
    finance_notes: str('finance_notes'),
    lead_score: str('lead_score') || '0',
    urgency: str('urgency'),
    need: bool('need'),
    authority: bool('authority'),
    budget_confirmed: bool('budget_confirmed'),
    timing_confirmed: bool('timing_confirmed'),
    competitor: str('competitor'),
    qualification_notes: str('qualification_notes'),
    next_action: str('next_action'),
    next_action_due: toLocalInput(doc.next_action_due as string),
    preferred_appointment: toLocalInput(doc.preferred_appointment as string),
    contact_notes: str('contact_notes'),
    consent_marketing: bool('consent_marketing'),
    consent_channel: bool('consent_channel'),
    consent_source: str('consent_source'),
    notes: typeof doc.notes === 'string' ? doc.notes.replace(/<[^>]+>/g, '') : '',
  };
}

function cintLike(v: unknown): number {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return ['1', 'true', 'True', 'yes'].includes(v) ? 1 : Number(v) || 0;
  return 0;
}

/** Payload for create/update API. */
export function leadPayload(form: LeadFormState): Record<string, unknown> {
  const leadName =
    form.lead_name.trim() ||
    [form.first_name, form.last_name].filter(Boolean).join(' ') ||
    form.organization_name ||
    form.mobile_no;

  return {
    lead_name: leadName,
    first_name: form.first_name.trim() || undefined,
    last_name: form.last_name.trim() || undefined,
    organization_name: form.organization_name.trim() || undefined,
    customer_type: form.customer_type || undefined,
    mobile_no: form.mobile_no.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    preferred_contact_method: form.preferred_contact_method || undefined,
    language: form.language.trim() || undefined,
    source: form.source,
    campaign: form.campaign.trim() || undefined,
    country: form.country || undefined,
    branch: form.branch || undefined,
    assigned_team: form.assigned_team || undefined,
    lead_owner: form.lead_owner || undefined,
    company: form.company || undefined,
    priority: form.priority || 'Standard',
    status: form.status || 'New',
    brand: form.brand.trim() || undefined,
    model: form.model.trim() || undefined,
    variant: form.variant.trim() || undefined,
    new_or_used: form.new_or_used || undefined,
    quantity: Number(form.quantity) || 1,
    budget_range: form.budget_range.trim() || undefined,
    preferred_color: form.preferred_color.trim() || undefined,
    intended_use: form.intended_use.trim() || undefined,
    timeframe: form.timeframe || undefined,
    trade_in_required: form.trade_in_required ? 1 : 0,
    trade_in_vehicle: form.trade_in_required ? form.trade_in_vehicle.trim() || undefined : undefined,
    trade_in_year: form.trade_in_required && form.trade_in_year ? Number(form.trade_in_year) : undefined,
    trade_in_mileage:
      form.trade_in_required && form.trade_in_mileage ? Number(form.trade_in_mileage) : undefined,
    trade_in_expected_value:
      form.trade_in_required && form.trade_in_expected_value
        ? Number(form.trade_in_expected_value)
        : undefined,
    finance_method: form.finance_method || undefined,
    finance_notes: form.finance_notes.trim() || undefined,
    lead_score: Number(form.lead_score) || 0,
    urgency: form.urgency || undefined,
    need: form.need ? 1 : 0,
    authority: form.authority ? 1 : 0,
    budget_confirmed: form.budget_confirmed ? 1 : 0,
    timing_confirmed: form.timing_confirmed ? 1 : 0,
    competitor: form.competitor.trim() || undefined,
    qualification_notes: form.qualification_notes.trim() || undefined,
    next_action: form.next_action.trim() || undefined,
    next_action_due: form.next_action_due || undefined,
    preferred_appointment: form.preferred_appointment || undefined,
    contact_notes: form.contact_notes.trim() || undefined,
    consent_marketing: form.consent_marketing ? 1 : 0,
    consent_channel: form.consent_channel ? 1 : 0,
    consent_source: form.consent_source.trim() || undefined,
    notes: form.notes.trim() || undefined,
  };
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</label>;
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function opts(list?: string[]) {
  return (list || []).map((s) => ({ value: s, label: s }));
}

type Props = {
  form: LeadFormState;
  setForm: Dispatch<SetStateAction<LeadFormState>>;
  options?: LeadFormOptions | null;
  showStatus?: boolean;
  readOnlyMeta?: ReactNode;
};

export function LeadFormSections({ form, setForm, options, showStatus, readOnlyMeta }: Props) {
  const [modelSearch, setModelSearch] = useState('');

  const { data: branches } = useSWR(['crm-branches', form.company], () =>
    fetchCrmBranches(form.company),
  );
  const { data: models, isLoading: modelsLoading } = useSWR(
    ['crm-vehicle-models', modelSearch, form.brand],
    () => fetchCrmVehicleModels(modelSearch, form.brand || undefined),
    { keepPreviousData: true },
  );
  const { data: companyCurrency } = useSWR(
    ['crm-company-currency', form.company || options?.default_company || null],
    () => fetchCrmCompanyCurrency(form.company || options?.default_company || undefined),
    { keepPreviousData: true },
  );

  const set = (key: keyof LeadFormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  // Offering a branch that belongs to another company is what makes the server
  // reject the save, so the list is always scoped to the selected company.
  const branchOptions = opts(branches?.map((row) => row.name));
  const currencySymbol =
    companyCurrency?.symbol || options?.currency_symbol || companyCurrency?.currency || options?.currency || '';

  const onBrandChange = (v: string) => {
    setForm((prev) => {
      const next = { ...prev, brand: v || '' };
      if (prev.model && v && prev.brand && v !== prev.brand) {
        next.model = '';
        next.variant = '';
      }
      return next;
    });
  };

  const onModelChange = (v: string) => {
    const selected = (models || []).find((m) => m.name === v);
    setForm((prev) => ({
      ...prev,
      model: v || '',
      brand: prev.brand || selected?.brand || '',
      variant: prev.variant || selected?.variant || '',
    }));
  };

  return (
    <div className="space-y-4">
      {readOnlyMeta}

      <Tabs defaultValue="lead" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="lead">Lead & Prospect</TabsTrigger>
          <TabsTrigger value="details">Interest & Details</TabsTrigger>
        </TabsList>

        <TabsContent value="lead" className="mt-0 space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identification</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Lead Name</FieldLabel>
                <Input
                  value={form.lead_name}
                  onChange={(e) => set('lead_name', e.target.value)}
                  placeholder="Auto-filled from name / org / mobile"
                />
              </div>
              <div>
                <FieldLabel>Source *</FieldLabel>
                <SearchableSelect
                  options={opts(options?.sources)}
                  value={form.source}
                  onValueChange={(v) => set('source', v || 'Showroom Walk-in')}
                  placeholder="Select source…"
                />
              </div>
              <div>
                <FieldLabel>Priority / SLA</FieldLabel>
                <SearchableSelect
                  options={opts(options?.priorities)}
                  value={form.priority}
                  onValueChange={(v) => set('priority', v || 'Standard')}
                  placeholder="Select priority…"
                />
              </div>
              {showStatus ? (
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <SearchableSelect
                    options={opts(options?.statuses)}
                    value={form.status}
                    onValueChange={(v) => set('status', v || 'New')}
                    placeholder="Status…"
                  />
                </div>
              ) : null}
              <div>
                <FieldLabel>Campaign</FieldLabel>
                <Input value={form.campaign} onChange={(e) => set('campaign', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Country</FieldLabel>
                <SearchableSelect
                  options={opts(options?.countries)}
                  value={form.country}
                  onValueChange={(v) => set('country', v || '')}
                  placeholder="Select country…"
                />
              </div>
              <div>
                <FieldLabel>Branch</FieldLabel>
                <SearchableSelect
                  options={branchOptions}
                  value={form.branch}
                  onValueChange={(v) => set('branch', v || '')}
                  placeholder="Select branch…"
                />
              </div>
              <div>
                <FieldLabel>Assigned Team</FieldLabel>
                <SearchableSelect
                  options={opts(options?.teams)}
                  value={form.assigned_team}
                  onValueChange={(v) => set('assigned_team', v || '')}
                  placeholder="Auto from source…"
                />
              </div>
              <div>
                <FieldLabel>Lead Owner</FieldLabel>
                <SearchableSelect
                  options={options?.users || []}
                  value={form.lead_owner}
                  onValueChange={(v) => set('lead_owner', v || '')}
                  placeholder="Blank = round-robin when enabled…"
                />
              </div>
              <div>
                <FieldLabel>Company</FieldLabel>
                <SearchableSelect
                  options={opts(options?.companies)}
                  value={form.company}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, company: v || '', branch: '' }))
                  }
                  placeholder="Company…"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prospect</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>First Name</FieldLabel>
                <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Mobile</FieldLabel>
                <Input value={form.mobile_no} onChange={(e) => set('mobile_no', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Preferred Contact</FieldLabel>
                <SearchableSelect
                  options={opts(options?.contact_methods)}
                  value={form.preferred_contact_method}
                  onValueChange={(v) => set('preferred_contact_method', v || 'Phone')}
                  placeholder="Contact method…"
                />
              </div>
              <div>
                <FieldLabel>Language</FieldLabel>
                <Input value={form.language} onChange={(e) => set('language', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Customer Type</FieldLabel>
                <SearchableSelect
                  options={opts(options?.customer_types)}
                  value={form.customer_type}
                  onValueChange={(v) => set('customer_type', v || 'Individual')}
                  placeholder="Type…"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Organization</FieldLabel>
                <Input
                  value={form.organization_name}
                  onChange={(e) => set('organization_name', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-0 space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Interest</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Brand</FieldLabel>
                <CrmBrandLink value={form.brand} onValueChange={onBrandChange} />
              </div>
              <div>
                <FieldLabel>Model</FieldLabel>
                <SearchableSelect
                  options={(models || []).map((vm) => ({
                    value: vm.name,
                    label: vm.model_code || vm.name,
                    description:
                      [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
                  }))}
                  value={form.model}
                  onValueChange={(v) => onModelChange(v || '')}
                  onSearchChange={setModelSearch}
                  placeholder="Search vehicle models…"
                  isLoading={modelsLoading}
                />
              </div>
              <div>
                <FieldLabel>Variant</FieldLabel>
                <Input value={form.variant} onChange={(e) => set('variant', e.target.value)} />
              </div>
              <div>
                <FieldLabel>New / Used</FieldLabel>
                <SearchableSelect
                  options={opts(options?.new_or_used)}
                  value={form.new_or_used}
                  onValueChange={(v) => set('new_or_used', v || 'New')}
                  placeholder="New / Used…"
                />
              </div>
              <div>
                <FieldLabel>Quantity</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Budget Range</FieldLabel>
                <Input value={form.budget_range} onChange={(e) => set('budget_range', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Preferred Color</FieldLabel>
                <CrmColorLink
                  value={form.preferred_color}
                  onValueChange={(v) => set('preferred_color', v)}
                />
              </div>
              <div>
                <FieldLabel>Intended Use</FieldLabel>
                <Input value={form.intended_use} onChange={(e) => set('intended_use', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Purchase Timeframe</FieldLabel>
                <SearchableSelect
                  options={opts(options?.timeframes)}
                  value={form.timeframe}
                  onValueChange={(v) => set('timeframe', v || '')}
                  placeholder="Timeframe…"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trade-in</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <CheckRow
                  label="Trade-in required"
                  checked={form.trade_in_required}
                  onChange={(v) => set('trade_in_required', v)}
                />
              </div>
              {form.trade_in_required ? (
                <>
                  <div>
                    <FieldLabel>Current Vehicle</FieldLabel>
                    <Input
                      value={form.trade_in_vehicle}
                      onChange={(e) => set('trade_in_vehicle', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Year</FieldLabel>
                    <Input
                      type="number"
                      value={form.trade_in_year}
                      onChange={(e) => set('trade_in_year', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Mileage</FieldLabel>
                    <Input
                      type="number"
                      value={form.trade_in_mileage}
                      onChange={(e) => set('trade_in_mileage', e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>
                      Expected Value{currencySymbol ? ` (${currencySymbol})` : ''}
                    </FieldLabel>
                    <div className="relative">
                      {currencySymbol ? (
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {currencySymbol}
                        </span>
                      ) : null}
                      <Input
                        type="number"
                        className={currencySymbol ? 'pl-10' : undefined}
                        value={form.trade_in_expected_value}
                        onChange={(e) => set('trade_in_expected_value', e.target.value)}
                      />
                    </div>
                  </div>                </>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Finance</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Finance Method</FieldLabel>
                <SearchableSelect
                  options={opts(options?.finance_methods)}
                  value={form.finance_method}
                  onValueChange={(v) => set('finance_method', v || '')}
                  placeholder="Cash / finance…"
                />
              </div>
              <div>
                <FieldLabel>Finance Notes</FieldLabel>
                <Input value={form.finance_notes} onChange={(e) => set('finance_notes', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Qualification</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Lead Score</FieldLabel>
                <Input
                  type="number"
                  value={form.lead_score}
                  onChange={(e) => set('lead_score', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Urgency</FieldLabel>
                <SearchableSelect
                  options={opts(options?.urgencies)}
                  value={form.urgency}
                  onValueChange={(v) => set('urgency', v || '')}
                  placeholder="Urgency…"
                />
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <CheckRow label="Need confirmed" checked={form.need} onChange={(v) => set('need', v)} />
                <CheckRow
                  label="Authority confirmed"
                  checked={form.authority}
                  onChange={(v) => set('authority', v)}
                />
                <CheckRow
                  label="Budget confirmed"
                  checked={form.budget_confirmed}
                  onChange={(v) => set('budget_confirmed', v)}
                />
                <CheckRow
                  label="Timing confirmed"
                  checked={form.timing_confirmed}
                  onChange={(v) => set('timing_confirmed', v)}
                />
              </div>
              <div>
                <FieldLabel>Competitor</FieldLabel>
                <Input value={form.competitor} onChange={(e) => set('competitor', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Qualification Notes</FieldLabel>
                <Input
                  value={form.qualification_notes}
                  onChange={(e) => set('qualification_notes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Next Action</FieldLabel>
                <Input value={form.next_action} onChange={(e) => set('next_action', e.target.value)} />
              </div>
              <div>
                <FieldLabel>Next Action Due</FieldLabel>
                <Input
                  type="datetime-local"
                  value={form.next_action_due}
                  onChange={(e) => set('next_action_due', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Preferred Appointment</FieldLabel>
                <Input
                  type="datetime-local"
                  value={form.preferred_appointment}
                  onChange={(e) => set('preferred_appointment', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Contact Notes</FieldLabel>
                <Input value={form.contact_notes} onChange={(e) => set('contact_notes', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consent</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <CheckRow
                label="Marketing consent"
                checked={form.consent_marketing}
                onChange={(v) => set('consent_marketing', v)}
              />
              <CheckRow
                label="Channel consent"
                checked={form.consent_channel}
                onChange={(v) => set('consent_channel', v)}
              />
              <div className="sm:col-span-2">
                <FieldLabel>Consent Source</FieldLabel>
                <Input
                  value={form.consent_source}
                  onChange={(e) => set('consent_source', e.target.value)}
                  placeholder="Defaults to lead source"
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
