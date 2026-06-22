'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  notificationNavigationTarget,
  stripNotificationHtml,
} from '@/lib/notification-routing';
import * as notificationsSvc from '@/services/notifications';
import { cn } from '@/lib/utils';

const POLL_MS = 60_000;
const LIST_LIMIT = 20;

function userInitials(name?: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isUnread(row: notificationsSvc.NotificationLogRow) {
  return !row.read;
}

export function NotificationBell() {
  const { navigate } = useNavigation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<notificationsSvc.NotificationLogRow[]>([]);
  const [userInfo, setUserInfo] = useState<Record<string, notificationsSvc.NotificationUserInfo>>({});

  const unreadCount = useMemo(() => rows.filter(isUnread).length, [rows]);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await notificationsSvc.fetchNotificationLogs(LIST_LIMIT);
      setRows(result.notification_logs || []);
      setUserInfo(result.user_info || {});
    } catch {
      setRows([]);
      setUserInfo({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      void loadNotifications();
      void notificationsSvc.triggerNotificationIndicatorHide().catch(() => undefined);
    }
  };

  const openNotification = async (row: notificationsSvc.NotificationLogRow) => {
    if (isUnread(row)) {
      setRows((current) =>
        current.map((item) => (item.name === row.name ? { ...item, read: 1 } : item)),
      );
      void notificationsSvc.markNotificationRead(row.name).catch(() => undefined);
    }

    const target = notificationNavigationTarget(row.document_type, row.document_name);
    if (target) {
      navigate(target.view, target.params);
      setOpen(false);
      return;
    }

    if (row.link) {
      window.open(row.link, '_blank', 'noopener,noreferrer');
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    setRows((current) => current.map((item) => ({ ...item, read: 1 })));
    try {
      await notificationsSvc.markAllNotificationsRead();
    } catch {
      void loadNotifications();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            No notifications for appointments, job cards, estimates, or parts requests.
          </p>
        ) : (
          rows.map((row) => {
            const fromUser = row.from_user ? userInfo[row.from_user] : undefined;
            const displayName = fromUser?.fullname || row.from_user || 'System';
            const message = stripNotificationHtml(row.subject);
            const when = row.creation
              ? formatDistanceToNow(new Date(row.creation), { addSuffix: true })
              : '';

            return (
              <DropdownMenuItem
                key={row.name}
                className={cn(
                  'flex cursor-pointer items-start gap-3 py-3',
                  isUnread(row) && 'bg-muted/40',
                )}
                onClick={() => void openNotification(row)}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  {fromUser?.user_image ? (
                    <AvatarImage src={fromUser.user_image} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {userInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={cn('text-sm leading-snug', isUnread(row) && 'font-medium')}>
                    {message || 'New notification'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {row.type ? <span>{row.type}</span> : null}
                    {when ? <span>{when}</span> : null}
                  </div>
                </div>
                {isUnread(row) ? (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-primary">
          <a
            href="/app/List/Notification Log?document_type=[%22Service%20Appointment%22,%22DMS%20Job%20Card%22,%22DMS%20Service%20Estimate%22,%22DMS%20Parts%20Request%22]"
            target="_blank"
            rel="noopener noreferrer"
          >
            View all in Desk
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
