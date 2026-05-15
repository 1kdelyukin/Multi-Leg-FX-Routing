"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeftRight, CircleDot, Loader2, Search } from "lucide-react";

import { Nav } from "@/components/Nav";
import { RouteForm } from "@/components/RouteForm";
import { CurrencySelect } from "@/components/ui/currency-select";
import {
  FIAT_CURRENCIES,
  formatAmount,
  formatAmountInput,
  getCurrencySymbol,
  isFiatCurrency,
  normalizeAmountInput,
} from "@/lib/formatting";
import type { RouteMode } from "@/lib/types";

interface PreviewWidgetProps {
  from: string;
  to: string;
  amount: string;
  routeMode: RouteMode;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onRouteModeChange: (v: RouteMode) => void;
  onSwap: () => void;
  onSearch: () => void;
}

function PreviewWidget({
  from,
  to,
  amount,
  routeMode,
  onFromChange,
  onToChange,
  onAmountChange,
  onRouteModeChange,
  onSwap,
  onSearch,
}: PreviewWidgetProps) {
  const [preview, setPreview] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const amountNumber = Number(amount);
  const sourceCurrencySymbol = getCurrencySymbol(from);
  const currencyOptions = routeMode === "fiat_only" ? FIAT_CURRENCIES : undefined;
  const hasInvalidFiatOnlyCurrency =
    routeMode === "fiat_only" && (!isFiatCurrency(from) || !isFiatCurrency(to));
  const isSearchDisabled =
    !Number.isFinite(amountNumber) ||
    amountNumber <= 0 ||
    from === to ||
    hasInvalidFiatOnlyCurrency;

  useEffect(() => {
    const num = Number(amount);
    if (!num || from === to || hasInvalidFiatOnlyCurrency) { setPreview(null); return; }
    const controller = new AbortController();
    let active = true;
    setPreviewLoading(true);
    fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: from, target: to, amount: num, routeMode }),
      signal: controller.signal,
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (active) setPreview(data?.routes?.[0]?.finalAmount ?? null);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) setPreview(null);
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [from, to, amount, routeMode, hasInvalidFiatOnlyCurrency]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!isSearchDisabled) onSearch();
      }}
      className="space-y-3"
    >
      <div className="rounded-xl border border-[#2b3139] bg-[#151a20] p-2.5 shadow-lg sm:p-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(190px,0.7fr)_minmax(360px,1.35fr)_240px_76px] xl:items-stretch">
          <label
            htmlFor="route-source-amount"
            className="block rounded-lg border border-[#252b33] bg-[#0b0e11] px-4 py-3"
          >
            <span className="text-xs font-medium text-[#848e9c]">Amount</span>
            <div className="mt-1 flex h-10 items-center gap-2">
              <span className="shrink-0 text-2xl font-bold leading-none text-white sm:text-3xl">
                {sourceCurrencySymbol}
              </span>
              <input
                id="route-source-amount"
                value={formatAmountInput(amount)}
                onChange={(event) =>
                  onAmountChange(normalizeAmountInput(event.target.value))
                }
                inputMode="decimal"
                type="text"
                className="h-full min-w-0 flex-1 bg-transparent text-2xl font-bold leading-none tabular-nums text-white outline-none placeholder:text-[#3d4553] sm:text-3xl"
                placeholder="0"
              />
            </div>
          </label>

          <div className="rounded-lg border border-[#252b33] bg-[#0b0e11] px-3 py-2.5">
            <p className="text-xs font-medium text-[#848e9c]">Route</p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] items-center gap-2">
              <CurrencySelect
                value={from}
                onValueChange={onFromChange}
                currencies={currencyOptions}
                align="start"
                buttonClassName="h-9"
              />

              <button
                type="button"
                onClick={onSwap}
                title="Swap currencies"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2b3139] bg-[#111820] text-[#848e9c] transition-colors hover:border-cyan-500/40 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>

              <CurrencySelect
                value={to}
                onValueChange={onToChange}
                currencies={currencyOptions}
                align="end"
                buttonClassName="h-9"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[#252b33] bg-[#0b0e11] px-3 py-2.5">
            <p className="text-xs font-medium text-[#848e9c]">Search mode</p>
            <div className="relative mt-2 grid h-9 grid-cols-2 rounded-md border border-[#2b3139] bg-[#111820] p-1">
              <span
                className={
                  "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded bg-cyan-500/20 ring-1 ring-cyan-400/30 transition-transform duration-200 " +
                  (routeMode === "fiat_only" ? "translate-x-full" : "translate-x-0")
                }
              />
              <button
                type="button"
                onClick={() => onRouteModeChange("all")}
                className={
                  "relative z-10 rounded px-2 text-xs font-bold transition-colors " +
                  (routeMode === "all" ? "text-cyan-300" : "text-[#848e9c] hover:text-white")
                }
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onRouteModeChange("fiat_only")}
                className={
                  "relative z-10 rounded px-2 text-xs font-bold transition-colors " +
                  (routeMode === "fiat_only" ? "text-cyan-300" : "text-[#848e9c] hover:text-white")
                }
              >
                <span className="whitespace-nowrap">Fiat Only</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearchDisabled}
            aria-label="Search routes"
            title="Search routes"
            className="flex h-full min-h-[52px] w-full items-center justify-center rounded-lg bg-cyan-600 text-white transition-colors hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:bg-[#2b3139] disabled:text-[#848e9c] xl:min-h-[76px]"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-[#1e2329] bg-[#0f1318] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium text-[#848e9c]">Estimated receive</span>
        <div className="flex min-h-7 items-center gap-2 text-right">
          {hasInvalidFiatOnlyCurrency ? (
            <span className="text-xs font-semibold text-amber-300">
              Fiat Only supports fiat currencies only
            </span>
          ) : previewLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#848e9c]" />
          ) : preview !== null ? (
            <span className="text-xl font-bold tabular-nums text-white">
              {formatAmount(preview, to)}
            </span>
          ) : (
            <span className="select-none text-xl font-bold text-[#2b3139]">—</span>
          )}
        </div>
      </div>
    </form>
  );
}

function RoutesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRouteMode: RouteMode =
    searchParams.get("mode") === "fiat_only" ? "fiat_only" : "all";
  const initialFrom = searchParams.get("from") ?? "GBP";
  const initialTo = searchParams.get("to") ?? "JPY";
  const safeInitialFrom =
    initialRouteMode === "fiat_only" && !isFiatCurrency(initialFrom) ? "USD" : initialFrom;
  const safeInitialTo =
    initialRouteMode === "fiat_only" && !isFiatCurrency(initialTo)
      ? FIAT_CURRENCIES.find((currency) => currency !== safeInitialFrom) ?? "EUR"
      : initialTo;

  const [from, setFrom] = useState(safeInitialFrom);
  const [to, setTo] = useState(safeInitialTo);
  const [amount, setAmount] = useState(
    normalizeAmountInput(searchParams.get("amount") ?? ""),
  );
  const [routeMode, setRouteMode] = useState<RouteMode>(initialRouteMode);
  const hasParams = !!(searchParams.get("from") && searchParams.get("to") && searchParams.get("amount"));

  function pickFallbackFiat(otherCurrency: string, preferredCurrency: string) {
    if (isFiatCurrency(preferredCurrency) && preferredCurrency !== otherCurrency) {
      return preferredCurrency;
    }

    return FIAT_CURRENCIES.find((currency) => currency !== otherCurrency) ?? "USD";
  }

  function handleRouteModeChange(nextMode: RouteMode) {
    setRouteMode(nextMode);

    if (nextMode !== "fiat_only") {
      return;
    }

    setFrom((currentFrom) => {
      if (isFiatCurrency(currentFrom)) {
        return currentFrom;
      }

      return pickFallbackFiat(to, "USD");
    });

    setTo((currentTo) => {
      if (isFiatCurrency(currentTo)) {
        return currentTo;
      }

      const nextFrom = isFiatCurrency(from) ? from : "USD";
      return pickFallbackFiat(nextFrom, "EUR");
    });
  }

  function navigate() {
    const params = new URLSearchParams({
      from,
      to,
      amount,
      mode: routeMode,
    });
    router.push(`/routes?${params.toString()}`);
  }

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0e11" }}>
      <Nav />

      <main className="flex-1">
        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10">

          <div className="mb-8">
            <PreviewWidget
              from={from}
              to={to}
              amount={amount}
              routeMode={routeMode}
              onFromChange={setFrom}
              onToChange={setTo}
              onAmountChange={setAmount}
              onRouteModeChange={handleRouteModeChange}
              onSwap={handleSwap}
              onSearch={navigate}
            />
          </div>

          <RouteForm
            key={`${searchParams.get("from")}-${searchParams.get("to")}-${searchParams.get("amount")}-${searchParams.get("mode")}`}
            defaultFrom={from}
            defaultTo={to}
            defaultAmount={amount}
            defaultRouteMode={routeMode}
            autoSubmit={hasParams}
            hideForm
          />
        </div>
      </main>

      <footer className="border-t border-[#1e2329] py-4">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="flex items-center gap-2">
            <CircleDot className="h-3 w-3 text-[#848e9c]" />
            <span className="text-xs text-[#848e9c]">
              Designed and built by Kirill Delyukin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/SDM-Logo.svg" alt="SDM" width={14} height={15} />
            <span className="text-xs text-[#848e9c]">SDM © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function RoutesPage() {
  return (
    <Suspense>
      <RoutesContent />
    </Suspense>
  );
}
