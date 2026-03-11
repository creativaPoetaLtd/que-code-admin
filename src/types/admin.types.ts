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
  currentPage?: number;
  page?: number;
  pageSize?: number;
  limit?: number;
  totalItems?: number;
  total?: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
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

export type DashboardRange = "today" | "7d" | "30d" | "90d" | "12m" | "custom";

export interface DashboardFlowSummaryItem {
  key: string;
  label: string;
  today: number;
  rangeTotal: number;
  trendPercent?: number;
  trendPoints?: number;
  status: string;
}

export interface DashboardStatisticsData {
  range: {
    key: DashboardRange;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
    bucket: "hour" | "day" | "month";
  };
  kpis: {
    totalUsers: {
      total: number;
      verified: number;
      newInRange: number;
      trendPercent: number;
    };
    organizations: {
      total: number;
      pending: number;
      newInRange: number;
      trendPercent: number;
    };
    volume: {
      totalInRange: number;
      completedInRange: number;
      trendPercent: number;
    };
    riskFraud: {
      flaggedCount: number;
      ratePercent: number;
      trendPoints: number;
    };
  };
  counts: {
    wallets: {
      total: number;
      active: number;
    };
    transactions: {
      total: number;
      completed: number;
      pending: number;
      failedOrCancelled: number;
    };
    actions: {
      createdToday: number;
      createdInRange: number;
      trendPercent: number;
    };
  };
  charts: {
    transactionsDisputes: {
      labels: string[];
      datasets: {
        transactions: number[];
        disputes: number[];
      };
    };
    flowByType: {
      labels: string[];
      series: {
        transfer: number[];
        payment: number[];
        donation: number[];
        vote: number[];
        topup: number[];
        withdrawal: number[];
      };
    };
    sparklines: {
      users: number[];
      organizations: number[];
      volume: number[];
      risk: number[];
    };
  };
  table: {
    flowSummary: DashboardFlowSummaryItem[];
  };
  meta: {
    generatedAt: string;
    currency: string;
  };
}

export interface DashboardStatisticsResponse {
  success: boolean;
  data: DashboardStatisticsData;
}

export interface AdminWallet {
  id: string;
  userId: string | null;
  organizationId: string | null;
  groupId: string | null;
  ownerName: string;
  ownerType: "user" | "organization" | "action";
  balance: number;
  currency: string;
  isActive: boolean;
  restrictionsCount: number;
  totalRestricted: number;
  availableBalance: number;
  transactionCount: number;
  lastTransaction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWalletsResponse {
  success: boolean;
  data: AdminWallet[];
  statistics: {
    total: number;
    active: number;
    inactive: number;
    users: number;
    organizations: number;
    actions: number;
  };
  pagination: PaginationMeta;
}

export interface AdminRestriction {
  id: string;
  walletId: string;
  walletOwner: string;
  walletOwnerType: "user" | "organization" | "action";
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRestrictionsResponse {
  success: boolean;
  data: AdminRestriction[];
  statistics: {
    total: number;
    active: number;
    exhausted: number;
    unused: number;
    totalAllocated: number;
    totalUsed: number;
    totalRemaining: number;
  };
  pagination: PaginationMeta;
}

export type ActionType =
  | "ticket"
  | "transport"
  | "service"
  | "subscription"
  | "payment"
  | "donation"
  | "vote"
  | "booking"
  | "license"
  | "membership"
  | "rental"
  | "group";

export type ActionStatus = "draft" | "published" | "archived" | "suspended";

export type ActionDisplayLayout = "mosaic" | "list" | "icons" | "card";

export interface AdminAction {
  id: string;
  organizationId: string;
  type: ActionType;
  name: string;
  slug: string;
  displayLayout: ActionDisplayLayout;
  coverImage: string | null;
  shortDescription: string | null;
  description: string | null;
  currency: string;
  taxProfileId: string | null;
  pricing: {
    mode: "fixed" | "free" | "range" | "tiered";
    amount?: number;
    min?: number;
    max?: number;
  };
  availability: any;
  visibility: {
    mode: "public" | "unlisted" | "private";
    whitelist?: string[];
  };
  buyerFields: string[];
  fulfillment: {
    storeOnBuyerQR: boolean;
    objectType?: "eticket" | "badge" | "license" | "membership";
    postPurchaseMessage?: string;
  };
  policy: any;
  webhooks: any;
  customFields: any;
  status: ActionStatus;
  dedicatedQrCode: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AdminActionsResponse {
  success: boolean;
  data: AdminAction[];
  statistics: {
    total: number;
    draft: number;
    published: number;
    archived: number;
    suspended: number;
  };
  pagination: PaginationMeta;
}

export interface AdminSubAction {
  id: string;
  actionId: string;
  name: string;
  description: string | null;
  price: number;
  stock: number | null;
  stockReserved: number;
  variants: any;
  metadata: any;
  isActive: boolean;
  sortOrder: number;
  coverImage: string | null;
  dedicatedQrCodeData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubActionsResponse {
  success: boolean;
  data: AdminSubAction[];
  statistics: {
    total: number;
    active: number;
    inactive: number;
    withStock: number;
    unlimited: number;
    soldOut: number;
  };
  action: {
    id: string;
    name: string;
    type: ActionType;
    status: ActionStatus;
  };
}

// Audit Logs
export type AuditLogLevel = "info" | "warning" | "error" | "critical";

export interface AuditLogUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuditLogOrganization {
  id: string;
  name: string;
  email: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  organizationId: string | null;
  action: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string | null;
  userAgent: string | null;
  requestBody: Record<string, any> | null;
  responseBody: Record<string, any> | null;
  metadata: Record<string, any> | null;
  duration: number | null;
  level: AuditLogLevel;
  createdAt: string;
  updatedAt: string;
  user?: AuditLogUser;
  organization?: AuditLogOrganization;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  level?: "all" | AuditLogLevel;
  action?: string;
  method?: "all" | "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  userId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?:
    | "createdAt"
    | "statusCode"
    | "duration"
    | "level"
    | "action"
    | "endpoint"
    | "method";
  sortDirection?: "asc" | "desc";
}

export interface AuditLogStatistics {
  total: number;
  info: number;
  warning: number;
  error: number;
  critical: number;
  last24h: number;
  last7d: number;
}

export interface AuditLogFilterOptions {
  actions: string[];
  methods: string[];
  levels: AuditLogLevel[];
}

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: PaginationMeta;
  statistics: AuditLogStatistics;
}
