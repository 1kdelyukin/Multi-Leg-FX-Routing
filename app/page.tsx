import Image from "next/image";
import Link from "next/link";
import { CircleDot, ArrowRight } from "lucide-react";

import { Nav } from "@/components/Nav";
import { RouteForm } from "@/components/RouteForm";
import { Button } from "@/components/ui/button";

const TICKER_PAIRS = [
  { pair: "USD → EUR", rate: "0.9142", up: true },
  { pair: "USD → GBP", rate: "0.7821", up: false },
  { pair: "EUR → GBP", rate: "0.8556", up: true },
  { pair: "USD → JPY", rate: "149.32", up: true },
  { pair: "USD → CAD", rate: "1.3641", up: false },
  { pair: "EUR → JPY", rate: "163.47", up: true },
  { pair: "GBP → JPY", rate: "190.89", up: true },
  { pair: "USD → AUD", rate: "1.5234", up: false },
  { pair: "USD → CHF", rate: "0.9012", up: false },
  { pair: "USDT → USD", rate: "1.0001", up: true },
  { pair: "USDC → EUR", rate: "0.9138", up: false },
  { pair: "GBP → USDC", rate: "1.2680", up: true },
] as const;

const STATS = [
  { value: "6", label: "Providers" },
  { value: "3", label: "Live APIs" },
  { value: "3", label: "Max legs" },
  { value: "9", label: "Currencies" },
] as const;

export default function Home() {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#0b0e11" }}>
      <Nav />

      {/* Auto-scrolling pairs ticker */}
      <div className="relative z-[51] flex-shrink-0 -mt-px bg-[#0d1117] pt-px">
        {/* Fading top border line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, #0d1117 0%, #0d1117 4%, transparent 8%, #1e2329 18%, #1e2329 82%, transparent 92%, #0d1117 96%, #0d1117 100%)" }} />
        {/* Fading bottom border line */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, #1e2329 12%, #1e2329 88%, transparent)" }} />
        {/* Scrolling content */}
        <div
          className="py-2 overflow-hidden"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)", maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)" }}
        >
          <div className="ticker-track">
            {[...TICKER_PAIRS, ...TICKER_PAIRS].map(({ pair, rate, up }, i) => (
              <div key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
                <span className="text-xs font-medium text-white/70">{pair}</span>
                <span className="text-xs font-semibold text-white">{rate}</span>
                <span className={`text-xs font-medium ${up ? "text-emerald-400" : "text-red-400"}`}>
                  {up ? "▲" : "▼"}
                </span>
                <span className="text-[#2a3040] mx-2">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(6, 78, 162, 0.22) 0%, transparent 70%), #0b0e11",
        }}
        className="flex-1 flex items-center min-h-0"
      >
        <div className="w-full mx-auto max-w-screen-xl px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            <div className="pt-4">
              <p className="text-xs font-semibold text-cyan-400 tracking-widest uppercase mb-4">
                SDM · Multi-Leg FX Router
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
                Find the Optimal<br />FX Route
              </h1>
              <p className="mt-4 text-base text-[#848e9c] max-w-md leading-relaxed">
                Compare multi-leg paths across brokers and stablecoin venues.
                Ranked by net recipient amount after all fees.
              </p>

              <div className="mt-10 flex items-center gap-8">
                {STATS.map(({ value, label }, i) => (
                  <div key={label} className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{value}</p>
                      <p className="text-xs text-[#848e9c]">{label}</p>
                    </div>
                    {i < STATS.length - 1 && (
                      <div className="h-6 w-px bg-[#1e2329]" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild variant="outline" className="border-0 text-white font-semibold gap-2 transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #eab308 100%)" }}>
                  <Link href="/analytics">
                    Explore Pairs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <RouteForm navigateOnSubmit />
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1e2329] py-4">
        <div className="mx-auto max-w-screen-xl px-6 flex items-center justify-between gap-4">
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
