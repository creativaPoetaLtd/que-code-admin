"use client";

import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import RoleModal from "./modals/RoleModal";
import PermissionModal from "./modals/PermissionModal";
import UserModal from "./modals/UserModal";
import CategoryModal from "./modals/CategoryModal";
import OrganizationModal from "./modals/OrganizationModal";
import ActionDetailModal from "./modals/ActionDetailModal";
import SubActionsModal from "./modals/SubActionsModal";
import { Role, Permission, AdminUser, AdminAction } from "@/types/admin.types";
import adminAPI from "@/services/adminService";
import { organizationAPI } from "@/services/organizationService";

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  contactPhone?: string;
  tinNumber?: string;
  categoryId?: string;
  categoryName?: string;
  status?: "active" | "inactive" | "suspended" | "pending";
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface SubAction {
  id: string;
  actionId: string;
  name: string;
  description?: string;
  price: string;
  stock: number | null;
  stockReserved: number;
  variants?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  coverImage?: string;
  dedicatedQrCodeData?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubActionsStats {
  total: number;
  active: number;
  inactive: number;
  withStock: number;
  unlimited: number;
  soldOut: number;
}

interface AdminModalContextType {
  // Role Modal
  openRoleModal: (role?: Role | null) => void;
  closeRoleModal: () => void;
  isRoleModalOpen: boolean;
  selectedRole: Role | null | undefined;

  // Permission Modal
  openPermissionModal: (permission?: Permission | null) => void;
  closePermissionModal: () => void;
  isPermissionModalOpen: boolean;
  selectedPermission: Permission | null | undefined;

  // User Modal
  openUserModal: (user?: AdminUser | null) => void;
  closeUserModal: () => void;
  isUserModalOpen: boolean;
  selectedUser: AdminUser | null | undefined;

  // Category Modal
  openCategoryModal: (category?: Category | null) => void;
  closeCategoryModal: () => void;
  isCategoryModalOpen: boolean;
  selectedCategory: Category | null | undefined;

  // Organization Modal
  openOrganizationModal: (organization?: Organization | null) => void;
  closeOrganizationModal: () => void;
  isOrganizationModalOpen: boolean;
  selectedOrganization: Organization | null | undefined;

  // Action Detail Modal
  openActionDetailModal: (action: AdminAction | null) => void;
  closeActionDetailModal: () => void;
  isActionDetailModalOpen: boolean;
  selectedAction: AdminAction | null;

  // Sub-Actions Modal
  openSubActionsModal: (
    action: AdminAction | null,
    subActions: SubAction[],
    stats: SubActionsStats | null,
    loading: boolean,
  ) => void;
  closeSubActionsModal: () => void;
  isSubActionsModalOpen: boolean;
  subActionsData: {
    action: AdminAction | null;
    subActions: SubAction[];
    stats: SubActionsStats | null;
    loading: boolean;
  };

  // Data
  permissions: Permission[];
  setPermissions: (permissions: Permission[]) => void;
  roles: Role[];
  setRoles: (roles: Role[]) => void;
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AdminModalContext = createContext<AdminModalContextType | undefined>(
  undefined,
);

interface AdminModalsContainerProps {
  children: ReactNode;
}

export function AdminModalsContainer({ children }: AdminModalsContainerProps) {
  // Role Modal state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null | undefined>(
    null,
  );

  // Permission Modal state
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<
    Permission | null | undefined
  >(null);

  // User Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<
    AdminUser | null | undefined
  >(null);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | null | undefined
  >(null);

  // Organization Modal state
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<
    Organization | null | undefined
  >(null);

  // Action Detail Modal state
  const [isActionDetailModalOpen, setIsActionDetailModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(
    null,
  );

  // Sub-Actions Modal state
  const [isSubActionsModalOpen, setIsSubActionsModalOpen] = useState(false);
  const [subActionsData, setSubActionsData] = useState<{
    action: AdminAction | null;
    subActions: SubAction[];
    stats: SubActionsStats | null;
    loading: boolean;
  }>({
    action: null,
    subActions: [],
    stats: null,
    loading: false,
  });

  // Shared data
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load permissions and roles on mount and when refresh is triggered
  useEffect(() => {
    loadPermissionsRolesAndCategories();
  }, [refreshTrigger]);

  const loadPermissionsRolesAndCategories = async () => {
    try {
      const [permissionsRes, rolesRes, categoriesRes] = await Promise.all([
        adminAPI.getAllPermissions(),
        adminAPI.getAllRoles(),
        organizationAPI.getAllCategories(),
      ]);
      setPermissions(permissionsRes.data);
      setRoles(rolesRes.data);
      setCategories(categoriesRes.data || categoriesRes);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const openRoleModal = (role?: Role | null) => {
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setSelectedRole(null);
  };

  const openPermissionModal = (permission?: Permission | null) => {
    setSelectedPermission(permission);
    setIsPermissionModalOpen(true);
  };

  const closePermissionModal = () => {
    setIsPermissionModalOpen(false);
    setSelectedPermission(null);
  };

  const openUserModal = (user?: AdminUser | null) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const openCategoryModal = (category?: Category | null) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  const openOrganizationModal = (organization?: Organization | null) => {
    setSelectedOrganization(organization);
    setIsOrganizationModalOpen(true);
  };

  const closeOrganizationModal = () => {
    setIsOrganizationModalOpen(false);
    setSelectedOrganization(null);
  };

  const openActionDetailModal = (action: AdminAction | null) => {
    setSelectedAction(action);
    setIsActionDetailModalOpen(true);
  };

  const closeActionDetailModal = () => {
    setIsActionDetailModalOpen(false);
    setSelectedAction(null);
  };

  const openSubActionsModal = (
    action: AdminAction | null,
    subActions: SubAction[],
    stats: SubActionsStats | null,
    loading: boolean,
  ) => {
    setSubActionsData({ action, subActions, stats, loading });
    setIsSubActionsModalOpen(true);
  };

  const closeSubActionsModal = () => {
    setIsSubActionsModalOpen(false);
    setSubActionsData({
      action: null,
      subActions: [],
      stats: null,
      loading: false,
    });
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const value: AdminModalContextType = {
    openRoleModal,
    closeRoleModal,
    isRoleModalOpen,
    selectedRole,
    openPermissionModal,
    closePermissionModal,
    isPermissionModalOpen,
    selectedPermission,
    openUserModal,
    closeUserModal,
    isUserModalOpen,
    selectedUser,
    openCategoryModal,
    closeCategoryModal,
    isCategoryModalOpen,
    selectedCategory,
    openOrganizationModal,
    closeOrganizationModal,
    isOrganizationModalOpen,
    selectedOrganization,
    openActionDetailModal,
    closeActionDetailModal,
    isActionDetailModalOpen,
    selectedAction,
    openSubActionsModal,
    closeSubActionsModal,
    isSubActionsModalOpen,
    subActionsData,
    permissions,
    setPermissions,
    roles,
    setRoles,
    categories,
    setCategories,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <AdminModalContext.Provider value={value}>
      {children}

      {/* All modals rendered at root level */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={closeRoleModal}
        onSuccess={() => {
          closeRoleModal();
          triggerRefresh();
        }}
        role={selectedRole}
        permissions={permissions}
      />

      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={closePermissionModal}
        onSuccess={() => {
          closePermissionModal();
          triggerRefresh();
        }}
        permission={selectedPermission}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        onSuccess={() => {
          closeUserModal();
          triggerRefresh();
        }}
        user={selectedUser}
        roles={roles}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        onSuccess={() => {
          closeCategoryModal();
          triggerRefresh();
        }}
        category={selectedCategory}
      />

      <OrganizationModal
        isOpen={isOrganizationModalOpen}
        onClose={closeOrganizationModal}
        onSuccess={() => {
          closeOrganizationModal();
          triggerRefresh();
        }}
        organization={selectedOrganization}
        categories={categories}
      />

      <ActionDetailModal
        isOpen={isActionDetailModalOpen}
        onClose={closeActionDetailModal}
        action={selectedAction}
      />

      <SubActionsModal
        isOpen={isSubActionsModalOpen}
        onClose={closeSubActionsModal}
        action={subActionsData.action}
        subActions={subActionsData.subActions}
        subActionsStats={subActionsData.stats}
        loading={subActionsData.loading}
      />
    </AdminModalContext.Provider>
  );
}

export function useAdminModal() {
  const context = useContext(AdminModalContext);
  if (context === undefined) {
    throw new Error("useAdminModal must be used within AdminModalsContainer");
  }
  return context;
}
