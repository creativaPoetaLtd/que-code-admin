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
  Key,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { Permission } from "@/types/admin.types";
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

export default function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deletePermissionId, setDeletePermissionId] = useState<string | null>(
    null,
  );
  const { openPermissionModal, refreshTrigger } = useAdminModal();
  const { toast } = useToast();

  useEffect(() => {
    loadPermissions();
  }, [refreshTrigger]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!deletePermissionId) return;

    try {
      await adminAPI.deletePermission(deletePermissionId);
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
      setDeletePermissionId(null);
      loadPermissions();
    } catch (error: any) {
      console.error("Error deleting permission:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete permission",
        variant: "destructive",
      });
    }
  };

  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPermissions = filteredPermissions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Permissions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {permissions.length}
                </p>
              </div>
              <Key className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Filtered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredPermissions.length}
                </p>
              </div>
              <Filter className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permissions Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadPermissions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openPermissionModal()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Permission
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
                placeholder="Search permissions..."
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
                    <TableHead>Permission Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <TableMainText>
                          <div className="flex items-center gap-2">
                            {permission.name}
                          </div>
                        </TableMainText>
                      </TableCell>
                      <TableCell>
                        <TableSubText>
                          {permission.description || "No description"}
                        </TableSubText>
                      </TableCell>
                      <TableCell>
                        <TableSubText>
                          {permission.createdAt
                            ? new Date(
                                permission.createdAt,
                              ).toLocaleDateString()
                            : "N/A"}
                        </TableSubText>
                      </TableCell>
                      <TableCell>
                        <TableActions>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => openPermissionModal(permission)}
                            title="Edit Permission"
                          >
                            <Edit className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletePermissionId(permission.id)}
                            title="Delete Permission"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </IconButton>
                        </TableActions>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {filteredPermissions.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1}-
                    {Math.min(endIndex, filteredPermissions.length)} of{" "}
                    {filteredPermissions.length} permissions
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
        open={!!deletePermissionId}
        onOpenChange={(open) => !open && setDeletePermissionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this permission? This action
              cannot be undone and may affect roles that use this permission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePermissionId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePermission}
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
