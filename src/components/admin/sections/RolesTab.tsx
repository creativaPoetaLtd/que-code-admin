"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
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
  Shield,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { Role, Permission } from "@/types/admin.types";
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

export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const { openRoleModal, permissions, setPermissions, refreshTrigger } =
    useAdminModal();
  const { toast } = useToast();

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, [refreshTrigger]);

  const loadPermissions = async () => {
    try {
      const response = await adminAPI.getAllPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRoles();
      setRoles(response.data);
    } catch (error) {
      console.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;

    try {
      await adminAPI.deleteRole(deleteRoleId);
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
      setDeleteRoleId(null);
      loadRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">System Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    roles.filter((r) =>
                      ["super_admin", "admin", "user"].includes(r.name),
                    ).length
                  }
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Custom Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    roles.filter(
                      (r) => !["super_admin", "admin", "user"].includes(r.name),
                    ).length
                  }
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadRoles}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => openRoleModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.length === 0 ? (
                    <TableRow>
                      <TableCell>
                        <div className="text-center py-8 text-gray-500 w-full">
                          No roles found
                        </div>
                      </TableCell>
                      <TableCell> </TableCell>
                      <TableCell> </TableCell>
                      <TableCell> </TableCell>
                      <TableCell> </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <TableMainText>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-gray-400" />
                              {role.name}
                            </div>
                          </TableMainText>
                        </TableCell>
                        <TableCell>
                          <TableSubText>
                            {role.description || "No description"}
                          </TableSubText>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ["super_admin", "admin", "user"].includes(
                                role.name,
                              )
                                ? "success"
                                : "default"
                            }
                          >
                            {["super_admin", "admin", "user"].includes(
                              role.name,
                            )
                              ? "System"
                              : "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TableSubText>
                            {role.createdAt
                              ? new Date(role.createdAt).toLocaleDateString()
                              : "N/A"}
                          </TableSubText>
                        </TableCell>
                        <TableCell>
                          <TableActions>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleModal(role)}
                              title="Edit Role"
                            >
                              <Edit className="w-4 h-4" />
                            </IconButton>
                            {!["super_admin", "admin", "user"].includes(
                              role.name,
                            ) && (
                              <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteRoleId(role.id)}
                                title="Delete Role"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </IconButton>
                            )}
                          </TableActions>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredRoles.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredRoles.length)} of{" "}
                    {filteredRoles.length} roles
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteRoleId}
        onOpenChange={(open) => !open && setDeleteRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be
              undone and may affect users who have this role assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRoleId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
