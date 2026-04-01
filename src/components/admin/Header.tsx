'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, 
  Bell, 
  Activity,
  HelpCircle,
  BellOff,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Badge from './ui/Badge';
import Button from './ui/Button';
import adminAPI from '@/services/adminService';
import type { AdminNotification, AdminNotificationsResponse } from '@/types/admin.types';

interface HeaderProps {
  title: string;
  subtitle: string;
  onMobileMenuToggle: () => void;
}

const typeVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'muted'> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  alert: 'danger',
  system: 'muted',
  transaction: 'info',
  promotion: 'warning',
};

export default function Header({ title, subtitle, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSupportCount, setPendingSupportCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await adminAPI.getAllAdminNotifications({
        page: 1,
        limit: 15,
      })) as AdminNotificationsResponse;
      setNotifications(res.data ?? []);
      const stats = res.statistics ?? res.stats;
      setUnreadCount(stats?.unread ?? 0);
    } catch {
      // silently fail in header
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSupportQueue = useCallback(async () => {
    try {
      const res = await adminAPI.getAdminSupportUnreadCount();
      const total = Number(res?.data?.totalUnread ?? 0);
      setPendingSupportCount(Number.isFinite(total) ? total : 0);
    } catch {
      // silently fail in header
    }
  }, []);

  // Fetch on mount + every 60 s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    fetchSupportQueue();
    const interval = setInterval(fetchSupportQueue, 15_000);
    return () => clearInterval(interval);
  }, [fetchSupportQueue]);

  // Re-fetch immediately whenever SupportSection marks a chat as read
  useEffect(() => {
    const handler = () => fetchSupportQueue();
    window.addEventListener("support-chats-read", handler);
    return () => window.removeEventListener("support-chats-read", handler);
  }, [fetchSupportQueue]);

  const handleBellClick = () => {
    setOpen((prev) => !prev);
    if (!open) fetchNotifications();
  };

  const handleMarkOneRead = async (n: AdminNotification) => {
    if (n.isRead) return;
    // Optimistic update
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await adminAPI.markAdminNotificationRead(n.id);
    } catch {
      // Revert on failure
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: false } : x));
      setUnreadCount((c) => c + 1);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
    try {
      await adminAPI.markAllAdminNotificationsRead();
    } catch {
      fetchNotifications(); // Revert by re-fetching
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <header className="h-16 px-4 lg:px-6 flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm relative z-100">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="lg:hidden w-8 h-8 p-0 border border-admin-border"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="flex flex-col gap-0.5">
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Support queue */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 border border-gray-300 hover:border-green-500"
            title="Support center"
            onClick={() => router.push('/dashboard/support')}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          {pendingSupportCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-white rounded-full text-[10px] font-bold px-0.5 pointer-events-none">
              {pendingSupportCount > 99 ? '99+' : pendingSupportCount}
            </span>
          )}
        </div>

        {/* Notifications bell + popup */}
        <div ref={popupRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 border border-gray-300 hover:border-green-500"
            title="Notifications"
            onClick={handleBellClick}
          >
            <Bell className="w-4 h-4" />
          </Button>

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white rounded-full text-[10px] font-bold px-0.5 pointer-events-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Popup */}
          {open && (
            <div className="absolute right-0 top-10 z-9999 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-800">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      disabled={markingAll}
                      className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50 transition-colors"
                      title="Mark all as read"
                    >
                      {markingAll ? 'Marking…' : 'Mark all read'}
                    </button>
                  )}
                  <button
                    onClick={fetchNotifications}
                    disabled={loading}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
                {loading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <RefreshCw className="w-6 h-6 mb-2 animate-spin" />
                    <span className="text-xs">Loading…</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <BellOff className="w-8 h-8 mb-2 opacity-40" />
                    <span className="text-sm">No notifications</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkOneRead(n)}
                      className={`px-4 py-3 transition-colors cursor-pointer ${
                        !n.isRead ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'
                      }`}
                      title={!n.isRead ? 'Click to mark as read' : undefined}
                    >
                      <div className="flex items-start gap-2">
                        {/* Unread dot */}
                        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${!n.isRead ? 'bg-green-500' : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Badge variant={typeVariant[n.type] ?? 'muted'} className="text-[10px] px-1.5 py-0">
                              {n.type}
                            </Badge>
                            <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                              {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {' '}
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-800 truncate">{n.data?.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.data?.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                  <span className="text-xs text-gray-400">
                    Showing latest {notifications.length} · {unreadCount} unread
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* System status */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 border border-gray-300 hover:border-green-500"
            title="System events"
          >
            <Activity className="w-4 h-4" />
          </Button>
          <Badge 
            variant="success" 
            size="sm" 
            className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 font-bold"
          >
            OK
          </Badge>
        </div>

        {/* Admin avatar */}
        <div 
          className="w-8 h-8 rounded-full bg-linear-to-br from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-green-50 cursor-pointer border border-green-500/50 hover:scale-105 transition-transform"
          title="Current admin"
        >
          SA
        </div>
      </div>
    </header>
  );
}