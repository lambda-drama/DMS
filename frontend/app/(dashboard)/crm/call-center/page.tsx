'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  clickToCall,
  createQualityScore,
  getCallCenterQueues,
  getCallScript,
  getQueueCalls,
  listCallScripts,
  lookupCustomerByPhone,
  setCallDisposition,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2, Phone, PhoneCall, Search, UserRound } from 'lucide-react';

const DISPOSITIONS = [
  'Reached',
  'No Answer',
  'Busy',
  'Invalid Number',
  'Callback',
  'Appointment',
  'Interested',
  'Declined',
  'Complaint',
  'Do Not Contact',
];

export default function CrmCallCenterPage() {
  const { navigate } = useNavigation();
  const [queue, setQueue] = useState('Inbound');
  const [search, setSearch] = useState('');
  const [phoneLookup, setPhoneLookup] = useState('');
  const [selectedCall, setSelectedCall] = useState('');
  const [disposition, setDisposition] = useState('');
  const [callbackAt, setCallbackAt] = useState('');
  const [callbackOwner, setCallbackOwner] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [score, setScore] = useState('80');
  const [coaching, setCoaching] = useState('');
  const [busy, setBusy] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();

  const { data: queueMeta, mutate: mutateQueues } = useSWR(
    'crm-call-center-queues',
    getCallCenterQueues
  );
  const { data: calls, isLoading, mutate } = useSWR(
    ['crm-call-center-calls', queue, search],
    () =>
      getQueueCalls({
        queue: queue || undefined,
        search: search || undefined,
        limit: 50,
      })
  );
  const { data: popup } = useSWR(
    phoneLookup.trim().length >= 6 ? ['crm-phone-lookup', phoneLookup] : null,
    () => lookupCustomerByPhone(phoneLookup.trim())
  );
  const { data: scripts } = useSWR(['crm-call-scripts', queue], () =>
    listCallScripts({ queue: queue || undefined })
  );
  const { data: scriptDetail } = useSWR(
    scriptName ? ['crm-call-script', scriptName] : null,
    () => getCallScript(scriptName)
  );

  const rows = (calls?.data || []) as Record<string, unknown>[];
  const queues = (queueMeta?.queues || []) as string[];
  const counts = (queueMeta?.counts || {}) as Record<string, number>;

  const selected = useMemo(
    () => rows.find((r) => String(r.name) === selectedCall),
    [rows, selectedCall]
  );

  const onDisposition = async () => {
    if (!selectedCall || !disposition) {
      showError('Select a call and disposition.');
      return;
    }
    clear();
    setBusy(true);
    try {
      await setCallDisposition(selectedCall, {
        disposition,
        queue,
        callback_datetime: disposition === 'Callback' ? callbackAt : null,
        callback_owner: disposition === 'Callback' ? callbackOwner : null,
        call_script: scriptName || null,
        customer: popup?.customer?.name || selected?.custom_customer || null,
      });
      await mutate();
      await mutateQueues();
      showSuccess('Disposition saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save disposition');
    } finally {
      setBusy(false);
    }
  };

  const onClickToCall = async () => {
    const phone = phoneLookup || String(selected?.to || selected?.from || '');
    if (!phone) {
      showError('Enter a phone number.');
      return;
    }
    clear();
    setBusy(true);
    try {
      const result = await clickToCall({
        phone,
        customer: popup?.customer?.name,
        queue,
      });
      if (result?.dial_uri && typeof window !== 'undefined') {
        window.location.href = String(result.dial_uri);
      }
      showSuccess(`Outgoing call logged: ${result?.call_log || ''}`);
      await mutate();
    } catch (e: unknown) {
      showError(e, 'Click-to-call failed');
    } finally {
      setBusy(false);
    }
  };

  const onScore = async () => {
    if (!selectedCall) return;
    clear();
    setBusy(true);
    try {
      await createQualityScore({
        call_log: selectedCall,
        score: Number(score),
        coaching_notes: coaching,
        compliance_passed: 1,
      });
      showSuccess('Quality score saved.');
      setCoaching('');
    } catch (e: unknown) {
      showError(e, 'Failed to save quality score');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {queues.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQueue(q)}
            className={`rounded-xl border px-3 py-3 text-left transition ${
              queue === q
                ? 'border-primary bg-primary/10'
                : 'border-border/70 hover:border-primary/50'
            }`}
          >
            <p className="text-xs text-muted-foreground">{q}</p>
            <p className="text-xl font-semibold">{counts[q] ?? 0}</p>
          </button>
        ))}
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Open callbacks</p>
            <p className="text-xl font-semibold">{queueMeta?.open_callbacks ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/70 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search queue calls…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => navigate('crm-call-log-new')}>
                Log call
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="dms-table-panel">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Call</th>
                      <th className="pb-2 font-medium">Disposition</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No calls in this queue.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={String(row.name)}
                          className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                          onClick={() => {
                            setSelectedCall(String(row.name));
                            setPhoneLookup(String(row.from || row.to || ''));
                            setDisposition(String(row.custom_disposition || ''));
                          }}
                        >
                          <td className="py-3">
                            <p className="font-medium">
                              {String(row.type)} · {String(row.from || row.to || row.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {String(row.customer_name || row.custom_customer || row.name)}
                            </p>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {String(row.custom_disposition || '—')}
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary">{String(row.status || '—')}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {row.start_time ? String(row.start_time).slice(0, 16) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4" />
                Customer pop-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Phone number…"
                  value={phoneLookup}
                  onChange={(e) => setPhoneLookup(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={busy || !queueMeta?.enable_click_to_call}
                  onClick={() => void onClickToCall()}
                >
                  <Phone className="mr-1 h-4 w-4" />
                  Dial
                </Button>
              </div>
              {popup?.matched ? (
                <div className="space-y-2 rounded-lg border border-border/60 p-3 text-sm">
                  <p className="font-medium">{String(popup.customer?.customer_name)}</p>
                  <p className="text-muted-foreground">{String(popup.customer?.mobile_no || '')}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigate('crm-customer-detail', {
                        id: String(popup.customer?.name),
                      })
                    }
                  >
                    Open Customer 360
                  </Button>
                  <div className="space-y-1 pt-2">
                    <p className="text-xs font-medium text-muted-foreground">Open activities</p>
                    {((popup.open_activities as Record<string, unknown>[]) || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">None</p>
                    ) : (
                      ((popup.open_activities as Record<string, unknown>[]) || []).map((a) => (
                        <p key={String(a.name)} className="text-xs">
                          {String(a.subject)} · {String(a.activity_type)}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              ) : phoneLookup.trim().length >= 6 ? (
                <p className="text-sm text-muted-foreground">No customer match for this number.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneCall className="h-4 w-4" />
                Disposition & script
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
              >
                <option value="">Disposition…</option>
                {DISPOSITIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {disposition === 'Callback' ? (
                <>
                  <Input
                    type="datetime-local"
                    value={callbackAt}
                    onChange={(e) => setCallbackAt(e.target.value)}
                  />
                  <Input
                    placeholder="Callback owner (user email)"
                    value={callbackOwner}
                    onChange={(e) => setCallbackOwner(e.target.value)}
                  />
                </>
              ) : null}
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
              >
                <option value="">Call script…</option>
                {((scripts as Record<string, unknown>[]) || []).map((s) => (
                  <option key={String(s.name)} value={String(s.name)}>
                    {String(s.script_name || s.name)}
                  </option>
                ))}
              </select>
              {scriptDetail ? (
                <div className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{String(scriptDetail.opening_line || '')}</p>
                  <div
                    className="prose prose-sm mt-2 max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: String(scriptDetail.script_body || ''),
                    }}
                  />
                </div>
              ) : null}
              <Button disabled={busy || !selectedCall} onClick={() => void onDisposition()}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save disposition
              </Button>
              {selected?.recording_url ? (
                <a
                  className="block text-xs text-primary underline"
                  href={String(selected.recording_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open recording
                </a>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quality monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="number"
                min={1}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Score 1–100"
              />
              <Textarea
                rows={3}
                placeholder="Coaching notes / compliance checks"
                value={coaching}
                onChange={(e) => setCoaching(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={busy || !selectedCall}
                onClick={() => void onScore()}
              >
                Save supervisor score
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
