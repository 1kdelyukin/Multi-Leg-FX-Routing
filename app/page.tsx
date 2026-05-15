import Image from "next/image";
import Link from "next/link";
import { CircleDot, ArrowRight } from "lucide-react";

import { Nav } from "@/components/Nav";
import { RouteForm } from "@/components/RouteForm";
import { MarketTicker } from "@/components/MarketTicker";
import { Button } from "@/components/ui/button";

const STATS = [
  { value: "6", label: "Providers" },
  { value: "3", label: "Live APIs" },
  { value: "3", label: "Max legs" },
  { value: "9", label: "Currencies" },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden lg:h-screen lg:overflow-hidden" style={{ backgroundColor: "#0b0e11" }}>
      <Nav />

      <MarketTicker />

      <section
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(6, 78, 162, 0.22) 0%, transparent 70%), #0b0e11",
        }}
        className="flex-1 lg:flex lg:items-center lg:min-h-0"
      >
        <div className="w-full mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-start">

            <div className="pt-2 lg:pt-4">
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

              <div className="mt-6 flex items-center justify-between gap-2 sm:mt-10 sm:justify-start sm:gap-8">
                {STATS.map(({ value, label }, i) => (
                  <div key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:gap-8">
                    <div className="min-w-0 text-center">
                      <p className="text-xs font-bold text-white sm:text-sm">{value}</p>
                      <p className="truncate text-[9px] text-[#848e9c] sm:text-xs">{label}</p>
                    </div>
                    {i < STATS.length - 1 && (
                      <div className="h-5 w-px shrink-0 bg-[#1e2329] sm:h-6" />
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
