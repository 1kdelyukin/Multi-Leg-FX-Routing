"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleDot, LineChart } from "lucide-react";
import { useState } from "react";

import { Nav } from "@/components/Nav";
import { getCurrencyFlag } from "@/lib/formatting";

type AnalyticsMode = "fiat" | "crypto";

interface PairingCard {
  code: string;
  name: string;
  rate: string;
  weeklyChange: string;
  weeklyPercent: string;
  direction: "up" | "down";
}

const FIAT_PAIRINGS: PairingCard[] = [
  { code: "EUR", name: "Euro", rate: "0.853545", weeklyChange: "+0.0032", weeklyPercent: "0.37%", direction: "up" },
  { code: "GBP", name: "British Pound", rate: "0.739236", weeklyChange: "+0.0042", weeklyPercent: "0.58%", direction: "up" },
  { code: "JPY", name: "Japanese Yen", rate: "157.876", weeklyChange: "+1.6634", weeklyPercent: "1.06%", direction: "up" },
  { code: "CAD", name: "Canadian Dollar", rate: "1.37061", weeklyChange: "+0.0075", weeklyPercent: "0.55%", direction: "up" },
  { code: "AUD", name: "Australian Dollar", rate: "1.37965", weeklyChange: "-0.0004", weeklyPercent: "0.03%", direction: "down" },
  { code: "CHF", name: "Swiss Franc", rate: "0.781434", weeklyChange: "+0.0032", weeklyPercent: "0.41%", direction: "up" },
];

const CRYPTO_PAIRINGS: PairingCard[] = [
  { code: "USDT", name: "Tether USD", rate: "0.9990", weeklyChange: "-0.0006", weeklyPercent: "0.06%", direction: "down" },
  { code: "USDC", name: "USD Coin", rate: "1.0010", weeklyChange: "+0.0004", weeklyPercent: "0.04%", direction: "up" },
  { code: "JPY", name: "USDT to Japanese Yen", rate: "156.2", weeklyChange: "+1.1120", weeklyPercent: "0.72%", direction: "up" },
  { code: "EUR", name: "USDT to Euro", rate: "0.9220", weeklyChange: "+0.0028", weeklyPercent: "0.30%", direction: "up" },
  { code: "CAD", name: "USDC to Canadian Dollar", rate: "1.3550", weeklyChange: "-0.0041", weeklyPercent: "0.30%", direction: "down" },
  { code: "CHF", name: "USDT to Swiss Franc", rate: "0.8900", weeklyChange: "+0.0019", weeklyPercent: "0.21%", direction: "up" },
];

export default function AnalyticsPage() {
  const [mode, setMode] = useState<AnalyticsMode>("fiat");
  const pairings = mode === "fiat" ? FIAT_PAIRINGS : CRYPTO_PAIRINGS;
  const title =
    mode === "fiat"
      ? "Popular US Dollar (USD) Fiat Pairings"
      : "Popular USD Stablecoin Pairings";
  const baseLabel = mode === "fiat" ? "1 USD equals to" : "Indicative route quote";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0e11" }}>
      <Nav />

      <main className="flex-1">
        <div className="mx-auto max-w-screen-xl px-6 py-10">
          <div className="flex flex-col gap-5 border-b border-[#1e2329] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Market analytics
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {title}
              </h1>
            </div>

            <div className="rounded-xl border border-[#2b3139] bg-[#151a20] p-1.5">
              <div className="relative grid h-10 w-64 grid-cols-2 rounded-lg border border-[#2b3139] bg-[#0b0e11] p-1">
                <span
                  className={
                    "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-cyan-500/20 ring-1 ring-cyan-400/30 transition-transform duration-200 " +
                    (mode === "crypto" ? "translate-x-full" : "translate-x-0")
                  }
                />
                <button
                  type="button"
                  onClick={() => setMode("fiat")}
                  className={
                    "relative z-10 rounded-md px-3 text-sm font-bold transition-colors " +
                    (mode === "fiat" ? "text-cyan-300" : "text-[#848e9c] hover:text-white")
                  }
                >
                  Fiat
                </button>
                <button
                  type="button"
                  onClick={() => setMode("crypto")}
                  className={
                    "relative z-10 rounded-md px-3 text-sm font-bold transition-colors " +
                    (mode === "crypto" ? "text-cyan-300" : "text-[#848e9c] hover:text-white")
                  }
                >
                  Crypto
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pairings.map((pairing) => (
              <article
                key={`${mode}-${pairing.name}`}
                className="rounded-xl border border-[#1e2329] bg-[#151a20] p-6 shadow-lg shadow-black/20 transition-colors hover:border-cyan-500/30"
              >
                <div className="flex items-center gap-3">
                  <CurrencyIcon code={pairing.code} />
                  <h2 className="font-semibold text-white">{pairing.name}</h2>
                </div>

                <p className="mt-8 text-sm text-[#9aa4b2]">{baseLabel}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                  {pairing.rate} {pairing.code}
                </p>

                <p
                  className={
                    "mt-3 text-sm font-medium " +
                    (pairing.direction === "up" ? "text-emerald-400" : "text-red-400")
                  }
                >
                  {pairing.weeklyChange} ({pairing.weeklyPercent}){" "}
                  <span className="text-[#9aa4b2]">Weekly</span>
                </p>

                <Link
                  href={`/routes?from=USD&to=${pairing.code}&amount=1000&mode=${
                    mode === "fiat" ? "fiat_only" : "all"
                  }`}
                  className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  View route
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1e2329] py-4">
        <div className="mx-auto max-w-screen-xl px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CircleDot className="h-3 w-3 text-[#848e9c]" />
            <span className="text-xs text-[#848e9c]">
              Analytics use indicative weekly comparison data.
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

function CurrencyIcon({ code }: { code: string }) {
  const flag = getCurrencyFlag(code);

  if (flag) {
    return (
      <Image
        src={flag}
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
      <LineChart className="h-4 w-4" />
    </span>
  );
}
