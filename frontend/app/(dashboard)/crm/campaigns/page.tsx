'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCampaigns, listSegments } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

export default function CrmCampaignsPage() {
  const { navigate } = useNavigation();
  const [tab, setTab] = useState<'campaigns' | 'segments'>('campaigns');
  const [search, setSearch] = useState('');
  const { data: campaigns, isLoading: loadingCampaigns } = useSWR(
    tab === 'campaigns' ? ['crm-campaigns', search] : null,
    () => listCampaigns({ search: search || undefined, limit: 50 })
  );
  const { data: segments, isLoading: loadingSegments } = useSWR(
    tab === 'segments' ? ['crm-segments', search] : null,
    () => listSegments({ search: search || undefined, limit: 50 })
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={tab === 'campaigns' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('campaigns')}
          >
            Campaigns
          </Button>
          <Button
            variant={tab === 'segments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('segments')}
          >
            Segments
          </Button>
        </div>
        <Button
          onClick={() =>
            navigate(tab === 'campaigns' ? 'crm-campaign-new' : 'crm-segment-new')
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {tab === 'campaigns' ? 'New Campaign' : 'New Segment'}
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={
                tab === 'campaigns' ? 'Search campaigns…' : 'Search segments…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'campaigns' ? (
            loadingCampaigns ? (
              <Skeleton className="h-24" />
            ) : (
              <div className="dms-table-panel">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Campaign</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Channel</th>
                      <th className="pb-2 font-medium">Members</th>
                      <th className="pb-2 font-medium">Sales</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(campaigns?.data || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                          No campaigns yet.
                        </td>
                      </tr>
                    ) : (
                      (campaigns?.data || []).map((row: Record<string, unknown>) => (
                        <tr
                          key={String(row.name)}
                          className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                          onClick={() =>
                            navigate('crm-campaign-detail', { id: String(row.name) })
                          }
                        >
                          <td className="py-3">
                            <p className="font-medium">
                              {String(row.campaign_name || row.name)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {String(row.name)}
                            </p>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {String(row.campaign_type || '—')}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {String(row.channel || '—')}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {Number(row.members_count || 0)}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {Number(row.sale_count || 0)}
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary" className="font-normal">
                              {String(row.status || '—')}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )
          ) : loadingSegments ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="dms-table-panel">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Segment</th>
                    <th className="pb-2 font-medium">Brand</th>
                    <th className="pb-2 font-medium">Retention</th>
                    <th className="pb-2 font-medium">Audience</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(segments?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        No segments yet.
                      </td>
                    </tr>
                  ) : (
                    (segments?.data || []).map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-segment-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3 font-medium">
                          {String(row.segment_name || row.name)}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.brand || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.retention_category || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {Number(row.audience_count || 0)}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="font-normal">
                            {String(row.status || '—')}
                          </Badge>
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
    </div>
  );
}
