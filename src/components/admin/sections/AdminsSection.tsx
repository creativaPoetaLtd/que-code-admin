"use client";

import { useState, useEffect } from "react";
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
  Filter,
  Download,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Clock,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Key,
  Plus,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { AdminUser, Role } from "@/types/admin.types";
import { useAdminModal } from "../AdminModalsContainer";
import { toast, useToast } from "@/hooks/use-toast";

export default function AdminsSection() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    superAdmins: 0,
    admins: 0,
    orgAdmins: 0,
  });

  const { openUserModal, roles, refreshTrigger } = useAdminModal();

  // Admin role names to filter
  const ADMIN_ROLES = [
    "super_admin",
    "admin",
    "organization_admin",
    "moderator",
  ];

  useEffect(() => {
    loadAdmins();
  }, [currentPage, searchTerm, statusFilter, refreshTrigger]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      });

      // Filter only admin users
      const adminUsers = response.data.filter((user: AdminUser) => {
        // Check both new (role) and old (userRoles) structures
        const roleName = user.role?.name || user.userRoles?.[0]?.role?.name;
        return roleName && ADMIN_ROLES.includes(roleName);
      });

      setAdmins(adminUsers);
      setTotalAdmins(adminUsers.length);
      setTotalPages(Math.ceil(adminUsers.length / 10));

      // Calculate stats
      const superAdmins = adminUsers.filter(
        (u) => (u.role?.name || u.userRoles?.[0]?.role?.name) === "super_admin",
      ).length;
      const regularAdmins = adminUsers.filter(
        (u) => (u.role?.name || u.userRoles?.[0]?.role?.name) === "admin",
      ).length;
      const orgAdmins = adminUsers.filter(
        (u) =>
          (u.role?.name || u.userRoles?.[0]?.role?.name) ===
          "organization_admin",
      ).length;

      setStats({
        total: adminUsers.length,
        superAdmins,
        admins: regularAdmins,
        orgAdmins,
      });
    } catch (error) {
      console.error("Error loading admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    if (!userId || !roleId) return;

    try {
      await adminAPI.assignUserRole(userId, roleId);
      loadAdmins();
      toast({
        title: "Success",
        description: "Role changed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to change role",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (
    userId: string,
    field: "isVerified" | "approvalStatus",
    value: boolean,
  ) => {
    try {
      await adminAPI.updateUserStatus(userId, { [field]: value });
      loadAdmins();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName?.toLowerCase()) {
      case "super_admin":
        return "danger";
      case "admin":
        return "warning";
      case "organization_admin":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Admins"
          value={stats.total.toString()}
          label="All administrators"
          trend={{ value: "0", direction: "up", timeframe: "total" }}
        />
        <KPICard
          title="Super Admins"
          value={stats.superAdmins.toString()}
          label="Full system access"
          trend={{ value: "0", direction: "up", timeframe: "total" }}
        />
        <KPICard
          title="Admins"
          value={stats.admins.toString()}
          label="Elevated privileges"
          trend={{ value: "0", direction: "up", timeframe: "total" }}
        />
        <KPICard
          title="Org Admins"
          value={stats.orgAdmins.toString()}
          label="Organization management"
          trend={{ value: "0", direction: "up", timeframe: "total" }}
        />
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Admin Users</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Manage system administrators and their access levels
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadAdmins}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openUserModal()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Admin
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filter */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search admins by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <TableMainText>
                          {admin.firstName} {admin.lastName}
                        </TableMainText>
                        <TableSubText>{admin.email}</TableSubText>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getRoleBadgeVariant(
                        admin.role?.name ||
                          admin.userRoles?.[0]?.role?.name ||
                          "",
                      )}
                    >
                      {(admin.role?.name || admin.userRoles?.[0]?.role?.name)
                        ?.replace("_", " ")
                        .toUpperCase() || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TableMainText>{admin.phone || "N/A"}</TableMainText>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {admin.isVerified ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <Clock className="w-3 h-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TableActions>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        title="Edit Admin"
                        onClick={() => openUserModal(admin)}
                      >
                        <Edit className="w-4 h-4" />
                      </IconButton>
                    </TableActions>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {admins.length} of {totalAdmins} admins
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
