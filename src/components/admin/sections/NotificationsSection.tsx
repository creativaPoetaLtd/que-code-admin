"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import KPICard from "../KPICard";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableMainText,
  TableActions,
} from "../ui/Table";
import { IconButton } from "../ui/Button";
import {
  Bell,
  BellOff,
  Megaphone,
  RefreshCw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  Users,
  Globe,
  Filter,
  X,
  ChevronDown,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  AdminUser,
  AdminNotification,
  AdminNotificationsResponse,
} from "@/types/admin.types";

// â”€â”€ Broadcast Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface BroadcastFormProps {
  onSent: () => void;
}

function BroadcastForm({ onSent }: BroadcastFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [targetAll, setTargetAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
  const [sending, setSending] = useState(false);

  // User search dropdown state
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<AdminUser[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  const searchUsers = useCallback((q: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await adminAPI.getAllUsers({ page: 1, limit: 20, search: q || undefined });
        setUserOptions(res.data ?? []);
      } catch {
        setUserOptions([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
  }, []);

  const openDropdown = () => {
    setUserDropdownOpen(true);
    if (userOptions.length === 0) searchUsers("");
  };

  const handleUserSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setUserSearch(q);
    searchUsers(q);
  };

  const toggleUser = (user: AdminUser) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const removeUser = (id: string) =>
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast({ title: "Validation", description: "Title and message are required.", variant: "destructive" });
      return;
    }
    if (!targetAll && selectedUsers.length === 0) {
      toast({ title: "Validation", description: "Select at least one user.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const payload: Parameters<typeof adminAPI.broadcastNotification>[0] = {
        title: title.trim(),
        message: message.trim(),
        type,
        targetAll,
      };

      if (!targetAll) {
        payload.targetUserIds = selectedUsers.map((u) => u.id);
        payload.targetAll = false;
      }

      const res = await adminAPI.broadcastNotification(payload);
      toast({
        title: "Broadcast sent",
        description: `Notification delivered to ${res.data?.sentCount ?? "all"} users.`,
      });
      setTitle("");
      setMessage("");
      setType("info");
      setTargetAll(true);
      setSelectedUsers([]);
      setUserSearch("");
      onSent();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to send broadcast",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-green-600" />
          Broadcast Notification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title..."
                maxLength={150}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Message */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
                <option value="system">System</option>
                <option value="transaction">Transaction</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={targetAll}
                    onChange={() => setTargetAll(true)}
                    className="accent-green-600"
                  />
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">All Users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!targetAll}
                    onChange={() => { setTargetAll(false); openDropdown(); }}
                    className="accent-green-600"
                  />
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Specific Users</span>
                </label>
              </div>
            </div>

            {/* Searchable user picker */}
            {!targetAll && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Users <span className="text-red-500">*</span>
                </label>

                {/* Selected user chips */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 text-green-800 text-xs rounded-full"
                      >
                        {u.firstName} {u.lastName}
                        <button
                          type="button"
                          onClick={() => removeUser(u.id)}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Dropdown trigger + search */}
                <div ref={dropdownRef} className="relative">
                  <div
                    onClick={openDropdown}
                    className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:border-green-400 focus-within:ring-2 focus-within:ring-green-500"
                  >
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={handleUserSearchInput}
                      onFocus={openDropdown}
                      placeholder={selectedUsers.length > 0 ? `${selectedUsers.length} selected — search to add more` : "Search by name or email..."}
                      className="flex-1 outline-none bg-transparent text-sm placeholder:text-gray-400"
                    />
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {userDropdownOpen && (
                    <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
                      ) : userOptions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">No users found</div>
                      ) : (
                        userOptions.map((user) => {
                          const isSelected = selectedUsers.some((u) => u.id === user.id);
                          return (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => toggleUser(user)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                                isSelected ? "bg-green-50" : ""
                              }`}
                            >
                              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                                {user.firstName?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                              </div>
                              {isSelected && (
                                <span className="text-green-600 text-xs font-medium shrink-0">✓</span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedUsers.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Search and click users to add them to the recipient list.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={sending}
              className="gap-2 min-w-32"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// â”€â”€ Type badge helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const typeVariant: Record<string, "success" | "info" | "warning" | "danger" | "muted"> = {
  success: "success",
  info: "info",
  warning: "warning",
  alert: "danger",
  system: "muted",
  transaction: "info",
  promotion: "warning",
};

// â”€â”€ Main section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function NotificationsSection() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"list" | "broadcast">("list");
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchUserId, setSearchUserId] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    notification: AdminNotification | null;
  }>({ open: false, notification: null });
  const [deleting, setDeleting] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof adminAPI.getAllAdminNotifications>[0] = {
        page,
        limit: 15,
        type: typeFilter === "all" ? undefined : typeFilter,
        isRead: readFilter === "all" ? undefined : readFilter === "read",
        userId: searchUserId.trim() || undefined,
      };

      const res = (await adminAPI.getAllAdminNotifications(params)) as AdminNotificationsResponse;
      setNotifications(res.data ?? []);
      setStats(res.statistics ?? res.stats ?? { total: 0, unread: 0, today: 0 });
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotalCount(res.pagination?.total ?? 0);
    } catch {
      toast({ title: "Error", description: "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, readFilter, searchUserId, toast]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  useEffect(() => { setPage(1); }, [typeFilter, readFilter, searchUserId]);

  const handleDelete = async () => {
    if (!deleteDialog.notification) return;
    setDeleting(true);
    try {
      await adminAPI.deleteAdminNotification(deleteDialog.notification.id);
      toast({ title: "Deleted", description: "Notification removed." });
      setDeleteDialog({ open: false, notification: null });
      loadNotifications();
    } catch {
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and broadcast platform notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={loadNotifications}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setTab("broadcast")}
            className="gap-2"
          >
            <Megaphone className="w-4 h-4" />
            Broadcast
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Notifications" value={stats.total} label="platform-wide" />
        <KPICard title="Unread" value={stats.unread} label="pending" />
        <KPICard title="Sent Today" value={stats.today} label="last 24 h" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["list", "broadcast"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "list" ? (
              <span className="flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                All Notifications
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" />
                Broadcast
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Broadcast tab */}
      {tab === "broadcast" && (
        <BroadcastForm onSent={() => { setTab("list"); loadNotifications(); }} />
      )}

      {/* List tab */}
      {tab === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>All Platform Notifications</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
             

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
                <option value="system">System</option>
                <option value="transaction">Transaction</option>
                <option value="promotion">Promotion</option>
              </select>

              {/* Read filter */}
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value as typeof readFilter)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <td colSpan={6} className="text-center py-12">
                      <BellOff className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-400">No notifications found</p>
                    </td>
                  </TableRow>
                ) : (
                  notifications.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <TableMainText className="max-w-xs truncate">{n.data?.title}</TableMainText>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{n.data?.message}</p>
                      </TableCell>

                      <TableCell>
                        {n.user ? (
                          <div>
                            <TableMainText>
                              {n.user.firstName} {n.user.lastName}
                            </TableMainText>
                            <p className="text-xs text-gray-400 truncate max-w-40">{n.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">{n.userId}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={typeVariant[n.type] ?? "muted"}>
                          {n.type}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {n.isRead ? (
                          <Badge variant="muted">Read</Badge>
                        ) : (
                          <Badge variant="warning">Unread</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        <p className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </TableCell>

                      <TableCell>
                        <TableActions>
                          <IconButton
                            variant="danger"
                            size="sm"
                            title="Delete notification"
                            onClick={() => setDeleteDialog({ open: true, notification: n })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </TableActions>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} Â· {totalCount.toLocaleString()} notifications
                </p>
                <div className="flex gap-2">
                  <IconButton variant="default" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </IconButton>
                  <IconButton variant="default" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, notification: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>&quot;{deleteDialog.notification?.data?.title}&quot;</strong>?
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
