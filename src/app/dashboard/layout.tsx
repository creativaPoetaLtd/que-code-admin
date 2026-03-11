"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { AdminModalsContainer } from "@/components/admin/AdminModalsContainer";

// View titles and subtitles
const viewConfig: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: "Super Admin overview",
    subtitle: "Global status of users, orgs, wallets & risk",
  },
  users: {
    title: "User management",
    subtitle:
      "Manage user accounts , monitor activity, and oversee verification and approval",
  },
  organizations: {
    title: "Organization management",
    subtitle: "Organizations management and oversight",
  },
  transactions: {
    title: "Transactions",
    subtitle: "Monitor payments, transfers, top-ups, and withdrawals",
  },
  financial: {
    title: "Wallet & Financial Management",
    subtitle: "Monitor wallets, restrictions, balances and financial flows",
  },
  disputes: {
    title: "Disputes & chargebacks",
    subtitle: "End-to-end view of open disputes and admin decisions",
  },
  actions: {
    title: "QC Pro actions management",
    subtitle: "Global view of tickets, donations, transport, votes",
  },
  merchants: {
    title: "Merchants",
    subtitle: "Shops, transport companies, ticketing & online merchants",
  },
  admins: {
    title: "Admin roles & access",
    subtitle:
      "Manage who controls QC: super admins, risk admins, finance admins",
  },
  config: {
    title: "Platform configuration",
    subtitle:
      "Feature flags, notification templates, gateways, payment providers",
  },
  logs: {
    title: "Audit logs",
    subtitle:
      "Every sensitive admin action is recorded for security and traceability",
  },
  support: {
    title: "Support center",
    subtitle: "Central inbox for user issues, disputes, merchant requests",
  },
  queries: {
    title: "User queries",
    subtitle: "Questions and requests sent by users from the app or web",
  },
  health: {
    title: "System health",
    subtitle: "Uptime, latency, error rate and background job queues",
  },
  security: {
    title: "Security & Compliance",
    subtitle: "Suspicious activity, IP blocks, KYC/AML, GDPR, AI monitoring",
  },
  settings: {
    title: "Settings",
    subtitle:
      "Global configuration for features, fees, branding, notifications",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  // Extract the active view from the URL path
  const getActiveView = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/")
      return "overview";
    const segments = pathname.split("/").filter(Boolean);
    return segments[1] || "overview";
  };

  const activeView = getActiveView();
  const currentView = viewConfig[activeView] || viewConfig.overview;

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex bg-gray-50 text-gray-900">
        <div className="w-64 bg-white border-r border-gray-200" />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 bg-white border-b border-gray-200" />
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <AdminModalsContainer>
      <div className="min-h-screen flex bg-gray-50 text-gray-900">
        <Sidebar
          activeView={activeView}
          isMobileOpen={isMobileOpen}
          onMobileToggle={handleMobileToggle}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            title={currentView.title}
            subtitle={currentView.subtitle}
            onMobileMenuToggle={handleMobileToggle}
          />

          <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminModalsContainer>
  );
}
