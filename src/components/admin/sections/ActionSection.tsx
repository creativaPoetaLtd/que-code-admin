"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import { adminAPI } from "@/services/adminService";
import {
  AdminAction,
  AdminActionsResponse,
  ActionType,
  ActionStatus,
} from "@/types/admin.types";
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
  TableSubText,
  TableActions,
} from "../ui/Table";
import { IconButton } from "../ui/Button";
import { useAdminModal } from "../AdminModalsContainer";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  TrendingUp,
  CheckCircle,
  Archive,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Ban,
  List,
  ShieldAlert,
} from "lucide-react";

const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  ticket: "Ticket",
  transport: "Transport",
  service: "Service",
  subscription: "Subscription",
  payment: "Payment",
  donation: "Donation",
  vote: "Vote",
  booking: "Booking",
  license: "License",
  membership: "Membership",
  rental: "Rental",
  group: "Group",
};

const ACTION_TYPE_OPTIONS: { value: ActionType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "ticket", label: "Ticket" },
  { value: "transport", label: "Transport" },
  { value: "service", label: "Service" },
  { value: "subscription", label: "Subscription" },
  { value: "payment", label: "Payment" },
  { value: "donation", label: "Donation" },
  { value: "vote", label: "Vote" },
  { value: "booking", label: "Booking" },
  { value: "license", label: "License" },
  { value: "membership", label: "Membership" },
  { value: "rental", label: "Rental" },
  { value: "group", label: "Group" },
];

export default function ActionSection() {
  const {
    openActionDetailModal,
    closeActionDetailModal,
    openSubActionsModal,
    closeSubActionsModal,
  } = useAdminModal();

  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<ActionStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ActionType | "all">("all");
  const [sortField, setSortField] = useState<
    "name" | "type" | "status" | "createdAt" | "updatedAt"
  >("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    action: AdminAction | null;
  }>({ open: false, action: null });

  const [publishDialog, setPublishDialog] = useState<{
    open: boolean;
    action: AdminAction | null;
  }>({ open: false, action: null });

  const [archiveDialog, setArchiveDialog] = useState<{
    open: boolean;
    action: AdminAction | null;
  }>({ open: false, action: null });

  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean;
    action: AdminAction | null;
    reason: string;
  }>({ open: false, action: null, reason: "" });

  const [unsuspendDialog, setUnsuspendDialog] = useState<{
    open: boolean;
    action: AdminAction | null;
  }>({ open: false, action: null });

  // API state
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statistics, setStatistics] = useState({
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
    suspended: 0,
  });

  // Sub-actions state for fetching
  const [subActions, setSubActions] = useState<any[]>([]);
  const [subActionsLoading, setSubActionsLoading] = useState(false);
  const [subActionsStats, setSubActionsStats] = useState<any>(null);

  // Fetch actions from API
  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getAllActions({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          sortBy: sortField,
          sortDirection,
        });

        if (response.success) {
          setActions(response.data);
          setStatistics({
            total: response.statistics.total || 0,
            draft: response.statistics.draft || 0,
            published: response.statistics.published || 0,
            archived: response.statistics.archived || 0,
            suspended: response.statistics.suspended || 0,
          });
          setTotalCount(response.pagination.total);
          setTotalPages(response.pagination.totalPages);
        }
      } catch (error: any) {
        console.error("Failed to fetch actions:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load actions";

        if (
          error.response?.status === 401 ||
          errorMessage.includes("token") ||
          errorMessage.includes("Access denied")
        ) {
          setError("Authentication required. Please log in again.");
        } else if (error.response?.status === 403) {
          setError("Access denied. Admin privileges required.");
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    typeFilter,
    sortField,
    sortDirection,
  ]);

  const handleStatusChange = async (
    actionId: string,
    newStatus: "draft" | "published" | "archived",
  ) => {
    try {
      await adminAPI.updateActionStatus(actionId, { status: newStatus });

      toast({
        title: "Status updated",
        description: `Action status changed to ${newStatus}.`,
        variant: "success",
      });

      // Refresh the list
      const response = await adminAPI.getAllActions({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        sortBy: sortField,
        sortDirection,
      });

      if (response.success) {
        setActions(response.data);
        setStatistics({
          total: response.statistics.total || 0,
          draft: response.statistics.draft || 0,
          published: response.statistics.published || 0,
          archived: response.statistics.archived || 0,
          suspended: response.statistics.suspended || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to update action status:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (actionId: string) => {
    try {
      await adminAPI.deleteAction(actionId);

      toast({
        title: "Action deleted",
        description: "The action has been permanently deleted.",
        variant: "success",
      });

      // Refresh the list
      const response = await adminAPI.getAllActions({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        sortBy: sortField,
        sortDirection,
      });

      if (response.success) {
        setActions(response.data);
        setStatistics({
          total: response.statistics.total || 0,
          draft: response.statistics.draft || 0,
          published: response.statistics.published || 0,
          archived: response.statistics.archived || 0,
          suspended: response.statistics.suspended || 0,
        });
        setTotalCount(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error: any) {
      console.error("Failed to delete action:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete action",
        variant: "destructive",
      });
    }
  };

  const handleSuspend = async (actionId: string, reason: string) => {
    try {
      await adminAPI.suspendAction(actionId, { reason });

      toast({
        title: "Action suspended",
        description: reason
          ? `Reason: ${reason}`
          : "Action has been suspended.",
        variant: "success",
      });

      // Refresh the list
      const response = await adminAPI.getAllActions({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        sortBy: sortField,
        sortDirection,
      });

      if (response.success) {
        setActions(response.data);
        setStatistics({
          total: response.statistics.total || 0,
          draft: response.statistics.draft || 0,
          published: response.statistics.published || 0,
          archived: response.statistics.archived || 0,
          suspended: response.statistics.suspended || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to suspend action:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to suspend action",
        variant: "destructive",
      });
    }
  };

  const handleUnsuspend = async (actionId: string) => {
    try {
      await adminAPI.unsuspendAction(actionId, { newStatus: "draft" });

      toast({
        title: "Action unsuspended",
        description: "The action has been unsuspended and set to draft status.",
        variant: "success",
      });

      // Refresh the list
      const response = await adminAPI.getAllActions({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        sortBy: sortField,
        sortDirection,
      });

      if (response.success) {
        setActions(response.data);
        setStatistics({
          total: response.statistics.total || 0,
          draft: response.statistics.draft || 0,
          published: response.statistics.published || 0,
          archived: response.statistics.archived || 0,
          suspended: response.statistics.suspended || 0,
        });
      }
    } catch (error: any) {
      console.error("Failed to unsuspend action:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to unsuspend action",
        variant: "destructive",
      });
    }
  };

  const handleViewSubActions = async (actionId: string, actionName: string) => {
    try {
      setSubActionsLoading(true);
      const response = await adminAPI.getActionSubActions(actionId);
      if (response.success) {
        const actionData = { ...response.action, name: actionName } as any;
        openSubActionsModal(
          actionData,
          response.data,
          response.statistics,
          false,
        );
      }
    } catch (error: any) {
      console.error("Failed to fetch sub-actions:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "Failed to load sub-actions",
        variant: "destructive",
      });
    } finally {
      setSubActionsLoading(false);
    }
  };

  const getStatusBadgeVariant = (
    status: ActionStatus,
  ): "success" | "warning" | "default" | "danger" => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "suspended":
        return "danger";
      case "archived":
        return "default";
      default:
        return "default";
    }
  };

  const getTypeBadgeColor = (type: ActionType): string => {
    const colors: Record<ActionType, string> = {
      ticket: "bg-blue-100 text-blue-800",
      transport: "bg-green-100 text-green-800",
      service: "bg-purple-100 text-purple-800",
      subscription: "bg-orange-100 text-orange-800",
      payment: "bg-teal-100 text-teal-800",
      donation: "bg-pink-100 text-pink-800",
      vote: "bg-indigo-100 text-indigo-800",
      booking: "bg-yellow-100 text-yellow-800",
      license: "bg-red-100 text-red-800",
      membership: "bg-cyan-100 text-cyan-800",
      rental: "bg-lime-100 text-lime-800",
      group: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number, currency: string = "RWF") => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Statistics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Actions"
          value={statistics.total.toLocaleString()}
          label="All actions in system"
          trend={undefined}
        />
        <KPICard
          title="Published"
          value={statistics.published.toLocaleString()}
          label="Live actions"
          trend={undefined}
        />
        <KPICard
          title="Drafts"
          value={statistics.draft.toLocaleString()}
          label="In development"
          trend={undefined}
        />
        <KPICard
          title="Archived"
          value={statistics.archived.toLocaleString()}
          label="Inactive actions"
          trend={undefined}
        />
        <KPICard
          title="Suspended"
          value={statistics.suspended.toLocaleString()}
          label="Flagged by admin"
          trend={undefined}
        />
      </div>

      {/* Main Actions Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Actions Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage QC Pro actions across all organizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters and Search */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search actions by name or slug..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ActionStatus | "all");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as ActionType | "all");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
              >
                {ACTION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split("-");
                  setSortField(
                    field as
                      | "name"
                      | "type"
                      | "status"
                      | "createdAt"
                      | "updatedAt",
                  );
                  setSortDirection(direction as "asc" | "desc");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updatedAt-desc">Latest Updated</option>
                <option value="updatedAt-asc">Oldest Updated</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing{" "}
                {actions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
                to {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} actions
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">{error}</div>
              <Button
                variant="default"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && actions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-1">No actions found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No actions have been created yet"}
              </p>
            </div>
          )}

          {/* Actions Table */}
          {!loading && !error && actions.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {action.coverImage && (
                            <img
                              src={action.coverImage}
                              alt={action.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <TableMainText>{action.name}</TableMainText>
                            <TableSubText>/{action.slug}</TableSubText>
                            {action.shortDescription && (
                              <TableSubText className="max-w-xs truncate">
                                {action.shortDescription}
                              </TableSubText>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {action.organization ? (
                          <div>
                            <TableMainText>
                              {action.organization.name}
                            </TableMainText>
                            <TableSubText>
                              {action.organization.email}
                            </TableSubText>
                          </div>
                        ) : (
                          <TableSubText>N/A</TableSubText>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(action.type)}`}
                        >
                          {ACTION_TYPE_LABELS[action.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(action.status)}>
                          {action.status.charAt(0).toUpperCase() +
                            action.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <TableMainText>
                            {action.pricing.mode === "free"
                              ? "Free"
                              : action.pricing.mode === "fixed"
                                ? `${formatCurrency(action.pricing.amount || 0)} ${action.currency}`
                                : action.pricing.mode === "range"
                                  ? `${formatCurrency(action.pricing.min || 0)} - ${formatCurrency(action.pricing.max || 0)} ${action.currency}`
                                  : "Tiered"}
                          </TableMainText>
                          <TableSubText className="capitalize">
                            {action.pricing.mode}
                          </TableSubText>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TableSubText>
                          {formatDate(action.createdAt)}
                        </TableSubText>
                      </TableCell>
                      <TableCell>
                        <TableActions>
                          <div className="relative">
                            <IconButton
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === action.id ? null : action.id,
                                )
                              }
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </IconButton>

                            {openMenuId === action.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={async () => {
                                    try {
                                      const detailResponse =
                                        await adminAPI.getActionById(action.id);
                                      if (detailResponse.success) {
                                        openActionDetailModal(
                                          detailResponse.data,
                                        );
                                      }
                                    } catch (error: any) {
                                      console.error(
                                        "Failed to fetch action details:",
                                        error,
                                      );
                                      toast({
                                        title: "Error",
                                        description:
                                          error.response?.data?.message ||
                                          error.message ||
                                          "Failed to load action details",
                                        variant: "destructive",
                                      });
                                    }
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>

                                <button
                                  onClick={() => {
                                    handleViewSubActions(
                                      action.id,
                                      action.name,
                                    );
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <List className="w-4 h-4" />
                                  View Sub-Actions
                                </button>

                                <hr className="my-1" />

                                {action.status !== "suspended" && (
                                  <button
                                    onClick={() => {
                                      setSuspendDialog({
                                        open: true,
                                        action,
                                        reason: "",
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                                  >
                                    <Ban className="w-4 h-4" />
                                    Suspend (Unlawful)
                                  </button>
                                )}

                                {action.status === "suspended" && (
                                  <button
                                    onClick={() => {
                                      setUnsuspendDialog({
                                        open: true,
                                        action,
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Unsuspend
                                  </button>
                                )}

                                {action.status === "draft" && (
                                  <button
                                    onClick={() => {
                                      setPublishDialog({
                                        open: true,
                                        action,
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Publish
                                  </button>
                                )}

                                {action.status === "published" && (
                                  <button
                                    onClick={() => {
                                      setArchiveDialog({
                                        open: true,
                                        action,
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archive
                                  </button>
                                )}

                                {action.status === "archived" && (
                                  <button
                                    onClick={() => {
                                      setPublishDialog({
                                        open: true,
                                        action,
                                      });
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Publish
                                  </button>
                                )}

                                <hr className="my-1" />

                                <button
                                  onClick={() => {
                                    setDeleteDialog({
                                      open: true,
                                      action,
                                    });
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </TableActions>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, action: deleteDialog.action })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteDialog.action?.name}</strong>? This action cannot
              be undone if there are no purchases associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteDialog.action) {
                  await handleDelete(deleteDialog.action.id);
                  setDeleteDialog({ open: false, action: null });
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirmation Dialog */}
      <AlertDialog
        open={publishDialog.open}
        onOpenChange={(open) =>
          setPublishDialog({ open, action: publishDialog.action })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish{" "}
              <strong>{publishDialog.action?.name}</strong>? This will make it
              visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (publishDialog.action) {
                  await handleStatusChange(
                    publishDialog.action.id,
                    "published",
                  );
                  setPublishDialog({ open: false, action: null });
                }
              }}
            >
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={archiveDialog.open}
        onOpenChange={(open) =>
          setArchiveDialog({ open, action: archiveDialog.action })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{" "}
              <strong>{archiveDialog.action?.name}</strong>? This will hide it
              from users but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (archiveDialog.action) {
                  await handleStatusChange(archiveDialog.action.id, "archived");
                  setArchiveDialog({ open: false, action: null });
                }
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog with Form */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendDialog({ open: false, action: null, reason: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Action</DialogTitle>
            <DialogDescription>
              You are about to suspend{" "}
              <strong>{suspendDialog.action?.name}</strong>. Please provide a
              reason for suspension (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label
              htmlFor="suspend-reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reason for suspension
            </label>
            <textarea
              id="suspend-reason"
              value={suspendDialog.reason}
              onChange={(e) =>
                setSuspendDialog({ ...suspendDialog, reason: e.target.value })
              }
              placeholder="e.g., Violates community guidelines, illegal content, spam, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setSuspendDialog({ open: false, action: null, reason: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (suspendDialog.action) {
                  await handleSuspend(
                    suspendDialog.action.id,
                    suspendDialog.reason,
                  );
                  setSuspendDialog({ open: false, action: null, reason: "" });
                }
              }}
            >
              Suspend Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Confirmation Dialog */}
      <AlertDialog
        open={unsuspendDialog.open}
        onOpenChange={(open) =>
          setUnsuspendDialog({ open, action: unsuspendDialog.action })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend{" "}
              <strong>{unsuspendDialog.action?.name}</strong>? It will be set to
              draft status and can be published again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (unsuspendDialog.action) {
                  await handleUnsuspend(unsuspendDialog.action.id);
                  setUnsuspendDialog({ open: false, action: null });
                }
              }}
            >
              Unsuspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
