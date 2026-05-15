"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart2, Home, TrendingUp } from "lucide-react";

import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { label: "Home",      href: "/",          icon: Home       },
  { label: "Routes",    href: "/routes",    icon: TrendingUp },
  { label: "Analytics", href: "/analytics", icon: BarChart2  },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e2329] bg-[#0b0e11]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="flex h-14 items-center justify-between gap-6">

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/SDM-Logo.svg" alt="SDM" width={26} height={28} priority />
              <span className="text-sm font-semibold text-white">SDM FX Router</span>
            </Link>
            <Separator orientation="vertical" className="h-5 mx-1 bg-[#2b3139]" />
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={
                    "flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors " +
                    (active
                      ? "text-white bg-white/5"
                      : "text-[#848e9c] hover:text-white hover:bg-white/5")
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-xs text-[#848e9c]">Live</span>
          </div>

        </div>

        <nav className="flex border-t border-[#1e2329] py-2 md:hidden">
          <div className="grid w-full grid-cols-3 gap-1 rounded-lg border border-[#1e2329] bg-[#111820] p-1">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition-colors " +
                    (active
                      ? "bg-white/5 text-white"
                      : "text-[#848e9c] hover:bg-white/5 hover:text-white")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
