import axios from "axios";
import {
  AdminUser,
  AdminWalletsResponse,
  AdminRestrictionsResponse,
  AdminActionsResponse,
  AdminSubActionsResponse,
  DashboardRange,
  DashboardStatisticsResponse,
  UsersResponse,
  RolesResponse,
  PermissionsResponse,
} from "../types/admin.types";

// Base API URL - now pointing to main API routes
const BASE_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const ADMIN_TOKEN_KEY =
  process.env.NEXT_PUBLIC_ADMIN_TOKEN_KEY || "qc_admin_token";

// Helper function to get admin token from localStorage
const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const adminAPI = {
  // User Management - Updated to use /api/v1/users
  getAllUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const token = getAdminToken();
    const response = await axios.get<UsersResponse>(`${BASE_API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  getUserById: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateUserStatus: async (
    id: string,
    data: { approvalStatus?: boolean; isVerified?: boolean },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/users/${id}/status`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  assignUserRole: async (userId: string, roleId: string) => {
    const token = getAdminToken();
    const response = await axios.post(
      `${BASE_API_URL}/users/assign-role`,
      { userId, roleId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deleteUser: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${BASE_API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createUser: async (data: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    otp: string;
    otpExpires: Date;
    roleId?: string;
  }) => {
    const token = getAdminToken();
    const response = await axios.post(
      `${BASE_API_URL}/users/admin/create`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  updateUser: async (
    id: string,
    data: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      isVerified?: boolean;
      approvalStatus?: boolean;
    },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(`${BASE_API_URL}/users/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get user statistics - Added new endpoint
  getUserStatistics: async () => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/users/admin/statistics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Role & Permission Management - Updated to use /api/v1/roles and /api/v1/permissions
  getAllRoles: async () => {
    const token = getAdminToken();
    const response = await axios.get<RolesResponse>(`${BASE_API_URL}/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getRoleWithPermissions: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/roles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createRole: async (data: {
    name: string;
    description?: string;
    permissionIds?: string[];
  }) => {
    const token = getAdminToken();
    const response = await axios.post(`${BASE_API_URL}/roles`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateRole: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      permissionIds?: string[];
    },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(`${BASE_API_URL}/roles/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  deleteRole: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${BASE_API_URL}/roles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Assign permissions to role - Added new endpoint
  assignPermissionsToRole: async (roleId: string, permissionIds: string[]) => {
    const token = getAdminToken();
    const response = await axios.post(
      `${BASE_API_URL}/roles/${roleId}/permissions`,
      { permissionIds },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  // Remove permission from role - Added new endpoint
  removePermissionFromRole: async (roleId: string, permissionId: string) => {
    const token = getAdminToken();
    const response = await axios.delete(
      `${BASE_API_URL}/roles/${roleId}/permissions/${permissionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  getAllPermissions: async () => {
    const token = getAdminToken();
    const response = await axios.get<PermissionsResponse>(
      `${BASE_API_URL}/permissions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  createPermission: async (data: {
    name: string;
    description?: string;
    category?: string;
  }) => {
    const token = getAdminToken();
    const response = await axios.post(`${BASE_API_URL}/permissions`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updatePermission: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
    },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/permissions/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deletePermission: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${BASE_API_URL}/permissions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Transaction Management - Updated to use /api/v1/transactions/all
  getAllTransactions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const token = getAdminToken();
    // Changed from /admin/transactions to /transactions/all
    const response = await axios.get(`${BASE_API_URL}/transactions/all`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  getTransactionById: async (id: string) => {
    const token = getAdminToken();
    // Changed from /admin/transactions/:id to /transactions/:id
    const response = await axios.get(`${BASE_API_URL}/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getDashboardStatistics: async (params?: {
    range?: DashboardRange;
    bucket?: "hour" | "day" | "month";
    startDate?: string;
    endDate?: string;
  }) => {
    const token = getAdminToken();
    const response = await axios.get<DashboardStatisticsResponse>(
      `${BASE_API_URL}/admin/dashboard/statistics`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      },
    );
    return response.data;
  },

  getAllWallets: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    ownerType?: "all" | "user" | "organization" | "action";
    status?: "all" | "active" | "inactive";
    sortBy?:
      | "ownerName"
      | "ownerType"
      | "balance"
      | "transactionCount"
      | "updatedAt"
      | "createdAt";
    sortDirection?: "asc" | "desc";
  }) => {
    const token = getAdminToken();
    const response = await axios.get<AdminWalletsResponse>(
      `${BASE_API_URL}/transactions/wallets/all`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      },
    );
    return response.data;
  },

  getAllRestrictions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?:
      | "walletOwner"
      | "categoryName"
      | "amount"
      | "remainingAmount"
      | "transactionCount"
      | "updatedAt"
      | "createdAt";
    sortDirection?: "asc" | "desc";
  }) => {
    const token = getAdminToken();
    const response = await axios.get<AdminRestrictionsResponse>(
      `${BASE_API_URL}/transactions/restrictions/all`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      },
    );
    return response.data;
  },

  createRestriction: async (data: {
    walletId: string;
    categoryId: string;
    amount: number;
  }) => {
    const token = getAdminToken();
    const response = await axios.post(
      `${BASE_API_URL}/transactions/restrictions`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  updateRestriction: async (id: string, data: { amount: number }) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/transactions/restrictions/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deleteRestriction: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(
      `${BASE_API_URL}/transactions/restrictions/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  // Helper endpoints for restriction management
  getTransactionCategories: async () => {
    const token = getAdminToken();
    const response = await axios.get(
      `${BASE_API_URL}/transactions/categories`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  // Action Management
  getAllActions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "draft" | "published" | "archived" | "suspended";
    type?: string;
    organizationId?: string;
    sortBy?: "name" | "type" | "status" | "createdAt" | "updatedAt";
    sortDirection?: "asc" | "desc";
  }) => {
    const token = getAdminToken();
    const response = await axios.get<AdminActionsResponse>(
      `${BASE_API_URL}/admin/actions`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      },
    );
    return response.data;
  },

  getActionById: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/admin/actions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateActionStatus: async (
    id: string,
    data: { status: "draft" | "published" | "archived" },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/admin/actions/${id}/status`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deleteAction: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${BASE_API_URL}/admin/actions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  suspendAction: async (id: string, data: { reason?: string }) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/admin/actions/${id}/suspend`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  unsuspendAction: async (
    id: string,
    data: { newStatus?: "draft" | "published" },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/admin/actions/${id}/unsuspend`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  getActionSubActions: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(
      `${BASE_API_URL}/admin/actions/${id}/sub-actions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },
};

export default adminAPI;
