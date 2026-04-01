"use client";

import { useState, useEffect, useCallback } from "react";
import Badge from "../ui/Badge";
import { IconButton } from "../ui/Button";
import {
  Users,
  X,
  UserMinus,
  Crown,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import type { AdminGroupMember, GroupMembersResponse } from "@/types/admin.types";

interface GroupForPanel {
  id: string;
  name: string;
  memberCount: number;
}

interface GroupMembersPanelProps {
  group: GroupForPanel;
  onClose: () => void;
  onMemberRemoved: () => void;
}

const roleConfig: Record<
  string,
  { label: string; icon: React.ElementType; variant: "warning" | "info" | "muted" }
> = {
  owner: { label: "Owner", icon: Crown, variant: "warning" },
  admin: { label: "Admin", icon: ShieldCheck, variant: "info" },
  member: { label: "Member", icon: User, variant: "muted" },
};

export default function GroupMembersPanel({ group, onClose, onMemberRemoved }: GroupMembersPanelProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("all");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTargetUserId, setRemoveTargetUserId] = useState<string | null>(null);
  const [removeTargetName, setRemoveTargetName] = useState<string>("");

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await adminAPI.getGroupMembers(group.id, {
        page,
        limit: 10,
        role: roleFilter === "all" ? undefined : roleFilter,
        status: "active",
      })) as GroupMembersResponse;
      setMembers(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch {
      toast({ title: "Error", description: "Failed to load members", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [group.id, page, roleFilter, toast]);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { setPage(1); }, [roleFilter]);

  const handleRemove = async () => {
    if (!removeTargetUserId) return;
    setRemovingId(removeTargetUserId);
    try {
      await adminAPI.removeGroupMember(group.id, removeTargetUserId);
      toast({ title: "Member removed", description: "Member has been removed from the group." });
      setRemoveTargetUserId(null);
      setRemoveTargetName("");
      onMemberRemoved();
      loadMembers();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: message || "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      {/* Backdrop — renders above header (z-100) */}
      <div className="fixed inset-0 bg-black/40 z-1000" onClick={onClose} />

      {/* Sliding panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-1001 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Members</h2>
            <p className="text-sm text-gray-500">
              {group.name} &middot; {group.memberCount} total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role filter */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2">
          {["all", "owner", "admin", "member"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                roleFilter === r
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-gray-200 text-gray-600 hover:border-green-300"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-2">
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                </div>
              </div>
            ))
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No members found</p>
            </div>
          ) : (
            members.map((m) => {
              const rc = roleConfig[m.role] ?? roleConfig.member;
              const RoleIcon = rc.icon;
              const isOwner = m.role === "owner";
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 group"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold shrink-0">
                    {m.user?.firstName?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{m.user?.email}</p>
                  </div>

                  {/* Role badge */}
                  <Badge variant={rc.variant} className="gap-1 shrink-0">
                    <RoleIcon className="w-3 h-3" />
                    {rc.label}
                  </Badge>

                  {/* Remove button */}
                  {!isOwner && (
                    <IconButton
                      variant="danger"
                      size="sm"
                      title="Remove member"
                      disabled={removingId === m.userId}
                      onClick={() => {
                        setRemoveTargetUserId(m.userId);
                        setRemoveTargetName(
                          m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId
                        );
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </IconButton>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination — hidden when confirm banner is showing */}
        {totalPages > 1 && !removeTargetUserId && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <IconButton
                variant="default"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
              <IconButton
                variant="default"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        )}

        {/* Inline remove confirmation banner */}
        {removeTargetUserId && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-100">
            <p className="text-sm font-medium text-red-800 mb-3">
              Remove <strong>{removeTargetName}</strong> from{" "}
              <strong>{group.name}</strong>?
              <span className="block text-xs font-normal text-red-600 mt-0.5">
                This action cannot be undone.
              </span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRemoveTargetUserId(null);
                  setRemoveTargetName("");
                }}
                disabled={!!removingId}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={!!removingId}
                className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removingId ? "Removing…" : "Yes, Remove"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
