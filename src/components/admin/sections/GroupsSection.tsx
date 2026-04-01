"use client";

import { useState, useEffect, useCallback } from "react";
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
  Search,
  Trash2,
  Wallet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  UserCheck,
  Users,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { useAdminModal } from "@/components/admin/AdminModalsContainer";

interface GroupWallet {
  id: string;
  balance: number;
  createdAt: string;
}

interface GroupOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AdminGroup {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: GroupOwner;
  isPrivate: boolean;
  privacyType: "public" | "private" | "require_approval";
  memberCount: number;
  hasFundraising: boolean;
  fundraisingTarget?: number;
  fundraisingCurrentAmount: number;
  walletId?: string;
  wallet?: GroupWallet;
  createdAt: string;
}

interface GroupsResponse {
  success: boolean;
  data: AdminGroup[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const privacyConfig: Record<
  AdminGroup["privacyType"],
  { label: string; icon: React.ElementType; variant: "success" | "danger" | "warning" }
> = {
  public: { label: "Public", icon: Globe, variant: "success" },
  private: { label: "Private", icon: Lock, variant: "danger" },
  require_approval: { label: "Approval Required", icon: UserCheck, variant: "warning" },
};


// â”€â”€ Main section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function GroupsSection() {
  const { toast } = useToast();
  const { openGroupMembersModal, openDeleteGroupDialog } = useAdminModal();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "public" | "private" | "require_approval">("all");
  const [fundraisingFilter, setFundraisingFilter] = useState<"all" | "true" | "false">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof adminAPI.getAllGroups>[0] = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        privacyType: privacyFilter,
        hasFundraising: fundraisingFilter === "all" ? undefined : fundraisingFilter,
      };

      const response = (await adminAPI.getAllGroups(params)) as GroupsResponse;
      setGroups(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalGroups(response.pagination.total);
    } catch {
      toast({ title: "Error", description: "Failed to load groups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, privacyFilter, fundraisingFilter, toast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, privacyFilter, fundraisingFilter]);

  const fundraisingGroups = groups.filter((g) => g.hasFundraising).length;
  const groupsWithWallet = groups.filter((g) => g.wallet).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all platform groups and their wallets
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={loadGroups}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Groups"
          value={totalGroups}
          label="in database"
        />
        <KPICard
          title="Fundraising Groups"
          value={fundraisingGroups}
          label="on this page"
        />
        <KPICard
          title="Groups with Wallets"
          value={groupsWithWallet}
          label="on this page"
        />
        <KPICard
          title="Public Groups"
          value={groups.filter((g) => g.privacyType === "public").length}
          label="on this page"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Groups</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Privacy filter */}
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value as typeof privacyFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Privacy Types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="require_approval">Approval Required</option>
            </select>

            {/* Fundraising filter */}
            <select
              value={fundraisingFilter}
              onChange={(e) => setFundraisingFilter(e.target.value as typeof fundraisingFilter)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Groups</option>
              <option value="true">Fundraising Only</option>
              <option value="false">Non-Fundraising</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Privacy</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Fundraising</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groups.length === 0 ? (
                <TableRow>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    No groups found
                  </td>
                </TableRow>
              ) : (
                groups.map((group) => {
                  const privacy = privacyConfig[group.privacyType];
                  const PrivacyIcon = privacy.icon;
                  return (
                    <TableRow key={group.id}>
                      <TableCell>
                        <TableMainText>{group.name}</TableMainText>
                        {group.description && (
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">
                            {group.description}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {group.owner ? (
                          <div>
                            <TableMainText>
                              {group.owner.firstName} {group.owner.lastName}
                            </TableMainText>
                            <p className="text-xs text-gray-400">{group.owner.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">â€”</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={privacy.variant} className="gap-1">
                          <PrivacyIcon className="w-3 h-3" />
                          {privacy.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <button
                          onClick={() => openGroupMembersModal(group, loadGroups)}
                          className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 hover:underline transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {group.memberCount}
                        </button>
                      </TableCell>

                      <TableCell>
                        {group.hasFundraising ? (
                          <div>
                            <Badge variant="info">Fundraising</Badge>
                            {group.fundraisingTarget && (
                              <p className="text-xs text-gray-400 mt-1">
                                ${Number(group.fundraisingCurrentAmount).toLocaleString()} /{" "}
                                ${Number(group.fundraisingTarget).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="muted">None</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {group.wallet ? (
                          <div>
                            <Badge variant="success" className="gap-1">
                              <Wallet className="w-3 h-3" />
                              Active
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">
                              ${Number(group.wallet.balance).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="muted">No Wallet</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>

                      <TableCell>
                        <TableActions>
                          <IconButton
                            variant="default"
                            size="sm"
                            title="View members"
                            onClick={() => openGroupMembersModal(group, loadGroups)}
                          >
                            <Users className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            variant="danger"
                            size="sm"
                            title="Delete group"
                            onClick={() =>
                              openDeleteGroupDialog(group, async () => {
                                try {
                                  await adminAPI.deleteGroup(group.id);
                                  toast({
                                    title: "Group deleted",
                                    description: `"${group.name}" has been removed.`,
                                  });
                                  loadGroups();
                                } catch {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete group",
                                    variant: "destructive",
                                  });
                                }
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </TableActions>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages} ({totalGroups} groups)
              </p>
              <div className="flex gap-2">
                <IconButton
                  variant="default"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </IconButton>
                <IconButton
                  variant="default"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </IconButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
