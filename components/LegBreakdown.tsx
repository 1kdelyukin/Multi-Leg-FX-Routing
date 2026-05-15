import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatAmount,
  formatPercent,
  formatProviderType,
  formatRate,
} from "@/lib/formatting";
import type { RouteLeg } from "@/lib/types";

interface LegBreakdownProps {
  legs: RouteLeg[];
}

const COLS = ["Leg", "Provider", "Input", "Fee", "Post-fee", "Rate", "Output"] as const;

export function LegBreakdown({ legs }: LegBreakdownProps) {
  return (
    <div className="rounded-lg border border-[#1e2329] bg-[#0f1319] overflow-hidden">
      <div className="space-y-3 p-3 sm:hidden">
        {legs.map((leg, index) => (
          <div
            key={`${leg.provider}-${leg.from}-${leg.to}-${index}-mobile`}
            className="rounded-lg border border-[#1e2329] bg-[#111820] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-trading rounded border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                    {leg.from}
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 shrink-0 text-slate-600" />
                  <span className="font-mono-trading rounded border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                    {leg.to}
                  </span>
                </div>
                <p className="mt-2 font-mono-trading text-[11px] font-bold text-slate-200">
                  {leg.provider}
                </p>
              </div>
              <Badge
                variant={leg.providerType === "fiat_broker" ? "fiat" : "stablecoin"}
                className="shrink-0 font-mono-trading text-[8px] tracking-widest"
              >
                {formatProviderType(leg.providerType)}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <MobileMetric label="Input" value={formatAmount(leg.inputAmount, leg.from)} />
              <MobileMetric label="Output" value={formatAmount(leg.outputAmount, leg.to)} strong />
              <MobileMetric label="Fee" value={`-${formatAmount(leg.feeAmount, leg.from)}`} danger />
              <MobileMetric label="Post-fee" value={formatAmount(leg.postFeeAmount, leg.from)} />
              <MobileMetric
                label="Fee model"
                value={`${formatPercent(leg.feePercent)} + ${formatAmount(leg.feeFlat, leg.from)}`}
              />
              <MobileMetric label="Rate" value={formatRate(leg.rate)} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800">
              {COLS.map((col, i) => (
                <th
                  key={col}
                  className={
                    "px-4 py-2.5 text-xs font-medium text-[#848e9c] border-b border-[#1e2329] " +
                    (i > 1 ? "text-right" : "")
                  }
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {legs.map((leg, index) => (
              <tr
                key={`${leg.provider}-${leg.from}-${leg.to}-${index}`}
                className={
                  "transition hover:bg-[#161a1e] " +
                  (index < legs.length - 1 ? "border-b border-[#1e2329]" : "")
                }
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-trading rounded border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                      {leg.from}
                    </span>
                    <ArrowRight className="h-2.5 w-2.5 shrink-0 text-slate-600" />
                    <span className="font-mono-trading rounded border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                      {leg.to}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="font-mono-trading text-[11px] font-bold text-slate-200">
                      {leg.provider}
                    </p>
                    <Badge
                      variant={leg.providerType === "fiat_broker" ? "fiat" : "stablecoin"}
                      className="font-mono-trading text-[8px] tracking-widest"
                    >
                      {formatProviderType(leg.providerType)}
                    </Badge>
                  </div>
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="font-mono-trading text-xs text-slate-300 tabular-nums">
                    {formatAmount(leg.inputAmount, leg.from)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <p className="font-mono-trading text-xs text-red-400 tabular-nums">
                    -{formatAmount(leg.feeAmount, leg.from)}
                  </p>
                  <p className="font-mono-trading mt-0.5 text-[9px] text-slate-600">
                    {formatPercent(leg.feePercent)} + {formatAmount(leg.feeFlat, leg.from)}
                  </p>
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="font-mono-trading text-xs text-slate-300 tabular-nums">
                    {formatAmount(leg.postFeeAmount, leg.from)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="font-mono-trading text-[10px] text-slate-500 tabular-nums">
                    {formatRate(leg.rate)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="font-mono-trading text-xs font-bold text-emerald-400 tabular-nums">
                    {formatAmount(leg.outputAmount, leg.to)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileMetric({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#1e2329] bg-[#0f1319] px-2.5 py-2">
      <p className="text-[10px] text-[#848e9c]">{label}</p>
      <p
        className={
          "mt-1 break-words font-mono-trading text-[11px] tabular-nums " +
          (danger
            ? "text-red-400"
            : strong
              ? "font-bold text-emerald-400"
              : "text-slate-300")
        }
      >
        {value}
      </p>
    </div>
  );
}
