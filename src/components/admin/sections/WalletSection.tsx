"use client";

import { useState, useMemo, useEffect } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import { adminAPI } from "@/services/adminService";
import {
  AdminWallet,
  AdminWalletsResponse,
  AdminRestriction,
} from "@/types/admin.types";
import RestrictionModal from "../modals/RestrictionModal";
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
  TableSubText,
  TableActions,
} from "../ui/Table";
import { IconButton } from "../ui/Button";
import {
  Search,
  Download,
  Wallet,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Ban,
  Trash2,
  RefreshCw,
  Plus,
  Shield,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  CreditCard,
  Activity,
} from "lucide-react";

interface WalletData {
  id: string;
  userId?: string;
  organizationId?: string;
  ownerName: string;
  ownerType: "user" | "organization";
  balance: number;
  currency: string;
  isActive: boolean;
  restrictionsCount: number;
  totalRestricted: number;
  availableBalance: number;
  transactionCount: number;
  lastTransaction?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WalletRestriction {
  id: string;
  walletId: string;
  walletOwner: string;
  categoryId: string;
  categoryName: string;
  categoryDescription?: string;
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const mockWallets: WalletData[] = [
  {
    id: "WALLET-001",
    userId: "USER-001",
    ownerName: "Marie Lambert",
    ownerType: "user",
    balance: 125000,
    currency: "RWF",
    isActive: true,
    restrictionsCount: 2,
    totalRestricted: 25000,
    availableBalance: 100000,
    transactionCount: 15,
    lastTransaction: new Date("2024-12-04T10:30:00"),
    createdAt: new Date("2024-01-15T08:00:00"),
    updatedAt: new Date("2024-12-04T10:35:00"),
  },
  {
    id: "WALLET-002",
    organizationId: "ORG-001",
    ownerName: "Hope Church Brussels",
    ownerType: "organization",
    balance: 2500000,
    currency: "RWF",
    isActive: true,
    restrictionsCount: 5,
    totalRestricted: 500000,
    availableBalance: 2000000,
    transactionCount: 45,
    lastTransaction: new Date("2024-12-04T09:15:00"),
    createdAt: new Date("2023-06-01T10:00:00"),
    updatedAt: new Date("2024-12-04T09:20:00"),
  },
  {
    id: "WALLET-003",
    userId: "USER-002",
    ownerName: "Jean Uwimana",
    ownerType: "user",
    balance: 67000,
    currency: "RWF",
    isActive: true,
    restrictionsCount: 0,
    totalRestricted: 0,
    availableBalance: 67000,
    transactionCount: 8,
    lastTransaction: new Date("2024-12-03T16:45:00"),
    createdAt: new Date("2024-03-10T14:30:00"),
    updatedAt: new Date("2024-12-03T16:50:00"),
  },
  {
    id: "WALLET-004",
    organizationId: "ORG-002",
    ownerName: "Green Energy Rwanda",
    ownerType: "organization",
    balance: 800000,
    currency: "RWF",
    isActive: false,
    restrictionsCount: 3,
    totalRestricted: 150000,
    availableBalance: 650000,
    transactionCount: 12,
    lastTransaction: new Date("2024-11-28T11:20:00"),
    createdAt: new Date("2023-09-15T12:00:00"),
    updatedAt: new Date("2024-11-28T11:25:00"),
  },
  {
    id: "WALLET-005",
    userId: "USER-003",
    ownerName: "Sarah Johnson",
    ownerType: "user",
    balance: 189000,
    currency: "RWF",
    isActive: true,
    restrictionsCount: 1,
    totalRestricted: 50000,
    availableBalance: 139000,
    transactionCount: 22,
    lastTransaction: new Date("2024-12-02T14:20:00"),
    createdAt: new Date("2024-02-20T09:15:00"),
    updatedAt: new Date("2024-12-02T14:25:00"),
  },
];

const mockRestrictions: WalletRestriction[] = [
  {
    id: "RESTR-001",
    walletId: "WALLET-001",
    walletOwner: "Marie Lambert",
    categoryId: "CAT-001",
    categoryName: "Religious",
    categoryDescription: "Donations and payments to religious organizations",
    amount: 15000,
    usedAmount: 5000,
    remainingAmount: 10000,
    transactionCount: 3,
    createdAt: new Date("2024-01-15T08:30:00"),
    updatedAt: new Date("2024-12-04T10:30:00"),
  },
  {
    id: "RESTR-002",
    walletId: "WALLET-001",
    walletOwner: "Marie Lambert",
    categoryId: "CAT-002",
    categoryName: "Transportation",
    categoryDescription: "Payments for taxi, bus, and transport services",
    amount: 10000,
    usedAmount: 8500,
    remainingAmount: 1500,
    transactionCount: 5,
    createdAt: new Date("2024-01-15T08:30:00"),
    updatedAt: new Date("2024-12-03T16:15:00"),
  },
  {
    id: "RESTR-003",
    walletId: "WALLET-002",
    walletOwner: "Hope Church Brussels",
    categoryId: "CAT-003",
    categoryName: "Energy",
    categoryDescription: "Payments for electricity, solar, and energy services",
    amount: 200000,
    usedAmount: 75000,
    remainingAmount: 125000,
    transactionCount: 8,
    createdAt: new Date("2023-06-01T10:30:00"),
    updatedAt: new Date("2024-12-01T14:20:00"),
  },
  {
    id: "RESTR-004",
    walletId: "WALLET-002",
    walletOwner: "Hope Church Brussels",
    categoryId: "CAT-004",
    categoryName: "Technology",
    categoryDescription:
      "Payments for software, IT services, and tech products",
    amount: 150000,
    usedAmount: 45000,
    remainingAmount: 105000,
    transactionCount: 4,
    createdAt: new Date("2023-06-01T10:30:00"),
    updatedAt: new Date("2024-11-25T09:45:00"),
  },
  {
    id: "RESTR-005",
    walletId: "WALLET-002",
    walletOwner: "Hope Church Brussels",
    categoryId: "CAT-005",
    categoryName: "Healthcare",
    categoryDescription: "Medical payments and healthcare services",
    amount: 100000,
    usedAmount: 0,
    remainingAmount: 100000,
    transactionCount: 0,
    createdAt: new Date("2023-08-15T16:00:00"),
    updatedAt: new Date("2023-08-15T16:00:00"),
  },
  {
    id: "RESTR-006",
    walletId: "WALLET-005",
    walletOwner: "Sarah Johnson",
    categoryId: "CAT-002",
    categoryName: "Transportation",
    categoryDescription: "Payments for taxi, bus, and transport services",
    amount: 50000,
    usedAmount: 22000,
    remainingAmount: 28000,
    transactionCount: 7,
    createdAt: new Date("2024-02-20T09:30:00"),
    updatedAt: new Date("2024-12-02T11:10:00"),
  },
];

export default function WalletSection() {
  const [activeTab, setActiveTab] = useState<"wallets" | "restrictions">(
    "wallets",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<
    "all" | "user" | "organization" | "action"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortField, setSortField] = useState<keyof WalletData>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // API state
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [totalWalletsCount, setTotalWalletsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [walletStatistics, setWalletStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    users: 0,
    organizations: 0,
    actions: 0,
  });

  // Restriction management states
  const [restrictionSearchTerm, setRestrictionSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [restrictionSortField, setRestrictionSortField] =
    useState<keyof WalletRestriction>("updatedAt");
  const [restrictionSortDirection, setRestrictionSortDirection] = useState<
    "asc" | "desc"
  >("desc");

  // Restrictions API state
  const [restrictions, setRestrictions] = useState<AdminRestriction[]>([]);
  const [restrictionsLoading, setRestrictionsLoading] = useState(true);
  const [restrictionsError, setRestrictionsError] = useState<string | null>(
    null,
  );
  const [totalRestrictionsCount, setTotalRestrictionsCount] = useState(0);
  const [restrictionPages, setRestrictionPages] = useState(0);
  const [restrictionStatistics, setRestrictionStatistics] = useState({
    total: 0,
    active: 0,
    exhausted: 0,
    unused: 0,
    totalAllocated: 0,
    totalUsed: 0,
    totalRemaining: 0,
  });

  // Modal and CRUD states
  const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] =
    useState<AdminRestriction | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [walletsForDropdown, setWalletsForDropdown] = useState<any[]>([]);
  const [deletingRestrictionId, setDeletingRestrictionId] = useState<
    string | null
  >(null);

  // Fetch wallets from API
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setWalletsLoading(true);
        setWalletsError(null);
        const response = await adminAPI.getAllWallets({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          ownerType: ownerTypeFilter,
          status: statusFilter,
          sortBy: sortField as any,
          sortDirection,
        });

        if (response.success) {
          setWallets(response.data);
          setWalletStatistics(response.statistics);
          setTotalWalletsCount(
            response.pagination.totalItems || response.pagination.total || 0,
          );
          setTotalPages(response.pagination.totalPages);
        }
      } catch (error: any) {
        console.error("Failed to fetch wallets:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load wallets";

        // More specific error messages
        if (
          error.response?.status === 401 ||
          errorMessage.includes("token") ||
          errorMessage.includes("Access denied")
        ) {
          setWalletsError("Authentication required. Please log in again.");
        } else if (error.response?.status === 403) {
          setWalletsError("Access denied. Admin privileges required.");
        } else {
          setWalletsError(errorMessage);
        }
      } finally {
        setWalletsLoading(false);
      }
    };

    if (activeTab === "wallets") {
      fetchWallets();
    }
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    ownerTypeFilter,
    statusFilter,
    sortField,
    sortDirection,
    activeTab,
  ]);

  // Fetch restrictions from API
  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        setRestrictionsLoading(true);
        setRestrictionsError(null);
        const response = await adminAPI.getAllRestrictions({
          page: currentPage,
          limit: itemsPerPage,
          search: restrictionSearchTerm || undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
          sortBy: restrictionSortField as any,
          sortDirection: restrictionSortDirection,
        });

        if (response.success) {
          setRestrictions(response.data);
          setRestrictionStatistics(response.statistics);
          setTotalRestrictionsCount(
            response.pagination.totalItems || response.pagination.total || 0,
          );
          setRestrictionPages(response.pagination.totalPages);
        }
      } catch (error: any) {
        console.error("Failed to fetch restrictions:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to load restrictions";

        if (
          error.response?.status === 401 ||
          errorMessage.includes("token") ||
          errorMessage.includes("Access denied")
        ) {
          setRestrictionsError("Authentication required. Please log in again.");
        } else if (error.response?.status === 403) {
          setRestrictionsError("Access denied. Admin privileges required.");
        } else {
          setRestrictionsError(errorMessage);
        }
      } finally {
        setRestrictionsLoading(false);
      }
    };

    if (activeTab === "restrictions") {
      fetchRestrictions();
    }
  }, [
    currentPage,
    itemsPerPage,
    restrictionSearchTerm,
    categoryFilter,
    restrictionSortField,
    restrictionSortDirection,
    activeTab,
  ]);

  // Convert API wallets to WalletData format for display
  const displayWallets = useMemo(() => {
    return wallets.map((wallet) => ({
      ...wallet,
      lastTransaction: wallet.lastTransaction
        ? new Date(wallet.lastTransaction)
        : undefined,
      createdAt: new Date(wallet.createdAt),
      updatedAt: new Date(wallet.updatedAt),
    }));
  }, [wallets]);

  // Convert API restrictions to display format
  const displayRestrictions = useMemo(() => {
    return restrictions.map((restriction) => ({
      ...restriction,
      createdAt: new Date(restriction.createdAt),
      updatedAt: new Date(restriction.updatedAt),
    }));
  }, [restrictions]);

  // Get unique categories from restrictions for filter
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    restrictions.forEach((r) => {
      if (r.categoryId) categories.add(r.categoryId);
    });
    return Array.from(categories);
  }, [restrictions]);

  // Both wallets and restrictions use server-side pagination now
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Statistics calculations
  const walletStats = useMemo(() => {
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalRestricted = wallets.reduce(
      (sum, w) => sum + w.totalRestricted,
      0,
    );
    const totalAvailable = wallets.reduce(
      (sum, w) => sum + w.availableBalance,
      0,
    );
    return {
      totalWallets: walletStatistics.total,
      activeWallets: walletStatistics.active,
      inactiveWallets: walletStatistics.inactive,
      userWallets: walletStatistics.users,
      orgWallets: walletStatistics.organizations,
      totalBalance,
      totalRestricted,
      totalAvailable,
      totalRestrictions: restrictionStatistics.total,
    };
  }, [wallets, walletStatistics, restrictionStatistics]);

  // Restriction statistics from API
  const restrictionStats = useMemo(() => {
    return {
      totalRestrictions: restrictionStatistics.total,
      activeRestrictions: restrictionStatistics.active,
      exhaustedRestrictions: restrictionStatistics.exhausted,
      unusedRestrictions: restrictionStatistics.unused,
      totalAllocated: restrictionStatistics.totalAllocated,
      totalUsed: restrictionStatistics.totalUsed,
      totalRemaining: restrictionStatistics.totalRemaining,
    };
  }, [restrictionStatistics]);

  const getWalletTypeIcon = (type: string) => {
    return type === "user" ? (
      <Users className="w-4 h-4" />
    ) : (
      <Building2 className="w-4 h-4" />
    );
  };

  const getRestrictionProgress = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleSort = (field: keyof WalletData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRestrictionSort = (field: keyof WalletRestriction) => {
    if (restrictionSortField === field) {
      setRestrictionSortDirection(
        restrictionSortDirection === "asc" ? "desc" : "asc",
      );
    } else {
      setRestrictionSortField(field);
      setRestrictionSortDirection("asc");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setOwnerTypeFilter("all");
    setStatusFilter("all");
    setRestrictionSearchTerm("");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Fetch categories and wallets for dropdown
  const fetchCategoriesAndWallets = async () => {
    try {
      const [categoriesRes, walletsRes] = await Promise.all([
        adminAPI.getTransactionCategories(),
        adminAPI.getAllWallets({ limit: 1000 }), // Get all wallets for dropdown
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }
      if (walletsRes.success) {
        setWalletsForDropdown(walletsRes.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories/wallets:", error);
    }
  };

  // Handle create restriction
  const handleCreateRestriction = () => {
    setSelectedRestriction(null);
    fetchCategoriesAndWallets();
    setIsRestrictionModalOpen(true);
  };

  // Handle edit restriction
  const handleEditRestriction = (restriction: AdminRestriction) => {
    setSelectedRestriction(restriction);
    fetchCategoriesAndWallets();
    setIsRestrictionModalOpen(true);
  };

  // Handle delete restriction
  const handleDeleteRestriction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restriction?")) {
      return;
    }

    try {
      setDeletingRestrictionId(id);
      await adminAPI.deleteRestriction(id);

      // Refresh restrictions list
      const response = await adminAPI.getAllRestrictions({
        page: currentPage,
        limit: itemsPerPage,
        search: restrictionSearchTerm || undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        sortBy: restrictionSortField as any,
        sortDirection: restrictionSortDirection,
      });

      if (response.success) {
        setRestrictions(response.data);
        setRestrictionStatistics(response.statistics);
        setTotalRestrictionsCount(
          response.pagination.totalItems || response.pagination.total || 0,
        );
        setRestrictionPages(response.pagination.totalPages);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to delete restriction");
    } finally {
      setDeletingRestrictionId(null);
    }
  };

  // Handle modal success
  const handleModalSuccess = () => {
    // Refresh restrictions list
    const fetchRestrictions = async () => {
      try {
        setRestrictionsLoading(true);
        const response = await adminAPI.getAllRestrictions({
          page: currentPage,
          limit: itemsPerPage,
          search: restrictionSearchTerm || undefined,
          categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
          sortBy: restrictionSortField as any,
          sortDirection: restrictionSortDirection,
        });

        if (response.success) {
          setRestrictions(response.data);
          setRestrictionStatistics(response.statistics);
          setTotalRestrictionsCount(
            response.pagination.totalItems || response.pagination.total || 0,
          );
          setRestrictionPages(response.pagination.totalPages);
        }
      } catch (error: any) {
        console.error("Failed to refresh restrictions:", error);
      } finally {
        setRestrictionsLoading(false);
      }
    };

    fetchRestrictions();
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("wallets");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "wallets"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallets ({walletStats.totalWallets})
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab("restrictions");
              setCurrentPage(1);
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "restrictions"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Restrictions ({restrictionStats.totalRestrictions})
            </div>
          </button>
        </nav>
      </div>

      {activeTab === "wallets" ? (
        <>
          {/* Wallets Tab Content */}
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
            >
              Create Wallet
            </Button>
          </div>

          {/* Wallets Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <KPICard
              title="Total Wallets"
              value={walletStats.totalWallets.toLocaleString()}
              label="All wallets"
              trend={{
                direction: "up",
                value: "+5%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Active Wallets"
              value={walletStats.activeWallets.toLocaleString()}
              label="Currently active"
              trend={{
                direction: "up",
                value: "+3%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="User Wallets"
              value={walletStats.userWallets.toLocaleString()}
              label="Individual users"
              trend={{
                direction: "up",
                value: "+8%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Org Wallets"
              value={walletStats.orgWallets.toLocaleString()}
              label="Organizations"
              trend={{
                direction: "up",
                value: "+2%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Total Balance"
              value={`${(walletStats.totalBalance / 1000000).toFixed(1)}M`}
              label="RWF total balance"
              trend={{
                direction: "up",
                value: "+12%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Available Balance"
              value={`${(walletStats.totalAvailable / 1000000).toFixed(1)}M`}
              label="RWF available"
              trend={{
                direction: "up",
                value: "+10%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Restricted Balance"
              value={`${(walletStats.totalRestricted / 1000).toFixed(0)}K`}
              label="RWF restricted"
              trend={{
                direction: "up",
                value: "+15%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Restrictions"
              value={walletStats.totalRestrictions.toLocaleString()}
              label="Active restrictions"
              trend={{
                direction: "up",
                value: "+7%",
                timeframe: "last month",
              }}
            />
          </div>

          {/* Wallets Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search wallets
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Owner name, wallet ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {/* Owner Type Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Owner Type
                  </label>
                  <select
                    value={ownerTypeFilter}
                    onChange={(e) => {
                      setOwnerTypeFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Types</option>
                    <option value="user">Users</option>
                    <option value="organization">Organizations</option>
                    <option value="action">Actions</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Reset Filters */}
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

          {/* Wallets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {walletsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading wallets...
                    </span>
                  </div>
                ) : walletsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                    <p className="text-red-600 font-medium">{walletsError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : displayWallets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Wallet className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">
                      No wallets found
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Owner</TableHead>
                        <TableHead>
                          <div
                            className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                            onClick={() => handleSort("balance")}
                          >
                            Balance
                            {sortField === "balance" && (
                              <span className="text-xs">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Restricted</TableHead>
                        <TableHead>
                          <div
                            className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                            onClick={() => handleSort("transactionCount")}
                          >
                            Transactions
                            {sortField === "transactionCount" && (
                              <span className="text-xs">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <div
                            className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                            onClick={() => handleSort("updatedAt")}
                          >
                            Last Activity
                            {sortField === "updatedAt" && (
                              <span className="text-xs">
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayWallets.map((wallet) => (
                        <TableRow
                          key={wallet.id}
                          className="group hover:bg-gray-50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                  wallet.ownerType === "user"
                                    ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                    : "bg-gradient-to-br from-purple-400 to-purple-600"
                                }`}
                              >
                                {getWalletTypeIcon(wallet.ownerType)}
                              </div>
                              <div>
                                <TableMainText className="font-medium">
                                  {wallet.ownerName}
                                </TableMainText>
                                <TableSubText className="text-xs text-gray-500">
                                  {wallet.ownerType === "user"
                                    ? "Individual"
                                    : "Organization"}{" "}
                                  • {wallet.id}
                                </TableSubText>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {wallet.balance.toLocaleString()}{" "}
                              {wallet.currency}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-green-600">
                              {wallet.availableBalance.toLocaleString()}{" "}
                              {wallet.currency}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="text-sm">
                                {wallet.totalRestricted.toLocaleString()}{" "}
                                {wallet.currency}
                              </div>
                              {wallet.restrictionsCount > 0 && (
                                <Badge variant="warning" size="sm">
                                  {wallet.restrictionsCount}{" "}
                                  {wallet.restrictionsCount === 1
                                    ? "restriction"
                                    : "restrictions"}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="info" size="sm">
                              {wallet.transactionCount}{" "}
                              {wallet.transactionCount === 1 ? "txn" : "txns"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={wallet.isActive ? "success" : "muted"}
                              size="sm"
                            >
                              {wallet.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {wallet.lastTransaction
                                ? new Date(
                                    wallet.lastTransaction,
                                  ).toLocaleDateString()
                                : "No transactions"}
                            </div>
                            {wallet.lastTransaction && (
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  wallet.lastTransaction,
                                ).toLocaleTimeString()}
                              </div>
                            )}
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
                                      openMenuId === wallet.id
                                        ? null
                                        : wallet.id,
                                    )
                                  }
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </IconButton>

                                {openMenuId === wallet.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenMenuId(null)}
                                    />

                                    <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Eye className="w-4 h-4 text-gray-500" />
                                        View Details
                                      </button>

                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Activity className="w-4 h-4 text-gray-500" />
                                        Transaction History
                                      </button>

                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Shield className="w-4 h-4 text-gray-500" />
                                        Manage Restrictions
                                      </button>

                                      <div className="border-t border-gray-100 my-1" />

                                      {wallet.isActive ? (
                                        <button
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-orange-600"
                                          onClick={() => setOpenMenuId(null)}
                                        >
                                          <Ban className="w-4 h-4" />
                                          Deactivate Wallet
                                        </button>
                                      ) : (
                                        <button
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600"
                                          onClick={() => setOpenMenuId(null)}
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          Activate Wallet
                                        </button>
                                      )}

                                      <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Download className="w-4 h-4 text-gray-500" />
                                        Export Data
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
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Restrictions Tab Content */}
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
              onClick={handleCreateRestriction}
            >
              Add Restriction
            </Button>
          </div>

          {/* Restrictions Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <KPICard
              title="Total Restrictions"
              value={restrictionStats.totalRestrictions.toLocaleString()}
              label="All restrictions"
              trend={{
                direction: "up",
                value: "+3%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Active"
              value={restrictionStats.activeRestrictions.toLocaleString()}
              label="With remaining funds"
              trend={{
                direction: "up",
                value: "+5%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Exhausted"
              value={restrictionStats.exhaustedRestrictions.toLocaleString()}
              label="Fully utilized"
              trend={{
                direction: "down",
                value: "-2%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Unused"
              value={restrictionStats.unusedRestrictions.toLocaleString()}
              label="No transactions yet"
              trend={{
                direction: "down",
                value: "-10%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Total Allocated"
              value={`${(restrictionStats.totalAllocated / 1000).toFixed(0)}K`}
              label="RWF allocated"
              trend={{
                direction: "up",
                value: "+8%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Total Used"
              value={`${(restrictionStats.totalUsed / 1000).toFixed(0)}K`}
              label="RWF consumed"
              trend={{
                direction: "up",
                value: "+12%",
                timeframe: "last month",
              }}
            />

            <KPICard
              title="Remaining"
              value={`${(restrictionStats.totalRemaining / 1000).toFixed(0)}K`}
              label="RWF available"
              trend={{
                direction: "up",
                value: "+5%",
                timeframe: "last month",
              }}
            />
          </div>

          {/* Restrictions Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search restrictions
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Owner, category name..."
                      value={restrictionSearchTerm}
                      onChange={(e) => setRestrictionSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Religious">Religious</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Energy">Energy</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
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

          {/* Restrictions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Restrictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {restrictionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading restrictions...
                    </span>
                  </div>
                ) : restrictionsError ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                    <p className="text-red-600 font-medium">
                      {restrictionsError}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : displayRestrictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Shield className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">
                      No restrictions found
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Try adjusting your filters
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wallet Owner</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>
                          <div
                            className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                            onClick={() => handleRestrictionSort("amount")}
                          >
                            Allocated
                            {restrictionSortField === "amount" && (
                              <span className="text-xs">
                                {restrictionSortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Usage Progress</TableHead>
                        <TableHead>
                          <div
                            className="cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-1 -m-2 p-2 rounded"
                            onClick={() =>
                              handleRestrictionSort("transactionCount")
                            }
                          >
                            Transactions
                            {restrictionSortField === "transactionCount" && (
                              <span className="text-xs">
                                {restrictionSortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRestrictions.map((restriction, index) => {
                        const originalRestriction = restrictions[index];
                        const usagePercentage = getRestrictionProgress(
                          restriction.usedAmount,
                          restriction.amount,
                        );
                        return (
                          <TableRow
                            key={restriction.id}
                            className="group hover:bg-gray-50"
                          >
                            <TableCell>
                              <div>
                                <TableMainText className="font-medium">
                                  {restriction.walletOwner}
                                </TableMainText>
                                <TableSubText className="text-xs text-gray-500">
                                  Wallet: {restriction.walletId}
                                </TableSubText>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium">
                                  {restriction.categoryName}
                                </div>
                                {restriction.categoryDescription && (
                                  <div className="text-xs text-gray-500 max-w-xs truncate">
                                    {restriction.categoryDescription}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {restriction.amount.toLocaleString()} RWF
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {restriction.usedAmount.toLocaleString()} RWF
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`text-sm font-medium ${
                                  restriction.remainingAmount > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {restriction.remainingAmount.toLocaleString()}{" "}
                                RWF
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="w-full space-y-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${getProgressColor(usagePercentage)}`}
                                    style={{
                                      width: `${Math.min(usagePercentage, 100)}%`,
                                    }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500">
                                  {usagePercentage.toFixed(1)}% used
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="info" size="sm">
                                {restriction.transactionCount}{" "}
                                {restriction.transactionCount === 1
                                  ? "txn"
                                  : "txns"}
                              </Badge>
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
                                        openMenuId === restriction.id
                                          ? null
                                          : restriction.id,
                                      )
                                    }
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </IconButton>

                                  {openMenuId === restriction.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenMenuId(null)}
                                      />

                                      <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                        <button
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                          onClick={() => setOpenMenuId(null)}
                                        >
                                          <Eye className="w-4 h-4 text-gray-500" />
                                          View Details
                                        </button>

                                        <button
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            handleEditRestriction(
                                              originalRestriction,
                                            );
                                          }}
                                        >
                                          <Edit className="w-4 h-4 text-gray-500" />
                                          Edit Restriction
                                        </button>

                                        <button
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                          onClick={() => setOpenMenuId(null)}
                                        >
                                          <Activity className="w-4 h-4 text-gray-500" />
                                          View Transactions
                                        </button>

                                        <div className="border-t border-gray-100 my-1" />

                                        {restriction.remainingAmount > 0 ? (
                                          <button
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-blue-600"
                                            onClick={() => {
                                              setOpenMenuId(null);
                                              handleEditRestriction(
                                                originalRestriction,
                                              );
                                            }}
                                          >
                                            <DollarSign className="w-4 h-4" />
                                            Adjust Amount
                                          </button>
                                        ) : (
                                          <button
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-green-600"
                                            onClick={() => setOpenMenuId(null)}
                                          >
                                            <RefreshCw className="w-4 h-4" />
                                            Reset Restriction
                                          </button>
                                        )}

                                        {restriction.transactionCount === 0 && (
                                          <button
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-red-600"
                                            onClick={() => {
                                              setOpenMenuId(null);
                                              handleDeleteRestriction(
                                                restriction.id,
                                              );
                                            }}
                                            disabled={
                                              deletingRestrictionId ===
                                              restriction.id
                                            }
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            {deletingRestrictionId ===
                                            restriction.id
                                              ? "Deleting..."
                                              : "Remove Restriction"}
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </TableActions>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Shared Pagination */}
      {activeTab === "wallets" &&
        !walletsLoading &&
        !walletsError &&
        displayWallets.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalWalletsCount)} of{" "}
              {totalWalletsCount} results
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
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
                        onClick={() => handlePageChange(page)}
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
                  handlePageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      {/* Restrictions Pagination */}
      {activeTab === "restrictions" &&
        !restrictionsLoading &&
        !restrictionsError &&
        displayRestrictions.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalRestrictionsCount)} of{" "}
              {totalRestrictionsCount} results
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: restrictionPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === restrictionPages ||
                      Math.abs(page - currentPage) <= 1,
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
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
                  handlePageChange(Math.min(restrictionPages, currentPage + 1))
                }
                disabled={currentPage === restrictionPages}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      {/* Restriction Modal */}
      <RestrictionModal
        isOpen={isRestrictionModalOpen}
        onClose={() => {
          setIsRestrictionModalOpen(false);
          setSelectedRestriction(null);
        }}
        onSuccess={handleModalSuccess}
        restriction={selectedRestriction}
        wallets={walletsForDropdown}
        categories={categories}
      />
    </div>
  );
}
