import axios from "axios";

const BASE_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
const ADMIN_TOKEN_KEY =
  process.env.NEXT_PUBLIC_ADMIN_TOKEN_KEY || "qc_admin_token";

const getAdminToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const organizationAPI = {
  getAllOrganizations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
  }) => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  getOrganizationById: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/organizations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getActiveOrganizations: async () => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/organizations/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getPendingOrganizations: async () => {
    const token = getAdminToken();
    const response = await axios.get(`${BASE_API_URL}/organizations/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createOrganization: async (data: FormData | object) => {
    const token = getAdminToken();
    const headers: any = { Authorization: `Bearer ${token}` };
    if (!(data instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const response = await axios.post(
      `${BASE_API_URL}/organizations/admin/create`,
      data,
      {
        headers,
      },
    );
    return response.data;
  },

  updateOrganization: async (id: string, data: any) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/organizations/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  activateOrganization: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/organizations/${id}/activate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deactivateOrganization: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/organizations/${id}/deactivate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  suspendOrganization: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/organizations/${id}/suspend`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deleteOrganization: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(`${BASE_API_URL}/organizations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // ============ CATEGORY ENDPOINTS ============

  getAllCategories: async () => {
    const token = getAdminToken();
    const response = await axios.get(
      `${BASE_API_URL}/organization-categories`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  getCategoryById: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.get(
      `${BASE_API_URL}/organization-categories/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string }) => {
    const token = getAdminToken();
    const response = await axios.post(
      `${BASE_API_URL}/organization-categories`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: { name?: string; description?: string },
  ) => {
    const token = getAdminToken();
    const response = await axios.put(
      `${BASE_API_URL}/organization-categories/${id}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const token = getAdminToken();
    const response = await axios.delete(
      `${BASE_API_URL}/organization-categories/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  },
};

export default organizationAPI;
