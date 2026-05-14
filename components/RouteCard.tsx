"use client";

import Image from "next/image";
import { ArrowRight, ChevronDown, Medal, Star, Trophy } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";

import { LegBreakdown } from "@/components/LegBreakdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatAmount, getCurrencyFlag } from "@/lib/formatting";
import type { CandidateRoute } from "@/lib/types";

interface RouteCardProps {
  route: CandidateRoute;
  directAmount?: number;
  autoOpen?: boolean;
}

  const RANK_CONFIG = {
  1: {
    accentBar: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
    cardClass: "border-emerald-500/30",
    badgeClass: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300",
    amountClass: "text-emerald-400",
    icon: Trophy,
    iconClass: "text-emerald-400",
    pillClass: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25",
    pillLabel: "Best Route",
  },
  2: {
    accentBar: "linear-gradient(90deg, #06b6d4 0%, #67e8f9 100%)",
    cardClass: "border-[#2b3139]",
    badgeClass: "bg-cyan-500/12 border border-cyan-500/30 text-cyan-300",
    amountClass: "text-cyan-400",
    icon: Medal,
    iconClass: "text-cyan-400",
    pillClass: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/25",
    pillLabel: "2nd",
  },
  3: {
    accentBar: "linear-gradient(90deg, #2b3139 0%, #3d4553 100%)",
    cardClass: "border-[#2b3139]",
    badgeClass: "bg-[#1e2329] border border-[#2b3139] text-[#848e9c]",
    amountClass: "text-[#eaecef]",
    icon: Star,
    iconClass: "text-[#848e9c]",
    pillClass: "text-[#848e9c] bg-[#1e2329] border border-[#2b3139]",
    pillLabel: "3rd",
  },
} as const;

function getRankConfig(rank: number) {
  return RANK_CONFIG[rank as keyof typeof RANK_CONFIG] ?? RANK_CONFIG[3];
}

export function RouteCard({ route, directAmount, autoOpen }: RouteCardProps) {
  const targetCurrency = route.path[route.path.length - 1];
  const feeEntries = Object.entries(route.totalFeesByCurrency);
  const cfg = getRankConfig(route.rank);
  const RankIcon = cfg.icon;

  const isDirectRoute = route.legs.length === 1;
  const delta =
    directAmount !== undefined && !isDirectRoute
      ? route.finalAmount - directAmount
      : undefined;

  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!autoOpen) return;
    const timer = setTimeout(() => {
      if (detailsRef.current) {
        detailsRef.current.open = true;
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [autoOpen]);

  return (
    <Card className={"overflow-hidden " + cfg.cardClass}>
      <div style={{ height: "2px", background: cfg.accentBar }} />

      <CardContent className="pt-4 pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className={"flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono-trading text-[10px] font-bold tracking-wider " + cfg.badgeClass}>
                <RankIcon className={"h-3 w-3 " + cfg.iconClass} />
                #{route.rank}
              </div>
              <span className={"text-2xl font-bold tabular-nums tracking-tight " + cfg.amountClass}>
                {formatAmount(route.finalAmount, targetCurrency)}
              </span>
              {delta !== undefined && (
                <span
                  className={
                    "text-xs font-semibold rounded px-2 py-0.5 " +
                    (delta >= 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400")
                  }
                >
                  {delta >= 0 ? "+" : ""}{formatAmount(delta, targetCurrency)} vs direct
                </span>
              )}
              {route.rank === 1 && (
                <span className={"rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-[0.2em] uppercase " + cfg.pillClass}>
                  {cfg.pillLabel}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className="font-mono-trading rounded-md border border-slate-600/60 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                {getCurrencyFlag(route.legs[0]?.from) && (
                  <Image src={getCurrencyFlag(route.legs[0].from)!} alt={route.legs[0].from} width={16} height={16} className="rounded-sm object-cover" />
                )}
                {route.legs[0]?.from}
              </span>
              {route.legs.map((leg) => (
                <Fragment key={`${leg.provider}-${leg.from}-${leg.to}`}>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
                  <span
                    className={
                      "font-mono-trading rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide " +
                      (leg.providerType === "fiat_broker"
                        ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-400"
                        : "border-violet-500/25 bg-violet-500/10 text-violet-400")
                    }
                  >
                    {leg.provider}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
                  <span className="font-mono-trading rounded-md border border-slate-600/60 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                    {getCurrencyFlag(leg.to) && (
                      <Image src={getCurrencyFlag(leg.to)!} alt={leg.to} width={16} height={16} className="rounded-sm object-cover" />
                    )}
                    {leg.to}
                  </span>
                </Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono-trading text-[9px] tracking-widest text-slate-500 border-slate-700">
                {route.legs.length} {route.legs.length === 1 ? "leg" : "legs"}
              </Badge>
              {route.legs.some((l) => l.providerType === "fiat_broker") && (
                <Badge variant="fiat" className="font-mono-trading text-[9px] tracking-widest">Fiat</Badge>
              )}
              {route.legs.some((l) => l.providerType === "stablecoin_venue") && (
                <Badge variant="stablecoin" className="font-mono-trading text-[9px] tracking-widest">Stablecoin</Badge>
              )}
            </div>
          </div>

      <div className="shrink-0 rounded-lg border border-[#2b3139] bg-[#0f1319] px-4 py-3 min-w-[148px]">
          <p className="text-[10px] font-medium text-[#848e9c] mb-2.5">Total Fees</p>
            <div className="space-y-1.5">
              {feeEntries.map(([currency, amt]) => (
                <div key={currency} className="flex items-center justify-between gap-4">
                  <span className="text-[11px] text-[#848e9c]">{currency}</span>
                  <span className="text-xs font-semibold text-[#eaecef] tabular-nums">
                    {formatAmount(amt, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <details ref={detailsRef} className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-[#1e2329] bg-[#0f1319] px-3 py-2 transition hover:border-[#2b3139]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#848e9c]">Execution Detail</span>
              <span className="text-[#2b3139] text-xs">·</span>
              <span className="text-xs text-[#848e9c]">
                {route.legs.length} {route.legs.length === 1 ? "leg" : "legs"}
              </span>
            </div>
            <ChevronDown className="chevron h-3.5 w-3.5 text-slate-600 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="details-content mt-2 mb-1">
            <LegBreakdown legs={route.legs} />
          </div>
        </details>
      </CardContent>
      <div className="h-4" />
    </Card>
  );
}
