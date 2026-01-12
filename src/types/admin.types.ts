export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  rolePermissions?: RolePermission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: Permission;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role?: Role;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  approvalStatus: boolean;
  hasPinSet: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  createdAt: string;
  updatedAt: string;
  userRoles?: UserRole[];
  role?: Role; // Direct role object from new API response
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersResponse {
  success: boolean;
  data: AdminUser[];
  pagination: PaginationMeta;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface PermissionsResponse {
  success: boolean;
  data: Permission[];
}
