'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { cancelQuotation, listQuotations, submitQuotation } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { SendQuotationDialog } from '@/components/crm/send-quotation-dialog';
import { ConfirmActionDialog } from '@/components/crm/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ban, Eye, Loader2, MoreHorizontal, Search, Send, Share2 } from 'lucide-react';

export default function CrmQuotationsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [shareRow, setShareRow] = useState<Record<string, unknown> | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    name: string;
    action: 'submit' | 'cancel';
  } | null>(null);
  const [busyName, setBusyName] = useState('');
  const { data, isLoading, mutate } = useSWR(['crm-quotations', search, status], () =>
    listQuotations({ search: search || undefined, status, limit: 100 })
  );
  const rows = data?.data || [];

  const runAction = async (name: string, action: 'submit' | 'cancel') => {
    const label = action === 'submit' ? 'submit' : 'cancel';
    setBusyName(name);
    try {
      if (action === 'submit') await submitQuotation(name);
      else await cancelQuotation(name);
      await mutate();
      setPendingAction(null);
      toast.success(action === 'submit' ? 'Quotation submitted.' : 'Quotation cancelled.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Failed to ${label} quotation.`);
    } finally {
      setBusyName('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">
          Review draft quotations, submit them, and track linked deals — without opening Desk.
        </p>
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search quotation, customer or deal…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="dms-table-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Quotation</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Deal</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => {
                      const name = String(row.name);
                      const docstatus = Number(row.docstatus || 0);
                      const isDraft = docstatus === 0;
                      const isSubmitted = docstatus === 1;
                      const busy = busyName === name;
                      return (
                        <tr
                          key={name}
                          className="cursor-pointer border-b border-border/60 hover:bg-muted/40"
                          onClick={() => navigate('crm-quotation-detail', { id: name })}
                        >
                          <td className="py-3 font-medium">{name}</td>
                          <td className="py-3 text-muted-foreground">
                            {String(row.customer_display || row.party_name || '—')}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {String(row.opportunity_title || row.opportunity || '—')}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {row.transaction_date ? String(row.transaction_date) : '—'}
                          </td>
                          <td className="py-3">
                            {row.currency ? `${row.currency} ` : ''}
                            {Number(row.grand_total || row.net_total || 0).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <Badge variant="outline">
                              {String(row.docstatus_label || row.status || 'Draft')}
                            </Badge>
                          </td>
                          <td
                            className="py-3 text-right"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={busy}
                                  aria-label={`Actions for ${name}`}
                                >
                                  {busy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate('crm-quotation-detail', { id: name })}
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShareRow(row)}>
                                  <Share2 className="h-4 w-4" />
                                  Share
                                </DropdownMenuItem>
                                {isDraft ? (
                                  <DropdownMenuItem
                                    disabled={busy}
                                    onClick={() => setPendingAction({ name, action: 'submit' })}
                                  >
                                    <Send className="h-4 w-4" />
                                    Submit
                                  </DropdownMenuItem>
                                ) : null}
                                {isSubmitted ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      disabled={busy}
                                      onClick={() => setPendingAction({ name, action: 'cancel' })}
                                    >
                                      <Ban className="h-4 w-4" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No quotations yet. Create one from a completed Test Drive on a Deal.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SendQuotationDialog
        open={Boolean(shareRow)}
        onOpenChange={(open) => {
          if (!open) setShareRow(null);
        }}
        quotationId={String(shareRow?.name || '')}
        customer={{
          name: String(shareRow?.party_name || ''),
          display: String(shareRow?.customer_display || shareRow?.party_name || ''),
          email: String(shareRow?.customer_email || ''),
          phone: String(shareRow?.customer_mobile || ''),
        }}
      />
      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !busyName) setPendingAction(null);
        }}
        title={
          pendingAction?.action === 'cancel' ? 'Cancel this quotation?' : 'Submit this quotation?'
        }
        description={
          pendingAction?.action === 'cancel'
            ? `${pendingAction.name} will be cancelled. This cannot be undone from here.`
            : `${pendingAction?.name || 'This quotation'} will be submitted. After that it cannot be edited — you can still share it with the customer.`
        }
        confirmLabel={pendingAction?.action === 'cancel' ? 'Cancel quotation' : 'Submit quotation'}
        cancelLabel={pendingAction?.action === 'cancel' ? 'Keep quotation' : 'Keep as draft'}
        destructive={pendingAction?.action === 'cancel'}
        loading={Boolean(busyName)}
        onConfirm={() => {
          if (pendingAction) void runAction(pendingAction.name, pendingAction.action);
        }}
      />
    </div>
  );
}
