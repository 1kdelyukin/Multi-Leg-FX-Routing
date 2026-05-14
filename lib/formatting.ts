import type { ProviderType } from "./types";

export const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "USDT",
  "USDC",
];

const CURRENCY_FLAGS: Record<string, string> = {
  USD:  "/currencies/USD.png",
  EUR:  "/currencies/EUR.png",
  GBP:  "/currencies/GBP.png",
  JPY:  "/currencies/JPY.png",
  CAD:  "/currencies/CAD.png",
  AUD:  "/currencies/AUD.png",
  CHF:  "/currencies/CHF.png",
  USDT: "/currencies/USDT.png",
  USDC: "/currencies/USDC.png",
};

export function getCurrencyFlag(currency: string): string | null {
  return CURRENCY_FLAGS[currency.toUpperCase()] ?? null;
}

const FIAT_CURRENCIES = new Set(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF"]);
const CRYPTO_CURRENCIES = new Set(["USDT", "USDC"]);

export function getCurrencySymbol(currency: string): string {
  const normalizedCurrency = currency.toUpperCase();

  if (!FIAT_CURRENCIES.has(normalizedCurrency)) {
    return normalizedCurrency;
  }

  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);

    return (
      parts.find((part) => part.type === "currency")?.value ??
      normalizedCurrency
    );
  } catch {
    return normalizedCurrency;
  }
}

export function normalizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");

  if (!cleaned) {
    return "";
  }

  const hasDecimal = cleaned.includes(".");
  const [rawInteger = "", ...rawDecimalParts] = cleaned.split(".");
  const decimal = rawDecimalParts.join("");
  const integerWithoutLeadingZeros = rawInteger.replace(/^0+(?=\d)/, "");
  const integer = integerWithoutLeadingZeros || "0";

  return hasDecimal ? `${integer}.${decimal}` : integer;
}

export function formatAmountInput(value: string): string {
  if (!value) {
    return "";
  }

  const [integer = "0", decimal] = value.split(".");
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimal === undefined ? groupedInteger : `${groupedInteger}.${decimal}`;
}

export function formatAmount(amount: number, currency: string): string {
  const normalizedCurrency = currency.toUpperCase();

  if (FIAT_CURRENCIES.has(normalizedCurrency)) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${formatNumber(amount, 2, 2)} ${normalizedCurrency}`;
    }
  }

  const decimals = CRYPTO_CURRENCIES.has(normalizedCurrency) ? 4 : 2;
  return `${formatNumber(amount, 2, decimals)} ${normalizedCurrency}`;
}

export function formatRate(rate: number): string {
  return formatNumber(rate, 2, 6);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value * 100, 2, 4)}%`;
}

export function formatProviderType(type: ProviderType): string {
  return type === "fiat_broker" ? "Fiat broker" : "Stablecoin venue";
}

function formatNumber(
  value: number,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}
