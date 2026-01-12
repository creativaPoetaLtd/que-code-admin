"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  permissions: string[];
  isVerified: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_TOKEN_KEY =
    process.env.NEXT_PUBLIC_ADMIN_TOKEN_KEY || "qc_admin_token";

  // Base API URL from environment (e.g., http://localhost:5001/api/v1)
  const BASE_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

  // Admin auth endpoints are at /admin/auth/* (separate from unified routes)
  const ADMIN_AUTH_URL = `${BASE_API_URL}/admin/auth`;

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await fetch(`${ADMIN_AUTH_URL}/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both response formats: data.admin or data.user
        setAdmin(data.admin || data.user);
      } else {
        // Token invalid, clear it
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setAdmin(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${ADMIN_AUTH_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();

      // Handle both old and new response formats
      // New format: { token, user } - from unified auth
      // Old format: { adminToken, admin } - from admin-specific auth
      const authToken = data.token || data.adminToken;
      const userData = data.user || data.admin;

      if (!authToken || !userData) {
        throw new Error("Invalid response format from server");
      }

      // Store the token (works with both old and new format)
      localStorage.setItem(ADMIN_TOKEN_KEY, authToken);

      // Set admin data directly from response
      setAdmin(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdmin(null);
    window.location.href = "/auth/login";
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    admin,
    isAuthenticated: !!admin,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
