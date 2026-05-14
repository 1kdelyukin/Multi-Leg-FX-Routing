import Image from "next/image";
import { CircleDot, GitMerge, Shield, Zap } from "lucide-react";

import { Nav } from "@/components/Nav";
import { RouteForm } from "@/components/RouteForm";

const FEATURES = [
  {
    icon: GitMerge,
    title: "Multi-Leg Routing",
    description:
      "Discovers all 1–3 leg paths across brokers and stablecoin venues, then ranks them by net recipient amount.",
  },
  {
    icon: Zap,
    title: "Live Rates",
    description:
      "Pulls real-time FX data from Frankfurter, ExchangeRate-API, and Fawazahmed0 with a 5-minute cache.",
  },
  {
    icon: Shield,
    title: "Fee-Aware",
    description:
      "Every route accounts for percentage and flat fees per provider, so the ranked output reflects true net cost.",
  },
] as const;

const STATS = [
  { value: "6", label: "Providers" },
  { value: "3", label: "Live APIs" },
  { value: "3", label: "Max legs" },
  { value: "9", label: "Currencies" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0e11" }}>
      <Nav />

      <section
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(6, 78, 162, 0.22) 0%, transparent 70%), #0b0e11",
        }}
        className="flex-1 flex items-center"
      >
        <div className="w-full mx-auto max-w-screen-xl px-6 py-16">
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
            </div>

            <RouteForm navigateOnSubmit />
          </div>
        </div>
      </section>

      <section className="border-t border-[#1e2329] py-16">
        <div className="mx-auto max-w-screen-xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-[#161a1e] border border-[#1e2329] rounded-xl p-6">
                <div className="h-10 w-10 rounded-lg bg-cyan-600/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-sm text-[#848e9c] leading-relaxed">{description}</p>
              </div>
            ))}
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