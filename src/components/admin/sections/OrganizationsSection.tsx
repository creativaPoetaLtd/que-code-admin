"use client";

import { useState, useMemo, useEffect } from "react";
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
  TableSubText,
  TableActions,
} from "../ui/Table";
import { IconButton } from "../ui/Button";
import {
  Search,
  Download,
  Building,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Ban,
  Trash2,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
  Tag,
} from "lucide-react";
import organizationAPI from "@/services/organizationService";
import { useAdminModal } from "../AdminModalsContainer";
import { useToast } from "@/hooks/use-toast";
import CategoriesTab from "./CategoriesTab";
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

interface Organization {
  id: string;
  name: string;
  email: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  contactPhone: string;
  tinNumber: string;
  password?: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
  status: "active" | "inactive" | "suspended" | "pending";
  createdAt: string;
  updatedAt: string;
}

export default function OrganizationsSection() {
  const { openOrganizationModal, refreshTrigger } = useAdminModal();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"organizations" | "categories">(
    "organizations",
  );
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Organization>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewDetailsOrg, setViewDetailsOrg] = useState<Organization | null>(
    null,
  );
  const [actionOrgId, setActionOrgId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<
    "activate" | "deactivate" | "suspend" | null
  >(null);

  useEffect(() => {
    fetchOrganizations();
    fetchCategories();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, refreshTrigger]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getAllOrganizations({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        status: statusFilter,
        categoryId: categoryFilter,
      });
      // Map the response data to ensure proper structure
      const orgsData = response.data || response || [];
      setOrganizations(Array.isArray(orgsData) ? orgsData : []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await organizationAPI.getAllCategories();
      // API returns array directly, not wrapped in data property
      setCategories(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Organization action handlers
  const handleOrganizationAction = async () => {
    if (!actionOrgId || !actionType) return;

    try {
      if (actionType === "activate") {
        await organizationAPI.activateOrganization(actionOrgId);
        toast({
          title: "Success",
          description: "Organization activated successfully",
        });
      } else if (actionType === "deactivate") {
        await organizationAPI.deactivateOrganization(actionOrgId);
        toast({
          title: "Success",
          description: "Organization deactivated successfully",
        });
      } else if (actionType === "suspend") {
        await organizationAPI.suspendOrganization(actionOrgId);
        toast({
          title: "Success",
          description: "Organization suspended successfully",
        });
      }
      setActionOrgId(null);
      setActionType(null);
      fetchOrganizations();
    } catch (error: any) {
      console.error(`Error ${actionType}ing organization:`, error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          `Failed to ${actionType} organization`,
        variant: "destructive",
      });
    }
  };

  // Filter and search organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations.filter((org: Organization) => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.tinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || org.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || org.category?.name === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort organizations
    filtered.sort((a: Organization, b: Organization) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [
    organizations,
    searchTerm,
    statusFilter,
    categoryFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Statistics calculations
  const stats = useMemo(() => {
    const totalOrganizations = organizations.length;
    const activeOrganizations = organizations.filter(
      (org: Organization) => org.status === "active",
    ).length;
    const pendingOrganizations = organizations.filter(
      (org: Organization) => org.status === "pending",
    ).length;
    const suspendedOrganizations = organizations.filter(
      (org: Organization) => org.status === "suspended",
    ).length;
    const inactiveOrganizations = organizations.filter(
      (org: Organization) => org.status === "inactive",
    ).length;

    return {
      totalOrganizations,
      activeOrganizations,
      pendingOrganizations,
      suspendedOrganizations,
      inactiveOrganizations,
    };
  }, [organizations]);

  const categoryStats = useMemo(() => {
    return {
      totalCategories: categories.length,
    };
  }, [categories]);

  const getBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "suspended":
        return "danger";
      case "inactive":
        return "default";
      default:
        return "default";
    }
  };

  const handleSort = (field: keyof Organization) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("organizations");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "organizations"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Organizations ({stats.totalOrganizations})
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("categories");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "categories"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categories ({categoryStats.totalCategories})
            </div>
          </button>
        </nav>
      </div>

      {activeTab === "organizations" ? (
        <>
          {/* Organizations Tab Content */}
          <div className="flex justify-end gap-3">
            <Button
              variant="default"
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => openOrganizationModal()}
            >
              Add Organization
            </Button>
          </div>

          {/* Organizations Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              title="Total Organizations"
              value={stats.totalOrganizations.toLocaleString()}
              label="Registered entities"
              trend={{
                direction: "up",
                value: "+8%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Active Organizations"
              value={stats.activeOrganizations.toLocaleString()}
              label="Currently operational"
              trend={{
                direction: "up",
                value: "+12%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Pending"
              value={stats.pendingOrganizations.toLocaleString()}
              label="Awaiting review"
              trend={{
                direction: "down",
                value: "-3%",
                timeframe: "last week",
              }}
            />

            <KPICard
              title="Inactive"
              value={stats.inactiveOrganizations.toLocaleString()}
              label="Deactivated"
              trend={{
                direction: "down",
                value: "-1%",
                timeframe: "last week",
              }}
            />

            <KPICard
              title="Suspended"
              value={stats.suspendedOrganizations.toLocaleString()}
              label="Suspended"
              trend={{
                direction: "down",
                value: "-1%",
                timeframe: "last week",
              }}
            />
          </div>

          {/* Organizations Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search organizations
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name, email, TIN, or owner..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Approval Filter - Remove this entire filter */}

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Religious Organization">
                      Religious Organization
                    </option>
                    <option value="Transportation">Transportation</option>
                    <option value="Technology">Technology</option>
                    <option value="Trading">Trading</option>
                    <option value="Energy">Energy</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="w-full"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div
                          className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                          onClick={() => handleSort("name")}
                        >
                          Organization
                          {sortField === "name" && (
                            <span className="text-xs">
                              {sortDirection === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>TIN Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrganizations.map((org: Organization) => (
                      <TableRow key={org.id} className="group hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div>
                              <TableMainText className="font-medium">
                                {org.name}
                              </TableMainText>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">
                              {org.ownerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {org.ownerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{org.email}</div>
                            <div className="text-xs text-gray-500">
                              {org.contactPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">
                            {org.tinNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info" size="sm">
                            {org.category?.name || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getBadgeVariant(org.status) as any}
                            size="sm"
                          >
                            {org.status.charAt(0).toUpperCase() +
                              org.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TableActions>
                            <div className="relative">
                              <IconButton
                                variant="ghost"
                                size="sm"
                                title="Actions"
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === org.id ? null : org.id,
                                  )
                                }
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </IconButton>

                              {openMenuId === org.id && (
                                <>
                                  {/* Backdrop */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />

                                  {/* Dropdown Menu */}
                                  <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                      onClick={() => {
                                        setViewDetailsOrg(org);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <Eye className="w-4 h-4 text-gray-500" />
                                      View Details
                                    </button>

                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                      onClick={() => {
                                        openOrganizationModal(org);
                                        setOpenMenuId(null);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 text-gray-500" />
                                      Edit Organization
                                    </button>

                                    {/* Show Deactivate only for Active */}
                                    {org.status === "active" && (
                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-600"
                                        onClick={() => {
                                          setActionOrgId(org.id);
                                          setActionType("deactivate");
                                          setOpenMenuId(null);
                                        }}
                                      >
                                        <Ban className="w-4 h-4" />
                                        Deactivate
                                      </button>
                                    )}

                                    {/* Show Activate for Inactive, pending and Suspended */}
                                    {(org.status === "inactive" ||
                                      org.status === "pending" ||
                                      org.status === "suspended") && (
                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600"
                                        onClick={() => {
                                          setActionOrgId(org.id);
                                          setActionType("activate");
                                          setOpenMenuId(null);
                                        }}
                                      >
                                        <UserCheck className="w-4 h-4" />
                                        Activate
                                      </button>
                                    )}

                                    {/* Show Suspend for Active, Inactive and Pending */}
                                    {(org.status === "active" ||
                                      org.status === "inactive" ||
                                      org.status === "pending") && (
                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600"
                                        onClick={() => {
                                          setActionOrgId(org.id);
                                          setActionType("suspend");
                                          setOpenMenuId(null);
                                        }}
                                      >
                                        <Ban className="w-4 h-4" />
                                        Suspend
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableActions>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <CategoriesTab />
      )}

      {/* Organizations Pagination */}
      {activeTab === "organizations" && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {Math.min(startIndex + 1, filteredOrganizations.length)}-
            {Math.min(startIndex + itemsPerPage, filteredOrganizations.length)}{" "}
            of {filteredOrganizations.length} results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1,
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        currentPage === page
                          ? "bg-green-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Organization Action Confirmation Dialog */}
      <AlertDialog
        open={!!actionOrgId && !!actionType}
        onOpenChange={(open) =>
          !open && (setActionOrgId(null), setActionType(null))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "activate" && "Activate Organization"}
              {actionType === "deactivate" && "Deactivate Organization"}
              {actionType === "suspend" && "Suspend Organization"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "activate" &&
                "Are you sure you want to activate this organization? This will restore their access to the system."}
              {actionType === "deactivate" &&
                "Are you sure you want to deactivate this organization? This will revoke their access to the system."}
              {actionType === "suspend" &&
                "Are you sure you want to suspend this organization? This will temporarily block their access to the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setActionOrgId(null);
                setActionType(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOrganizationAction}
              className={
                actionType === "activate"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : actionType === "suspend"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
              }
            >
              {actionType === "activate" && "Activate"}
              {actionType === "deactivate" && "Deactivate"}
              {actionType === "suspend" && "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Organization Details Modal */}
      {viewDetailsOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setViewDetailsOrg(null)}
          />

          {/* Modal */}
          <div className="relative z-50 w-full max-w-3xl mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Organization Details
                </h2>
                <button
                  onClick={() => setViewDetailsOrg(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-130px)]">
              {/* Organization Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Organization Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Organization Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewDetailsOrg.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewDetailsOrg.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      TIN Number
                    </label>
                    <p className="text-sm text-gray-900 mt-1 font-mono">
                      {viewDetailsOrg.tinNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Contact Phone
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewDetailsOrg.contactPhone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Category
                    </label>
                    <div className="mt-1">
                      <Badge variant="info" size="sm">
                        {viewDetailsOrg.category?.name || "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={getBadgeVariant(viewDetailsOrg.status) as any}
                        size="sm"
                      >
                        {viewDetailsOrg.status.charAt(0).toUpperCase() +
                          viewDetailsOrg.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Organization ID
                    </label>
                    <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                      {viewDetailsOrg.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Owner Name
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewDetailsOrg.ownerName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Owner Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewDetailsOrg.ownerEmail}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Owner Phone
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewDetailsOrg.ownerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Registration Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(viewDetailsOrg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(viewDetailsOrg.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Details */}
              {viewDetailsOrg.category?.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    Category Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {viewDetailsOrg.category.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              {/* Activate/Deactivate button */}
              {viewDetailsOrg.status === "inactive" ||
              viewDetailsOrg.status === "suspended" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActionOrgId(viewDetailsOrg.id);
                    setActionType("activate");
                    setViewDetailsOrg(null);
                  }}
                  icon={<UserCheck className="w-4 h-4" />}
                >
                  Activate Organization
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setActionOrgId(viewDetailsOrg.id);
                    setActionType("deactivate");
                    setViewDetailsOrg(null);
                  }}
                  icon={<Ban className="w-4 h-4" />}
                >
                  Deactivate Organization
                </Button>
              )}

              {/* Suspend button - only for Active/Inactive */}
              {viewDetailsOrg.status !== "suspended" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActionOrgId(viewDetailsOrg.id);
                    setActionType("suspend");
                    setViewDetailsOrg(null);
                  }}
                  icon={<Ban className="w-4 h-4" />}
                >
                  Suspend
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  openOrganizationModal(viewDetailsOrg);
                  setViewDetailsOrg(null);
                }}
                icon={<Edit className="w-4 h-4" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewDetailsOrg(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
