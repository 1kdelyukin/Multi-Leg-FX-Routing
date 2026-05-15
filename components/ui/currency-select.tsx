"use client";

/* eslint-disable @next/next/no-img-element */
import { Check, ChevronDown, Search } from "lucide-react";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { COMMON_CURRENCIES, getCurrencyFlag } from "@/lib/formatting";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  currencies?: readonly string[];
  align?: "start" | "end";
  className?: string;
  buttonClassName?: string;
}

const VIEWPORT_GUTTER = 12;
const MENU_MIN_WIDTH = 220;

export function CurrencySelect({
  value,
  onValueChange,
  currencies = COMMON_CURRENCIES,
  align = "start",
  className,
  buttonClassName,
}: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCurrencies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return currencies;
    }

    return currencies.filter((currency) =>
      currency.toLowerCase().includes(normalizedQuery),
    );
  }, [currencies, query]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, MENU_MIN_WIDTH);
    const preferredLeft = align === "end" ? rect.right - width : rect.left;
    const maxLeft = window.innerWidth - width - VIEWPORT_GUTTER;
    const left = Math.max(VIEWPORT_GUTTER, Math.min(preferredLeft, maxLeft));
    const availableBelow = window.innerHeight - rect.bottom - VIEWPORT_GUTTER;
    const availableAbove = rect.top - VIEWPORT_GUTTER;
    const opensAbove = availableBelow < 260 && availableAbove > availableBelow;
    const top = opensAbove ? undefined : rect.bottom + 8;
    const bottom = opensAbove ? window.innerHeight - rect.top + 8 : undefined;

    setMenuStyle({
      position: "fixed",
      left,
      top,
      bottom,
      width,
      zIndex: 100,
    });
  }, [align]);

  useEffect(() => {
    if (!open) {
      return;
    }

    updateMenuPosition();
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  function selectCurrency(currency: string) {
    onValueChange(currency);
    setOpen(false);
  }

  const flag = getCurrencyFlag(value);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-[#2b3139] bg-[#0b0e11] px-3 text-sm font-semibold text-white transition-colors",
          "hover:border-cyan-500/40 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/20",
          open && "border-cyan-500/60 ring-2 ring-cyan-500/20",
          buttonClassName,
        )}
      >
        {flag ? (
          <img
            src={flag}
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] shrink-0 rounded-sm object-cover"
          />
        ) : (
          <span className="h-[18px] w-[18px] shrink-0 rounded-sm bg-[#2b3139]" />
        )}
        <span className="min-w-0 flex-1 text-left">{value}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[#848e9c] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && menuStyle && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-lg border border-[#2b3139] bg-[#151a20] shadow-2xl shadow-black/50"
            >
              <div className="border-b border-[#2b3139] p-2">
                <div className="flex h-9 items-center gap-2 rounded-md border border-[#2b3139] bg-[#0b0e11] px-2.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-[#848e9c]" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search currency"
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#848e9c]"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto p-1">
                {filteredCurrencies.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-[#848e9c]">
                    No currencies found
                  </p>
                ) : (
                  filteredCurrencies.map((currency) => {
                    const itemFlag = getCurrencyFlag(currency);
                    const selected = currency === value;

                    return (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => selectCurrency(currency)}
                        className={cn(
                          "flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-semibold transition-colors",
                          selected
                            ? "bg-cyan-500/10 text-cyan-300"
                            : "text-slate-100 hover:bg-[#0b0e11]",
                        )}
                      >
                        {itemFlag ? (
                          <img
                            src={itemFlag}
                            alt=""
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="h-[18px] w-[18px] shrink-0 rounded-sm bg-[#2b3139]" />
                        )}
                        <span className="min-w-0 flex-1 text-left">
                          {currency}
                        </span>
                        {selected ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
