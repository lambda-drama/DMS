'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCustomers } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ListRowActions } from '@/components/list-row-actions';
import {
  EditCustomerDialog,
  type EditableCustomer,
} from '@/components/customers/edit-customer-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Mail, MoreHorizontal, Pencil, Phone, Plus, Search } from 'lucide-react';

function rowToCustomer(row: Record<string, unknown>): EditableCustomer {
  const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
  return {
    name: str(row.name),
    customer_name: str(row.customer_name),
    customer_type: str(row.customer_type),
    customer_group: str(row.customer_group),
    mobile_no: str(row.mobile_no),
    email_id: str(row.email_id),
    territory: str(row.territory),
    tax_id: str(row.tax_id),
    website: str(row.website),
  };
}

export default function CrmCustomersPage() {
  const { navigate } = useNavigation();
  const { canWrite } = usePermissions();
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditableCustomer | null>(null);
  const { data, isLoading, mutate } = useSWR(['crm-customers', search], () =>
    listCustomers({ search: search || undefined, limit: 50 })
  );
  const rows = data?.data || [];
  const emptyMessage =
    data?.message ||
    (rows.length === 0 ? 'No DMS customers found.' : null);

  function openEdit(row: Record<string, unknown>) {
    setEditTarget(rowToCustomer(row));
    setEditOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-customer-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="dms-table-panel">
              <table className="w-full table-fixed text-sm" style={{ minWidth: '60rem' }}>
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="w-[260px] pb-2 font-medium">Customer</th>
                    <th className="w-[130px] pb-2 font-medium">Mobile</th>
                    <th className="w-[180px] pb-2 font-medium">Email</th>
                    <th className="w-[150px] pb-2 font-medium">Group</th>
                    <th className="w-[100px] pb-2 font-medium">Type</th>
                    <th className="w-[92px] pb-2 text-right font-medium">Actions</th>
                    <th className="w-auto pb-2" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => {
                      const name = String(row.name);
                      const mobile = row.mobile_no ? String(row.mobile_no) : '';
                      const email = row.email_id ? String(row.email_id) : '';
                      return (
                        <tr
                          key={name}
                          className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                          onClick={() => navigate('crm-customer-detail', { id: name })}
                        >
                          <td className="py-2.5 pr-2">
                            <p className="max-w-[220px] truncate font-medium">
                              {String(row.customer_name || row.name)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{name}</p>
                          </td>
                          <td className="py-2.5 pr-2 text-muted-foreground">
                            {mobile || '—'}
                          </td>
                          <td className="py-2.5 pr-2 text-muted-foreground">
                            {email ? (
                              <span className="block max-w-[170px] truncate" title={email}>
                                {email}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 pr-2 text-muted-foreground">
                            <span
                              className="block max-w-[140px] truncate"
                              title={String(row.customer_group || '')}
                            >
                              {String(row.customer_group || '—')}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 text-muted-foreground">
                            {String(row.customer_type || '—')}
                          </td>
                          <td className="py-2.5 pr-2 text-right">
                            <ListRowActions doctype="Customer" docName={name}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => navigate('crm-customer-detail', { id: name })}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canWrite('customers') ? (
                                    <DropdownMenuItem onClick={() => openEdit(row)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit Customer
                                    </DropdownMenuItem>
                                  ) : null}
                                  {mobile ? (
                                    <DropdownMenuItem
                                      onClick={() => window.open(`tel:${mobile}`, '_self')}
                                    >
                                      <Phone className="mr-2 h-4 w-4" />
                                      Call
                                    </DropdownMenuItem>
                                  ) : null}
                                  {email ? (
                                    <DropdownMenuItem
                                      onClick={() => window.open(`mailto:${email}`, '_self')}
                                    >
                                      <Mail className="mr-2 h-4 w-4" />
                                      Email
                                    </DropdownMenuItem>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </ListRowActions>
                          </td>
                          <td aria-hidden />
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <EditCustomerDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        customer={editTarget}
        onUpdated={() => {
          void mutate();
        }}
      />
    </div>
  );
}
