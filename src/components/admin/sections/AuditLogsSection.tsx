"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
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
} from "../ui/Table";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Activity,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import auditLogAPI from "@/services/auditLogService";
import {
  AuditLog,
  AuditLogFilters,
  AuditLogFilterOptions,
  AuditLogStatistics,
} from "@/types/admin.types";
import { useToast } from "@/hooks/use-toast";

export default function AuditLogsSection() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<AuditLogStatistics>({
    total: 0,
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
    last24h: 0,
    last7d: 0,
  });
  const [filterOptions, setFilterOptions] = useState<AuditLogFilterOptions>({
    actions: [],
    methods: [],
    levels: ["info", "warning", "error", "critical"],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 10,
    level: "all",
    method: "all",
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAuditLogs();
    loadFilterOptions();
  }, [filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await auditLogAPI.getAllAuditLogs(filters);
      setLogs(response.data);
      setStatistics(response.statistics);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(
        response.pagination.totalItems || response.pagination.total || 0,
      );
      setCurrentPage(
        response.pagination.currentPage || response.pagination.page || 1,
      );
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await auditLogAPI.getFilterOptions();
      setFilterOptions(response.data);
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 });
  };

  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setFilters({ ...filters, page: newPage });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "info":
        return <Info className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      case "critical":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getLevelVariant = (
    level: string,
  ): "info" | "warning" | "danger" | "default" => {
    switch (level) {
      case "info":
        return "info";
      case "warning":
        return "warning";
      case "error":
      case "critical":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusVariant = (
    status: number,
  ): "success" | "info" | "warning" | "danger" => {
    if (status >= 200 && status < 300) return "success";
    if (status >= 300 && status < 400) return "info";
    if (status >= 400 && status < 500) return "warning";
    return "danger";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const exportLogs = () => {
    // Convert logs to CSV
    const headers = [
      "Timestamp",
      "Action",
      "Method",
      "Endpoint",
      "User",
      "Status",
      "Level",
      "Duration (ms)",
      "IP Address",
    ];
    const csv = [
      headers.join(","),
      ...logs.map((log) =>
        [
          new Date(log.createdAt).toISOString(),
          log.action,
          log.method,
          log.endpoint,
          log.user ? `${log.user.firstName} ${log.user.lastName}` : "N/A",
          log.statusCode,
          log.level,
          log.duration || "N/A",
          log.ipAddress || "N/A",
        ].join(","),
      ),
    ].join("\\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Logs"
          value={statistics.total.toLocaleString()}
          label="All audit log entries"
        />
        <KPICard
          title="Info Events"
          value={statistics.info.toLocaleString()}
          label="Informational events"
          badge={{ text: "Info", variant: "default" }}
        />
        <KPICard
          title="Warnings"
          value={statistics.warning.toLocaleString()}
          label="Warning events"
          badge={{ text: "Warning", variant: "warning" }}
        />
        <KPICard
          title="Errors"
          value={(statistics.error + statistics.critical).toLocaleString()}
          label="Error & critical events"
          badge={{ text: "Errors", variant: "danger" }}
        />
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Last 24h:</span>
              <span className="font-semibold">
                {statistics.last24h.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Last 7 days:</span>
              <span className="font-semibold">
                {statistics.last7d.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Audit Logs</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={loadAuditLogs}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={exportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search endpoint, action, IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange("level", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>

              <select
                value={filters.method}
                onChange={(e) => handleFilterChange("method", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>

              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Logs Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TableMainText>{log.action}</TableMainText>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="font-mono text-xs"
                          >
                            {log.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-gray-600">
                            {log.endpoint}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {log.user.firstName} {log.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {log.user.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(log.statusCode)}>
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getLevelVariant(log.level)}
                            className="flex items-center gap-1 w-fit"
                          >
                            {getLevelIcon(log.level)}
                            <span className="uppercase text-xs">
                              {log.level}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600">
                            {log.duration ? `${log.duration}ms` : "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {log.ipAddress || "N/A"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                  {totalCount} results
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
