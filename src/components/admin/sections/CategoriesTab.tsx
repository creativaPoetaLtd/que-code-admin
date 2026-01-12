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
  TableActions,
} from "../ui/Table";
import { IconButton } from "../ui/Button";
import {
  Search,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Ban,
  Trash2,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import organizationAPI from "@/services/organizationService";
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

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesTab() {
  const { openCategoryModal, refreshTrigger } = useAdminModal();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [categorySortField, setCategorySortField] =
    useState<keyof Category>("name");
  const [categorySortDirection, setCategorySortDirection] = useState<
    "asc" | "desc"
  >("asc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [refreshTrigger]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await organizationAPI.getAllCategories();
      // API returns array directly, not wrapped in data property
      setCategories(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const searchLower = categorySearchTerm.toLowerCase();
      const matchesSearch =
        categorySearchTerm === "" ||
        category.name.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower) ||
        category.id.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [categories, categorySearchTerm]);

  // Sort categories
  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      const aValue = a[categorySortField];
      const bValue = b[categorySortField];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        comparison = aValue === bValue ? 0 : aValue ? -1 : 1;
      } else {
        comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      return categorySortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredCategories, categorySortField, categorySortDirection]);

  // Pagination for categories
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = sortedCategories.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Category statistics
  const categoryStats = useMemo(() => {
    return {
      totalCategories: categories.length,
      activeCategories: categories.filter((c) => c.isActive).length,
      inactiveCategories: categories.filter((c) => !c.isActive).length,
      totalOrganizationsInCategories: 0, // This would need to come from API
    };
  }, [categories]);

  const handleCategorySort = (field: keyof Category) => {
    if (categorySortField === field) {
      setCategorySortDirection(
        categorySortDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setCategorySortField(field);
      setCategorySortDirection("asc");
    }
  };

  const resetFilters = () => {
    setCategorySearchTerm("");
    setCurrentPage(1);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowDeleteDialog(true);
    setOpenMenuId(null);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await organizationAPI.deleteCategory(categoryToDelete);
      toast({
        title: "Success",
        description: "Category deleted successfully",
        variant: "success",
      });
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setCategoryToDelete(null);
    }
  };

  const handleToggleCategoryStatus = async (category: Category) => {
    try {
      await organizationAPI.updateCategory(category.id, {
        name: category.name,
        description: category.description,
      });
      toast({
        title: "Success",
        description: `Category ${category.isActive ? "deactivated" : "activated"} successfully`,
        variant: "success",
      });
      fetchCategories();
      setOpenMenuId(null);
    } catch (error: any) {
      console.error("Error toggling category status:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update category status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
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
          onClick={() => openCategoryModal()}
        >
          Add Category
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Categories"
          value={categoryStats.totalCategories.toLocaleString()}
          label="Available categories"
          trend={{
            direction: "up",
            value: "+2%",
            timeframe: "last month",
          }}
        />

        <KPICard
          title="Active Categories"
          value={categoryStats.activeCategories.toLocaleString()}
          label="Currently in use"
          trend={{
            direction: "up",
            value: "+1%",
            timeframe: "last month",
          }}
        />

        <KPICard
          title="Inactive Categories"
          value={categoryStats.inactiveCategories.toLocaleString()}
          label="Disabled categories"
          trend={{
            direction: "down",
            value: "0%",
            timeframe: "last month",
          }}
        />

        <KPICard
          title="Total Organizations"
          value={categoryStats.totalOrganizationsInCategories.toLocaleString()}
          label="Across all categories"
          trend={{
            direction: "up",
            value: "+8%",
            timeframe: "last month",
          }}
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search categories
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, description, or ID..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

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

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div
                        className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                        onClick={() => handleCategorySort("name")}
                      >
                        Category
                        {categorySortField === "name" && (
                          <span className="text-xs">
                            {categorySortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <div
                        className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                        onClick={() => handleCategorySort("createdAt")}
                      >
                        Created
                        {categorySortField === "createdAt" && (
                          <span className="text-xs">
                            {categorySortDirection === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow
                      key={category.id}
                      className="group hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <TableMainText className="font-medium">
                              {category.name}
                            </TableMainText>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs">
                          {category.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.isActive ? "success" : "muted"}
                          size="sm"
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </div>
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
                                  openMenuId === category.id
                                    ? null
                                    : category.id,
                                )
                              }
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </IconButton>

                            {openMenuId === category.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />

                                <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                  <button
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      openCategoryModal(category);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 text-gray-500" />
                                    View Details
                                  </button>

                                  <button
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      openCategoryModal(category);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 text-gray-500" />
                                    Edit Category
                                  </button>

                                  <div className="border-t border-gray-100 my-1" />

                                  {category.isActive ? (
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-600"
                                      onClick={() =>
                                        handleToggleCategoryStatus(category)
                                      }
                                    >
                                      <Ban className="w-4 h-4" />
                                      Deactivate Category
                                    </button>
                                  ) : (
                                    <button
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600"
                                      onClick={() =>
                                        handleToggleCategoryStatus(category)
                                      }
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Activate Category
                                    </button>
                                  )}

                                  <button
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600"
                                    onClick={() =>
                                      handleDeleteCategory(category.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Category
                                  </button>
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {Math.min(startIndex + 1, filteredCategories.length)}-
          {Math.min(startIndex + itemsPerPage, filteredCategories.length)} of{" "}
          {filteredCategories.length} results
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone and will permanently remove the category from the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
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
