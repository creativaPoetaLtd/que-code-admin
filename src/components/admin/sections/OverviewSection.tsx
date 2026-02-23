"use client";

import { useEffect, useMemo, useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import KPICard, { Sparkline, MiniKPI } from "../KPICard";
import AlertsList, { mockAlerts } from "../AlertsList";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/Table";
import { FlowChart, TransactionChart } from "../charts/Charts";
import adminAPI from "@/services/adminService";
import {
  DashboardFlowSummaryItem,
  DashboardRange,
  DashboardStatisticsData,
} from "@/types/admin.types";

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

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
        text: `↑ ${item.trendPercent.toFixed(1)}%`,
        variant: "success" as const,
      };
    if (item.trendPercent < 0)
      return {
        text: `↓ ${Math.abs(item.trendPercent).toFixed(1)}%`,
        variant: "danger" as const,
      };
    return { text: "→ Stable", variant: "warning" as const };
  }

  if (typeof item.trendPoints === "number") {
    if (item.trendPoints > 0)
      return {
        text: `↑ ${item.trendPoints.toFixed(1)} pt`,
        variant: "warning" as const,
      };
    if (item.trendPoints < 0)
      return {
        text: `↓ ${Math.abs(item.trendPoints).toFixed(1)} pt`,
        variant: "success" as const,
      };
    return { text: "→ Stable", variant: "warning" as const };
  }

  return { text: "—", variant: "muted" as const };
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

export default function OverviewSection() {
  const [range, setRange] = useState<DashboardRange>("7d");
  const [stats, setStats] = useState<DashboardStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getDashboardStatistics({ range });
        if (response?.success && response?.data) {
          setStats(response.data);
        } else {
          setError("Failed to load dashboard analytics");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load dashboard analytics",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, [range]);

  const chartLabels = useMemo(
    () =>
      stats?.charts.transactionsDisputes.labels || [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ],
    [stats],
  );

  const rangeLabel =
    RANGE_OPTIONS.find((option) => option.value === range)?.label ||
    "Last 7 days";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <div className="h-10 w-40 rounded-lg bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 rounded-2xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent>
          <div className="py-12 text-center">
            <p className="text-sm text-red-600">
              {error || "Unable to load dashboard analytics"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          value={range}
          onChange={(event) => setRange(event.target.value as DashboardRange)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Users"
          value={stats.kpis.totalUsers.total}
          label={`${formatNumber(stats.kpis.totalUsers.verified)} verified in ${rangeLabel.toLowerCase()}`}
          // badge={{
          //   text: `${formatNumber(stats.kpis.totalUsers.newInRange)} in period`,
          //   variant: "success",
          // }}
          trend={{
            direction: stats.kpis.totalUsers.trendPercent >= 0 ? "up" : "down",
            value: formatPercent(stats.kpis.totalUsers.trendPercent),
            timeframe: rangeLabel.toLowerCase(),
          }}
          sparkline={
            <Sparkline type="users" points={stats.charts.sparklines.users} />
          }
        />

        <KPICard
          title="Organizations"
          value={stats.kpis.organizations.total}
          label={`In ${rangeLabel.toLowerCase()} period`}
          // badge={{
          //   text: `${formatNumber(stats.kpis.organizations.pending)} pending`,
          //   variant: "warning",
          // }}
          trend={{
            direction:
              stats.kpis.organizations.trendPercent >= 0 ? "up" : "down",
            value: formatPercent(stats.kpis.organizations.trendPercent),
            timeframe: rangeLabel.toLowerCase(),
          }}
          sparkline={
            <Sparkline
              type="orgs"
              points={stats.charts.sparklines.organizations}
            />
          }
        />

        <KPICard
          title="Volume"
          value={formatCurrency(
            stats.kpis.volume.totalInRange,
            stats.meta.currency,
          )}
          label="Wallet → wallet, pay, votes, donations"
          // badge={{ text: "Live", variant: "live" }}
          trend={{
            direction: stats.kpis.volume.trendPercent >= 0 ? "up" : "down",
            value: formatPercent(stats.kpis.volume.trendPercent),
            timeframe: rangeLabel.toLowerCase(),
          }}
          sparkline={
            <Sparkline type="volume" points={stats.charts.sparklines.volume} />
          }
        />

        <KPICard
          title="Risk / fraud"
          value={`${stats.kpis.riskFraud.ratePercent.toFixed(2)}%`}
          label="Transactions flagged in selected range"
          trend={{
            direction: stats.kpis.riskFraud.trendPoints >= 0 ? "up" : "down",
            value: formatPoints(stats.kpis.riskFraud.trendPoints),
            timeframe: "vs previous period",
          }}
          sparkline={
            <Sparkline type="risk" points={stats.charts.sparklines.risk} />
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Transactions</CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Wallet → wallet, pay, donations, votes (
                {rangeLabel.toLowerCase()})
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-green-400 to-green-600"></span>
                Transactions
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-orange-400 to-orange-600"></span>
                Disputes
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionChart
              labels={chartLabels}
              transactions={
                stats.charts.transactionsDisputes.datasets.transactions
              }
              disputes={stats.charts.transactionsDisputes.datasets.disputes}
            />
            <p className="text-xs text-slate-400 mt-3">
              Suspicious or blocked flows are excluded from the main curve and
              visible in the risk engine.
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
                        : formatNumber(Number(item.today))}
                    </TableCell>
                    <TableCell>
                      {item.key.includes("rate") || item.key.includes("blocked")
                        ? `${Number(item.rangeTotal).toFixed(2)}%`
                        : formatNumber(Number(item.rangeTotal))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trendBadge.variant} size="sm">
                        {trendBadge.text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(item.status)} size="sm">
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                value={formatNumber(stats.counts.wallets.total)}
                meta={`${formatNumber(stats.counts.wallets.active)} active in ${rangeLabel.toLowerCase()}`}
              />
              <MiniKPI
                label="Completed transactions"
                value={formatNumber(stats.counts.transactions.completed)}
                meta={`In ${rangeLabel.toLowerCase()} period`}
              />
              <MiniKPI
                label="Pending transactions"
                value={formatNumber(stats.counts.transactions.pending)}
                meta={`Pending in ${rangeLabel.toLowerCase()}`}
              />
              <MiniKPI
                label="Failed / cancelled"
                value={formatNumber(
                  stats.counts.transactions.failedOrCancelled,
                )}
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
    </div>
  );
}
