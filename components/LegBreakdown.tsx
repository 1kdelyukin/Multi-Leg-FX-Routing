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
      <div className="overflow-x-auto">
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
