"use client";

import {
  ArrowLeftRight,
  GitBranch,
  Landmark,
  Loader2,
  Search,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { RouteResults } from "@/components/RouteResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Separator } from "@/components/ui/separator";
import { formatAmountInput, normalizeAmountInput } from "@/lib/formatting";
import type { RouteMode, RoutingResponse } from "@/lib/types";

interface RouteFormProps {
  defaultFrom?: string;
  defaultTo?: string;
  defaultAmount?: string;
  defaultRouteMode?: RouteMode;
  autoSubmit?: boolean;
  navigateOnSubmit?: boolean;
  hideForm?: boolean;
}

export function RouteForm({ defaultFrom, defaultTo, defaultAmount, defaultRouteMode, autoSubmit, navigateOnSubmit, hideForm }: RouteFormProps = {}) {
  const router = useRouter();
  const [source, setSource] = useState(defaultFrom ?? "GBP");
  const [target, setTarget] = useState(defaultTo ?? "JPY");
  const [amount, setAmount] = useState(normalizeAmountInput(defaultAmount ?? ""));
  const [routeMode, setRouteMode] = useState<RouteMode>(defaultRouteMode ?? "all");
  const [response, setResponse] = useState<RoutingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const submitted = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasContentRef = useRef(false);

  // Track whether we have content to animate out
  useEffect(() => {
    hasContentRef.current = response !== null || error !== null || isLoading;
  });

  function animateOut(): Promise<void> {
    return new Promise((resolve) => {
      const el = resultsRef.current;
      if (!el || !hasContentRef.current) { resolve(); return; }
      el.classList.remove("results-enter");
      el.classList.add("results-exit");
      setTimeout(() => {
        el.classList.remove("results-exit");
        el.style.opacity = "0";
        resolve();
      }, 320);
    });
  }

  function animateIn() {
    requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      el.style.opacity = "";
      el.classList.remove("results-exit");
      el.classList.add("results-enter");
      setTimeout(() => el.classList.remove("results-enter"), 500);
    });
  }

  async function submitRoutes(src = source, tgt = target, amt = amount, mode = routeMode) {
    await animateOut();
    setIsLoading(true);
    setError(null);
    setResponse(null);
    animateIn();
    try {
      const result = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: src, target: tgt, amount: Number(amt), routeMode: mode }),
      });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error ?? "Unable to calculate routes.");
      await animateOut();
      setResponse(payload as RoutingResponse);
      setIsLoading(false);
      animateIn();
    } catch (caughtError) {
      await animateOut();
      setResponse(null);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to calculate routes.");
      setIsLoading(false);
      animateIn();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (navigateOnSubmit) {
      const params = new URLSearchParams({
        from: source,
        to: target,
        amount,
        mode: routeMode,
      });
      router.push(`/routes?${params.toString()}`);
    } else {
      await submitRoutes();
    }
  }

  useEffect(() => {
    if (autoSubmit && !submitted.current) {
      submitted.current = true;
      submitRoutes(
        defaultFrom ?? "GBP",
        defaultTo ?? "JPY",
        normalizeAmountInput(defaultAmount ?? "1000"),
        defaultRouteMode ?? "all",
      );
    }
  }, []);

  function swapCurrencies() {
    setSource(target);
    setTarget(source);
  }

  return (
    <div className={navigateOnSubmit || hideForm ? undefined : "grid gap-4 lg:grid-cols-[320px_1fr]"}>

      {!hideForm && <form onSubmit={handleSubmit} className="h-fit">
        <Card className="border-[#1e2329] bg-[#161a1e] overflow-hidden">

          <CardContent className="pt-5 space-y-5">

            <div>
              <p className="text-xs font-medium text-[#848e9c] mb-2">Currency Pair</p>
              <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-1.5">
                <div>
                  <p className="text-xs text-[#848e9c] mb-1">Sell</p>
                  <CurrencySelect value={source} onValueChange={setSource} />
                </div>

                <button
                  type="button"
                  onClick={swapCurrencies}
                  title="Swap currencies"
                  className="mt-4 flex h-9 w-9 items-center justify-center rounded-md border border-[#2b3139] bg-[#0b0e11] text-[#848e9c] transition hover:border-cyan-500/40 hover:text-cyan-400 focus:outline-none"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>

                <div>
                  <p className="text-xs text-[#848e9c] mb-1">Buy</p>
                  <CurrencySelect value={target} onValueChange={setTarget} />
                </div>
              </div>
            </div>

            <Separator className="bg-[#1e2329]" />

            <div>
              <p className="text-xs font-medium text-[#848e9c] mb-2">Amount</p>
              <div className="relative">
                <Input
                  value={formatAmountInput(amount)}
                  onChange={(e) => setAmount(normalizeAmountInput(e.target.value))}
                  inputMode="decimal"
                  type="text"
                  placeholder="0"
                  className="h-10 font-semibold text-sm pr-16 bg-[#0b0e11] border-[#2b3139]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 tracking-wider">
                  {source}
                </span>
              </div>
              <div className="flex gap-1.5 mt-2">
                {["1000", "10000", "50000", "100000"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={
                      "flex-1 rounded py-1 text-[9px] font-bold tracking-wide transition border " +
                      (amount === val
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                        : "bg-[#0b0e11] border-[#2b3139] text-[#848e9c] hover:text-white hover:border-[#3d4553]")
                    }
                  >
                    {Number(val).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-[#1e2329]" />

            <div>
              <p className="text-xs font-medium text-[#848e9c] mb-2">Route Filter</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRouteMode("all")}
                  className={
                    "group flex flex-col items-center gap-1.5 rounded-lg border py-3 px-2 text-center transition " +
                    (routeMode === "all"
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                      : "bg-[#0b0e11] border-[#2b3139] text-[#848e9c] hover:border-[#3d4553] hover:text-white")
                  }
                >
                  <GitBranch className="h-4 w-4" />
                  <span className="text-xs font-medium">All Routes</span>
                  <span className="text-[11px] text-[#848e9c] leading-none">Fiat + Stablecoin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRouteMode("fiat_only")}
                  className={
                    "group flex flex-col items-center gap-1.5 rounded-lg border py-3 px-2 text-center transition " +
                    (routeMode === "fiat_only"
                      ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                      : "bg-[#0b0e11] border-[#2b3139] text-[#848e9c] hover:border-[#3d4553] hover:text-white")
                  }
                >
                  <Landmark className="h-4 w-4" />
                  <span className="text-xs font-medium">Fiat Only</span>
                  <span className="text-[11px] text-[#848e9c] leading-none">Bank / Broker</span>
                </button>
              </div>
            </div>

            <Separator className="bg-[#1e2329]" />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isLoading ? "Routing..." : "Search"}
            </Button>

            <p className="text-[8px] text-slate-600 text-center leading-4 tracking-wide">
              Simulated rates for routing comparison only. Not financial advice.
            </p>
          </CardContent>
        </Card>
      </form>}

      {!navigateOnSubmit && (
        <div ref={resultsRef}>
          <RouteResults response={response} error={error} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
