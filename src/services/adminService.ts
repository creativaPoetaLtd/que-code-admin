import axios from "axios";
import {
  AdminUser,
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
    data: { approvalStatus?: boolean; isVerified?: boolean }
  ) => {
    const token = getAdminToken();
    const response = await axios.put(`${BASE_API_URL}/users/${id}/status`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  assignUserRole: async (userId: string, roleId: string) => {
    const token = getAdminToken();
    const response = await axios.post(
      `${BASE_API_URL}/users/assign-role`,
      { userId, roleId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
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
    const response = await axios.post(`${BASE_API_URL}/users`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    }
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
    }
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
      }
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
      }
    );
    return response.data;
  },

  getAllPermissions: async () => {
    const token = getAdminToken();
    const response = await axios.get<PermissionsResponse>(
      `${BASE_API_URL}/permissions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
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
    }
  ) => {
    const token = getAdminToken();
    const response = await axios.put(`${BASE_API_URL}/permissions/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
};

export default adminAPI;
