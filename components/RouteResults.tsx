import { AlertTriangle, Route, ServerOff, TrendingUp } from "lucide-react";

import { RouteCard } from "@/components/RouteCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RoutingResponse } from "@/lib/types";

interface RouteResultsProps {
  response: RoutingResponse | null;
  error: string | null;
  isLoading: boolean;
}

export function RouteResults({ response, error, isLoading }: RouteResultsProps) {

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-[#1e2329] bg-[#161a1e] px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400 pulse-dot shrink-0" />
          <span className="text-sm text-[#848e9c]">Fetching quotes and simulating paths...</span>
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-[#1e2329] bg-[#161a1e] overflow-hidden"
          >
            <div className="h-0.5 bg-[#1e2329]" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-10 rounded bg-[#1e2329]" />
                <div className="h-7 w-44 rounded bg-[#1e2329]" />
                <div className="h-5 w-14 rounded-full bg-[#1e2329]" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-12 rounded bg-[#1e2329]" />
                <div className="h-3 w-3 rounded bg-[#1e2329]" />
                <div className="h-5 w-20 rounded bg-[#1e2329]" />
                <div className="h-3 w-3 rounded bg-[#1e2329]" />
                <div className="h-5 w-12 rounded bg-[#1e2329]" />
              </div>
              <div className="h-8 w-full rounded-lg bg-[#1e2329]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-800/40 bg-red-950/20">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-900/40 border border-red-800/40">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-red-400 mb-1">
                Routing Error
              </p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2b3139] bg-[#0f1319] p-6 text-center sm:p-14">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#161a1e] border border-[#2b3139]">
          <Route className="h-6 w-6 text-slate-500" />
        </div>
          <span className="text-sm font-medium text-[#eaecef]">Ready to route</span>
        <p className="mt-2 max-w-sm text-[11px] leading-5 text-slate-500">
          Configure your currency pair and notional, then click{" "}
          <span className="text-cyan-400 font-semibold">Find Optimal Routes</span> to compare
          top-3 net recipient outcomes across all providers.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {[
            { label: "Multi-leg", desc: "Up to 3 hops" },
            { label: "Fee-aware", desc: "All charges included" },
            { label: "Live rates", desc: "Real-time fetch" },
          ].map(({ label, desc }) => (
            <div
              key={label}
              className="flex min-w-[175px] items-center justify-center gap-1.5 rounded-lg border border-[#1e2329] bg-[#161a1e] px-4 py-2 text-center"
            >
              <span className="whitespace-nowrap text-[11px] font-semibold text-[#eaecef]">
                {label}
              </span>
              <span className="whitespace-nowrap text-xs text-[#848e9c]">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {response.warnings.length > 0 && (
        <Card className="border-amber-700/40 bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-900/40 border border-amber-700/40">
                <ServerOff className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400 mb-2">
                  Provider Warnings
                </p>
                <ul className="space-y-1">
                  {response.warnings.map((warning, index) => (
                    <li key={`${warning.provider}-${index}`} className="text-[11px] text-amber-400/75">
                      <span className="font-semibold text-amber-400">{warning.provider}:</span>{" "}
                      {warning.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {response.routes.length === 0 ? (
        <Card className="border-slate-700/60">
          <CardContent className="pt-5">
            <h2 className="font-semibold text-slate-300">No routes found</h2>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-5">
              Try a different currency pair or switch back to All Routes mode.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs text-[#848e9c]">
              {response.routes.length} {response.routes.length === 1 ? "route" : "routes"} · ranked by net output
            </span>
            </div>
            <Badge variant="outline" className="text-[9px] tracking-widest font-mono-trading">
              {response.source} to {response.target}
            </Badge>
          </div>

          <Separator className="bg-slate-800/60" />

          {response.routes.map((route, index) => (
            <div
              key={`${route.rank}-${route.path.join("-")}`}
              className="route-card-enter"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <RouteCard
                route={route}
                directAmount={response.directAmount}
                autoOpen={index === 0}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
