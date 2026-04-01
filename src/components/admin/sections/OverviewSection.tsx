"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import KPICard, { Sparkline, MiniKPI } from "../KPICard";
import AlertsList, { mockAlerts } from "../AlertsList";
import Button from "../ui/Button";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import { FlowChart, TransactionChart } from "../charts/Charts";
import {
  RefreshCw,
  TrendingUp,
  ArrowRightLeft,
  AlertCircle,
  Bell,
  Users,
  Building,
  UsersRound,
  Wallet,
} from "lucide-react";
import adminAPI from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  DashboardFlowSummaryItem,
  DashboardRange,
  DashboardStatisticsData,
  PlatformAnalytics,
  PlatformAnalyticsResponse,
} from "@/types/admin.types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

// Analytics-only range labels (no "today" option in platform analytics API)
const ANALYTICS_RANGE_MAP: Record<string, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

const formatNumber = (value: number) => value.toLocaleString();

const formatCurrency = (value: number, currency = "RWF") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const formatPoints = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)} pts`;

const getTrendBadge = (item: DashboardFlowSummaryItem) => {
  if (typeof item.trendPercent === "number") {
    if (item.trendPercent > 0)
      return {
        text: `â†‘ ${item.trendPercent.toFixed(1)}%`,
        variant: "success" as const,
      };
    if (item.trendPercent < 0)
      return {
        text: `â†“ ${Math.abs(item.trendPercent).toFixed(1)}%`,
        variant: "danger" as const,
      };
    return { text: "â†’ Stable", variant: "warning" as const };
  }

  if (typeof item.trendPoints === "number") {
    if (item.trendPoints > 0)
      return {
        text: `â†‘ ${item.trendPoints.toFixed(1)} pt`,
        variant: "warning" as const,
      };
    if (item.trendPoints < 0)
      return {
        text: `â†“ ${Math.abs(item.trendPoints).toFixed(1)} pt`,
        variant: "success" as const,
      };
    return { text: "â†’ Stable", variant: "warning" as const };
  }

  return { text: "â€”", variant: "muted" as const };
};

const getStatusVariant = (
  status: string,
): "success" | "warning" | "danger" | "muted" => {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("ok") ||
    normalized.includes("healthy") ||
    normalized.includes("normal")
  )
    return "success";
  if (
    normalized.includes("monitor") ||
    normalized.includes("review") ||
    normalized.includes("stable")
  )
    return "warning";
  if (normalized.includes("risk") || normalized.includes("alert"))
    return "danger";
  return "muted";
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { mode: "index" as const, intersect: false },
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: "#f3f4f6" }, beginAtZero: true },
  },
};

export default function OverviewSection() {
  const { toast } = useToast();
  const [range, setRange] = useState<DashboardRange>("7d");

  // Dashboard (overview) state
  const [stats, setStats] = useState<DashboardStatisticsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Platform analytics state
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Derive analytics-compatible range (today â†’ 7d)
  const analyticsRange = (range === "today" || range === "custom") ? "7d" : range as "7d" | "30d" | "90d" | "12m";

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await adminAPI.getDashboardStatistics({ range });
      if (response?.success && response?.data) setStats(response.data);
      else setStatsError("Failed to load dashboard analytics");
    } catch (err: any) {
      setStatsError(err?.response?.data?.message || "Failed to load dashboard analytics");
    } finally {
      setStatsLoading(false);
    }
  }, [range]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = (await adminAPI.getPlatformAnalytics(analyticsRange)) as PlatformAnalyticsResponse;
      setAnalytics(res.data);
    } catch {
      toast({ title: "Error", description: "Failed to load platform analytics", variant: "destructive" });
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange, toast]);

  useEffect(() => {
    loadStats();
    loadAnalytics();
  }, [loadStats, loadAnalytics]);

  const loading = statsLoading || analyticsLoading;

  const chartLabels = useMemo(
    () =>
      stats?.charts.transactionsDisputes.labels || [
        "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
      ],
    [stats],
  );

  const rangeLabel =
    RANGE_OPTIONS.find((o) => o.value === range)?.label || "Last 7 days";
  const analyticsRangeLabel = ANALYTICS_RANGE_MAP[analyticsRange] ?? rangeLabel;

  // Chart.js datasets from analytics
  const chartPoints = analytics?.charts?.dailyVolume ?? [];

  const volumeChart = chartPoints.length > 0
    ? {
        labels: chartPoints.map((p) => p.day),
        datasets: [{
          label: "Volume",
          data: chartPoints.map((p) => p.volume),
          fill: true,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.08)",
          tension: 0.4,
          pointRadius: 3,
        }],
      }
    : null;

  const txCountChart = chartPoints.length > 0
    ? {
        labels: chartPoints.map((p) => p.day),
        datasets: [{
          label: "Transactions",
          data: chartPoints.map((p) => p.count),
          backgroundColor: "#22c55e",
          borderRadius: 4,
        }],
      }
    : null;

  const txByTypeChart = analytics
    ? {
        labels: Object.keys(analytics.transactions.byType),
        datasets: [{
          label: "Count",
          data: Object.values(analytics.transactions.byType).map((v) => v.count),
          backgroundColor: ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#d1fae5"],
          borderRadius: 4,
        }],
      }
    : null;

  // â”€â”€ Loading skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (statsLoading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <Card>
        <CardContent>
          <div className="py-12 text-center">
            <p className="text-sm text-red-600">{statsError || "Unable to load dashboard analytics"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range selector + Refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as DashboardRange)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button
          variant="default"
          size="sm"
          onClick={() => { loadStats(); loadAnalytics(); }}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* â”€â”€ Section: Overview KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Users"
          value={stats.kpis.totalUsers.total}
          label={`${stats.kpis.totalUsers.verified.toLocaleString()} verified in ${rangeLabel.toLowerCase()}`}
          trend={{
            direction: stats.kpis.totalUsers.trendPercent >= 0 ? "up" : "down",
            value: `${stats.kpis.totalUsers.trendPercent >= 0 ? "+" : ""}${stats.kpis.totalUsers.trendPercent.toFixed(2)}%`,
            timeframe: rangeLabel.toLowerCase(),
          }}
          sparkline={<Sparkline type="users" points={stats.charts.sparklines.users} />}
        />
        <KPICard
          title="Organizations"
          value={stats.kpis.organizations.total}
          label={`In ${rangeLabel.toLowerCase()} period`}
          trend={{
            direction: stats.kpis.organizations.trendPercent >= 0 ? "up" : "down",
            value: `${stats.kpis.organizations.trendPercent >= 0 ? "+" : ""}${stats.kpis.organizations.trendPercent.toFixed(2)}%`,
            timeframe: rangeLabel.toLowerCase(),
          }}
          sparkline={<Sparkline type="orgs" points={stats.charts.sparklines.organizations} />}
        />
        <KPICard
          title="Volume"
          value={new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: stats.meta.currency,
            maximumFractionDigits: 0,
          }).format(stats.kpis.volume.totalInRange || 0)}
          label="Wallet â†’ wallet, pay, votes, donations"
          trend={{
            direction: stats.kpis.volume.trendPercent >= 0 ? "up" : "down",
            value: `${stats.kpis.volume.trendPercent >= 0 ? "+" : ""}${stats.kpis.volume.trendPercent.toFixed(2)}%`,
            timeframe: rangeLabel.toLowerCase(),
          }}
          sparkline={<Sparkline type="volume" points={stats.charts.sparklines.volume} />}
        />
        <KPICard
          title="Risk / fraud"
          value={`${stats.kpis.riskFraud.ratePercent.toFixed(2)}%`}
          label="Transactions flagged in selected range"
          trend={{
            direction: stats.kpis.riskFraud.trendPoints >= 0 ? "up" : "down",
            value: `${stats.kpis.riskFraud.trendPoints >= 0 ? "+" : ""}${stats.kpis.riskFraud.trendPoints.toFixed(2)} pts`,
            timeframe: "vs previous period",
          }}
          sparkline={<Sparkline type="risk" points={stats.charts.sparklines.risk} />}
        />
      </div>

      {/* â”€â”€ Section: Platform analytics KPIs â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={analyticsLoading ? "â€”" : analytics?.users.total ?? 0}
          label={analyticsLoading ? "" : `${analytics?.users.verified ?? 0} verified`}
        />
        <KPICard
          title="Groups"
          value={analyticsLoading ? "â€”" : analytics?.groups.total ?? 0}
          label={analyticsLoading ? "" : `${analytics?.groups.withWallets ?? 0} with wallets`}
        />
        <KPICard
          title="Active Wallets"
          value={analyticsLoading ? "â€”" : analytics?.wallets.active ?? 0}
          label={analyticsLoading ? "" : `$${Number(analytics?.wallets.totalBalance ?? 0).toLocaleString()} total`}
        />
        <KPICard
          title="Failed Transactions"
          value={analyticsLoading ? "â€”" : analytics?.transactions.byStatus?.["failed"]?.count ?? 0}
          label={analyticsLoading ? "" : "need review"}
        />
      </div>

      {/* â”€â”€ Section: Transactions chart + Alerts â”€â”€â”€ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Transactions</CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Wallet â†’ wallet, pay, donations, votes ({rangeLabel.toLowerCase()})
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-green-400 to-green-600" />
                Transactions
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-orange-400 to-orange-600" />
                Disputes
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionChart
              labels={chartLabels}
              transactions={stats.charts.transactionsDisputes.datasets.transactions}
              disputes={stats.charts.transactionsDisputes.datasets.disputes}
            />
            <p className="text-xs text-slate-400 mt-3">
              Suspicious or blocked flows are excluded from the main curve and visible in the risk engine.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live alerts</CardTitle>
            <Badge variant="warning">Security & disputes</Badge>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={mockAlerts} />
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ Section: Daily volume & TX count charts â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Transaction Volume Â· {analyticsRangeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {analyticsLoading ? (
                <div className="h-full bg-gray-50 rounded-lg animate-pulse" />
              ) : volumeChart ? (
                <Line data={volumeChart} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-green-600" />
              Transaction Count Â· {analyticsRangeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {analyticsLoading ? (
                <div className="h-full bg-gray-50 rounded-lg animate-pulse" />
              ) : txCountChart ? (
                <Bar data={txCountChart} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ Section: Flow Summary table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow</TableHead>
                <TableHead>Today</TableHead>
                <TableHead>{rangeLabel}</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.table.flowSummary.map((item) => {
                const trendBadge = getTrendBadge(item);
                return (
                  <TableRow key={item.key}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>
                      {item.key.includes("rate") || item.key.includes("blocked")
                        ? `${Number(item.today).toFixed(2)}%`
                        : Number(item.today).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {item.key.includes("rate") || item.key.includes("blocked")
                        ? `${Number(item.rangeTotal).toFixed(2)}%`
                        : Number(item.rangeTotal).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trendBadge.variant} size="sm">{trendBadge.text}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status)} size="sm">{item.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* â”€â”€ Section: TX by type + Top senders â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transactions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                    <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
                  </div>
                ))}
              </div>
            ) : analytics && Object.keys(analytics.transactions.byType).length > 0 ? (
              <>
                <div className="h-44 mb-4">
                  {txByTypeChart && (
                    <Bar data={txByTypeChart} options={{ ...chartOptions, indexAxis: "y" as const }} />
                  )}
                </div>
                <div className="space-y-2">
                  {Object.entries(analytics.transactions.byType).map(([type, entry]) => {
                    const total = analytics.transactions.completedInRange;
                    const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                    return (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-24 capitalize">{type}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-10 text-right">{entry.count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                No transaction data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Senders</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                  </div>
                ))}
              </div>
            ) : analytics && analytics.wallets.topSenders.length > 0 ? (
              <div className="space-y-3">
                {analytics.wallets.topSenders.slice(0, 8).map((s, idx) => (
                  <div key={s.walletId} className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-gray-400 text-center">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                      {s.owner?.firstName?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.owner ? `${s.owner.firstName} ${s.owner.lastName}` : s.walletId.slice(0, 12) + "â€¦"}
                      </p>
                      <p className="text-xs text-gray-400">{s.txCount.toLocaleString()} transactions</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-800">${Number(s.totalSent).toLocaleString()}</p>
                      <Badge variant="info" className="text-[10px]">sent</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                No sender data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ Section: Financial snapshot + Flow chart  */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Financial snapshot</CardTitle>
            <Badge variant="warning">Internal view only</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MiniKPI
                label="Wallets"
                value={stats.counts.wallets.total.toLocaleString()}
                meta={`${stats.counts.wallets.active.toLocaleString()} active in ${rangeLabel.toLowerCase()}`}
              />
              <MiniKPI
                label="Completed transactions"
                value={stats.counts.transactions.completed.toLocaleString()}
                meta={`In ${rangeLabel.toLowerCase()} period`}
              />
              <MiniKPI
                label="Pending transactions"
                value={stats.counts.transactions.pending.toLocaleString()}
                meta={`Pending in ${rangeLabel.toLowerCase()}`}
              />
              <MiniKPI
                label="Failed / cancelled"
                value={stats.counts.transactions.failedOrCancelled.toLocaleString()}
                meta={`In ${rangeLabel.toLowerCase()} period`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Flow by type</CardTitle>
          </CardHeader>
          <CardContent>
            <FlowChart
              labels={stats.charts.flowByType.labels}
              series={stats.charts.flowByType.series}
            />
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ Section: Verification & org & wallet breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Verification</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between">
                    <StatSkeleton /><StatSkeleton />
                  </div>
                ))}
              </div>
            ) : analytics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verified</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${analytics.users.total > 0 ? (analytics.users.verified / analytics.users.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{analytics.users.verified.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unverified</span>
                  <span className="text-sm font-semibold">{analytics.users.unverified.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New ({analyticsRangeLabel})</span>
                  <Badge variant="success">{analytics.users.newInRange}</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Organization Status</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between"><StatSkeleton /><StatSkeleton /></div>
                ))}
              </div>
            ) : analytics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active</span>
                  <Badge variant="success">{analytics.organizations.active}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Badge variant="warning">{analytics.organizations.pending}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-sm font-semibold">{analytics.organizations.total}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Wallet Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between"><StatSkeleton /><StatSkeleton /></div>
                ))}
              </div>
            ) : analytics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active</span>
                  <Badge variant="success">{analytics.wallets.active}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inactive</span>
                  <Badge variant="muted">{analytics.wallets.inactive}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Balance</span>
                  <span className="text-sm font-semibold text-green-700">
                    ${Number(analytics.wallets.totalBalance).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />;
}
