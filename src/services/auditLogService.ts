import axios from "axios";
import {
  AuditLogsResponse,
  AuditLog,
  AuditLogFilters,
  AuditLogFilterOptions,
  AuditLogStatistics,
} from "../types/admin.types";

const BASE_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

const ADMIN_TOKEN_KEY =
  process.env.NEXT_PUBLIC_ADMIN_TOKEN_KEY || "qc_admin_token";

// Helper function to get admin token from localStorage
const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const auditLogAPI = {
  // Get all audit logs with filtering
  getAllAuditLogs: async (filters: AuditLogFilters = {}) => {
    const token = getAdminToken();
    const response = await axios.get<AuditLogsResponse>(
      `${BASE_API_URL}/admin/audit-logs`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      },
    );
    return response.data;
  },

  // Get audit log by ID
  getAuditLogById: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get<{ success: boolean; data: AuditLog }>(
      `${BASE_API_URL}/admin/audit-logs/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  // Get user's audit logs
  getUserAuditLogs: async (
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) => {
    const token = getAdminToken();
    const response = await axios.get<AuditLogsResponse>(
      `${BASE_API_URL}/admin/audit-logs/user/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit },
      },
    );
    return response.data;
  },

  // Get filter options
  getFilterOptions: async () => {
    const token = getAdminToken();
    const response = await axios.get<{
      success: boolean;
      data: AuditLogFilterOptions;
    }>(`${BASE_API_URL}/admin/audit-logs/filters`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default auditLogAPI;
