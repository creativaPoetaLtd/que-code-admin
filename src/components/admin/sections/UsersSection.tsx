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
  TableActions,
} from "../ui/Table";
import { IconButton } from "../ui/Button";
import {
  Search,
  Download,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Users as UsersIcon,
  RefreshCw,
  Shield,
  ChevronLeft,
  ChevronRight,
  Key,
  UserPlus,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { AdminUser, Role } from "@/types/admin.types";
import { useToast } from "@/hooks/use-toast";
import { useAdminModal } from "../AdminModalsContainer";
import RolesTab from "./RolesTab";
import PermissionsTab from "./PermissionsTab";

export default function UsersSection() {
  const { toast } = useToast();
  const { openUserModal, refreshTrigger } = useAdminModal();
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "permissions">(
    "users",
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    suspended: 0,
  });

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);

  const ADMIN_ROLES = [
    "super_admin",
    "admin",
    "organization_admin",
    "moderator",
  ];

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [currentPage, searchTerm, statusFilter, refreshTrigger]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      });

      // Filter out admin users - show only regular users
      const regularUsers = response.data.filter((user) => {
        // Check both new (role) and old (userRoles) structures
        const userRole = user.role?.name || user.userRoles?.[0]?.role?.name;
        return !userRole || !ADMIN_ROLES.includes(userRole);
      });

      setUsers(regularUsers);

      // Use API pagination metadata instead of recalculating based on filtered results
      setTotalUsers(
        response.pagination.totalItems || response.pagination.total || 0,
      );
      setTotalPages(response.pagination.totalPages);

      // Calculate stats for regular users on current page
      const verified = regularUsers.filter((u) => u.isVerified).length;
      const pending = regularUsers.filter((u) => !u.approvalStatus).length;
      const suspended = regularUsers.filter(
        (u) => !u.isVerified && u.approvalStatus,
      ).length;

      // Note: These stats are for the current page's filtered users only
      // For accurate total stats, backend should provide filtered statistics
      setStats({
        total: regularUsers.length,
        verified,
        pending,
        suspended,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await adminAPI.getAllRoles();
      // Filter to show only non-admin roles for regular users
      const nonAdminRoles = response.data.filter(
        (role) => !ADMIN_ROLES.includes(role.name),
      );
      setRoles(nonAdminRoles);
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to approve this user?")) return;

    try {
      await adminAPI.updateUserStatus(userId, {
        approvalStatus: true,
        isVerified: true,
      });
      loadUsers();
      toast({
        title: "Success",
        description: "User approved successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm("Are you sure you want to suspend this user?")) return;

    try {
      await adminAPI.updateUserStatus(userId, {
        approvalStatus: false,
      });
      loadUsers();
      toast({
        title: "Success",
        description: "User suspended successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    // Check both role structures for current role ID
    const currentRoleId = user.role?.id || user.userRoles?.[0]?.roleId || "";
    setSelectedRole(currentRoleId);
    setShowRoleModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await adminAPI.assignUserRole(selectedUser.id, selectedRole);
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole("");
      loadUsers();
      toast({
        title: "Success",
        description: "Role assigned successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      });
    }
  };

  const getUserBadgeVariant = (user: AdminUser) => {
    if (!user.isVerified) return "danger";
    if (!user.approvalStatus) return "warning";
    return "success";
  };

  const getUserStatusText = (user: AdminUser) => {
    if (!user.isVerified) return "Unverified";
    if (!user.approvalStatus) return "Pending";
    return "Active";
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Users ({stats.total})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "roles"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Roles
            </div>
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "permissions"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Permissions
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "users" ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Users"
              value={stats.total.toString()}
              label="All registered users"
              trend={{
                direction: "up",
                value: "+12%",
                timeframe: "last month",
              }}
            />
            <KPICard
              title="Verified Users"
              value={stats.verified.toString()}
              label="Email verified"
              trend={{
                direction: "up",
                value: "+8%",
                timeframe: "last month",
              }}
            />
            <KPICard
              title="Pending Approval"
              value={stats.pending.toString()}
              label="Awaiting admin approval"
              trend={{
                direction: "down",
                value: "-3%",
                timeframe: "last week",
              }}
            />
            <KPICard
              title="Suspended"
              value={stats.suspended.toString()}
              label="Inactive accounts"
              trend={{
                direction: "down",
                value: "-5%",
                timeframe: "last month",
              }}
            />
          </div>

          {/* Main Users Table Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-64">
                <div>
                  <CardTitle>Regular Users</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage regular user accounts, verification, and roles
                    (admins excluded)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadUsers}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openUserModal(null)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium mb-2">
                    No regular users found on this page
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentPage > 1
                      ? "This page may only contain admin users (filtered out). Try going back to previous pages."
                      : "Try adjusting your filters or search criteria."}
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead> Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <TableMainText>
                                {user.firstName} {user.lastName}
                              </TableMainText>
                            </div>
                          </TableCell>
                          <TableCell>
                            <TableMainText>{user.email}</TableMainText>
                            {/* <TableSubText>{user.phone}</TableSubText> */}
                          </TableCell>
                          <TableCell>
                            <TableMainText>{user.phone}</TableMainText>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="default"
                              className="font-mono text-xs"
                            >
                              {user.role?.name ||
                                user.userRoles?.[0]?.role?.name ||
                                "No Role"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={getUserBadgeVariant(user)}>
                                {getUserStatusText(user)}
                              </Badge>
                              {user.isOnline && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Online
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <TableMainText>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableMainText>
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
                                title="Edit User"
                                onClick={() => openUserModal(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </IconButton>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                title="Assign Role"
                                onClick={() => handleOpenRoleModal(user)}
                              >
                                <Shield className="w-4 h-4" />
                              </IconButton>
                              {!user.approvalStatus && (
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  title="Approve User"
                                  onClick={() => handleApproveUser(user.id)}
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </IconButton>
                              )}
                              {user.approvalStatus && (
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  title="Suspend User"
                                  onClick={() => handleSuspendUser(user.id)}
                                >
                                  <Ban className="w-4 h-4 text-red-600" />
                                </IconButton>
                              )}
                            </TableActions>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {users.length} regular user(s) on page{" "}
                      {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="px-4 py-2 text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Role Assignment Modal */}
          {showRoleModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-semibold mb-4">
                  Assign Role to {selectedUser.firstName}{" "}
                  {selectedUser.lastName}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAssignRole}
                    disabled={!selectedRole}
                    className="flex-1"
                  >
                    Assign Role
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowRoleModal(false);
                      setSelectedUser(null);
                      setSelectedRole("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : activeTab === "roles" ? (
        <RolesTab />
      ) : (
        <PermissionsTab />
      )}
    </div>
  );
}
