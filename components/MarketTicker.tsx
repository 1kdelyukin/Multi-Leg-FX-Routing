"use client";

import { useEffect, useState } from "react";

type MarketTickerPair = {
  pair: string;
  rate: number | null;
  up: boolean | null;
};

type MarketTickerResponse = {
  source?: string;
  pairs?: MarketTickerPair[];
};

const FALLBACK_PAIRS: MarketTickerPair[] = [
  { pair: "USD -> EUR", rate: null, up: null },
  { pair: "USD -> GBP", rate: null, up: null },
  { pair: "EUR -> GBP", rate: null, up: null },
  { pair: "USD -> JPY", rate: null, up: null },
  { pair: "USD -> CAD", rate: null, up: null },
  { pair: "EUR -> JPY", rate: null, up: null },
  { pair: "GBP -> JPY", rate: null, up: null },
  { pair: "USD -> AUD", rate: null, up: null },
  { pair: "USD -> CHF", rate: null, up: null },
  { pair: "USDT -> USD", rate: null, up: null },
  { pair: "USDC -> EUR", rate: null, up: null },
  { pair: "GBP -> USDC", rate: null, up: null },
];

export function MarketTicker() {
  const [pairs, setPairs] = useState<MarketTickerPair[]>(FALLBACK_PAIRS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/market/ticker", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Ticker API failed");
        }

        return (await response.json()) as MarketTickerResponse;
      })
      .then((payload) => {
        if (payload.pairs?.length) {
          setPairs(payload.pairs);
          setIsLive(true);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setIsLive(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="relative z-[51] flex-shrink-0 -mt-px bg-[#0d1117] pt-px">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, #0d1117 0%, #0d1117 4%, transparent 8%, #1e2329 18%, #1e2329 82%, transparent 92%, #0d1117 96%, #0d1117 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, #1e2329 12%, #1e2329 88%, transparent)",
        }}
      />
      <div
        className="py-2 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="ticker-track">
          {[...pairs, ...pairs].map(({ pair, rate, up }, index) => (
            <div key={`${pair}-${index}`} className="flex items-center gap-2 px-6 whitespace-nowrap">
              <span className="text-xs font-medium text-white/70">{pair}</span>
              <span className="text-xs font-semibold text-white">{formatTickerRate(rate)}</span>
              <span
                className={
                  "text-xs font-medium " +
                  (up === null
                    ? "text-[#848e9c]"
                    : up
                      ? "text-emerald-400"
                      : "text-red-400")
                }
              >
                {up === null ? "-" : up ? "▲" : "▼"}
              </span>
              {index === 0 && (
                <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-cyan-300">
                  {isLive ? "LIVE" : "LOAD"}
                </span>
              )}
              <span className="text-[#2a3040] mx-2">|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTickerRate(rate: number | null): string {
  if (rate === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: rate >= 10 ? 2 : 4,
    maximumFractionDigits: rate >= 10 ? 2 : 6,
  }).format(rate);
}
