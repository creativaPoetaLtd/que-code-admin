"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import Card, { CardHeader, CardTitle, CardContent } from "./ui/Card";
import Badge from "./ui/Badge";

interface KPICardProps {
  title: string;
  value: string | number;
  label: string;
  trend?: {
    direction: "up" | "down";
    value: string;
    timeframe: string;
  };
  badge?: {
    text: string;
    variant?: "default" | "success" | "warning" | "danger" | "live";
  };
  sparkline?: ReactNode;
  className?: string;
}

export default function KPICard({
  title,
  value,
  label,
  trend,
  badge,
  sparkline,
  className,
}: KPICardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {badge && (
          <Badge variant={badge.variant || "default"} size="sm">
            {badge.text}
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-end justify-between gap-2 mt-2">
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
            <div className="text-xs text-gray-500 mb-2">{label}</div>
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs",
                  trend.direction === "up" ? "text-green-600" : "text-red-600",
                )}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {trend.value} vs {trend.timeframe}
                </span>
              </div>
            )}
          </div>

          {sparkline && <div className="shrink sm:shrink-0">{sparkline}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// Sparkline component
interface SparklineProps {
  type?: "users" | "orgs" | "volume" | "risk";
  className?: string;
  points?: number[];
}

export function Sparkline({
  type = "users",
  className,
  points,
}: SparklineProps) {
  const sparklineStyles = {
    users: "from-green-500/40 to-amber-500/10 bg-gradient-to-br",
    orgs: "from-blue-500/40 to-purple-500/10 bg-gradient-to-br",
    volume: "from-emerald-500/40 to-cyan-500/10 bg-gradient-to-br",
    risk: "from-orange-500/40 to-red-500/10 bg-gradient-to-br",
  };

  const defaultPoints = [20, 15, 18, 8, 12, 6, 10, 4, 8];
  const values = points && points.length > 0 ? points : defaultPoints;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const xStep = values.length > 1 ? 76 / (values.length - 1) : 76;
  const normalizeY = (value: number) => {
    if (max === min) return 14;
    return 4 + ((max - value) / (max - min)) * 18;
  };

  const linePath = values
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"} ${2 + index * xStep} ${normalizeY(value)}`,
    )
    .join(" ");

  const areaPath = `${linePath} L 78 26 L 2 26 Z`;

  return (
    <div
      className={cn(
        "w-16 sm:w-20 h-7 rounded-lg overflow-hidden relative flex-shrink-0",
        sparklineStyles[type],
        className,
      )}
    >
      <div className="absolute inset-1 rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80">
        <svg className="w-full h-full" viewBox="0 0 80 28" fill="none">
          <path
            d={linePath}
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            className="text-white/80"
          />
          <path d={areaPath} fill="currentColor" className="text-white/30" />
        </svg>
      </div>
    </div>
  );
}

// Mini KPI for smaller cards
interface MiniKPIProps {
  label: string;
  value: string | number;
  meta?: string;
  className?: string;
}

export function MiniKPI({ label, value, meta, className }: MiniKPIProps) {
  return (
    <div
      className={cn(
        "p-2.5 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white",
        className,
      )}
    >
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900 mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {meta && <div className="text-xs text-gray-500">{meta}</div>}
    </div>
  );
}
