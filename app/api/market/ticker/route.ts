import { NextResponse } from "next/server";

type TickerPairConfig = {
  from: string;
  to: string;
};

type TickerPair = TickerPairConfig & {
  pair: string;
  rate: number | null;
  previousRate: number | null;
  change: number | null;
  up: boolean | null;
};

type FawazCurrencyResponse = {
  date?: string;
} & Record<string, unknown>;

type ProviderWarning = {
  provider: string;
  message: string;
};

const TICKER_PAIRS: TickerPairConfig[] = [
  { from: "USD", to: "EUR" },
  { from: "USD", to: "GBP" },
  { from: "EUR", to: "GBP" },
  { from: "USD", to: "JPY" },
  { from: "USD", to: "CAD" },
  { from: "EUR", to: "JPY" },
  { from: "GBP", to: "JPY" },
  { from: "USD", to: "AUD" },
  { from: "USD", to: "CHF" },
  { from: "USDT", to: "USD" },
  { from: "USDC", to: "EUR" },
  { from: "GBP", to: "USDC" },
];

const FAWAZ_BASE_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";
const CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 4000;
const responseCache = new Map<string, { expiresAt: number; data: unknown }>();

export const dynamic = "force-dynamic";

export async function GET() {
  const bases = [...new Set(TICKER_PAIRS.map((pair) => pair.from))];
  const latestVersion = "latest";
  const warnings: ProviderWarning[] = [];

  const latestMaps = await fetchRateMaps(bases, latestVersion, warnings);
  const latestDate = getMostCommonSourceDate(latestMaps) ?? toIsoDate(addDays(new Date(), -1));
  const previousVersion = toIsoDate(addDays(new Date(`${latestDate}T00:00:00.000Z`), -1));
  const previousMaps = await fetchRateMaps(bases, previousVersion, warnings);

  const pairs: TickerPair[] = TICKER_PAIRS.map(({ from, to }) => {
    const rate = readRate(latestMaps.get(from), from, to);
    const previousRate = readRate(previousMaps.get(from), from, to);
    const change =
      typeof rate === "number" && typeof previousRate === "number"
        ? rate - previousRate
        : null;

    return {
      from,
      to,
      pair: `${from} -> ${to}`,
      rate,
      previousRate,
      change,
      up: change === null || change === 0 ? null : change > 0,
    };
  });

  return NextResponse.json({
    source: "DeltaMarkets (fawazahmed0 daily currency API)",
    latestVersion,
    latestDate,
    previousVersion,
    generatedAt: new Date().toISOString(),
    pairs,
    warnings,
  });
}

function getMostCommonSourceDate(maps: Map<string, FawazCurrencyResponse>): string | null {
  const counts = new Map<string, number>();

  maps.forEach((data) => {
    if (typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      counts.set(data.date, (counts.get(data.date) ?? 0) + 1);
    }
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

async function fetchRateMaps(
  bases: string[],
  version: string,
  warnings: ProviderWarning[],
): Promise<Map<string, FawazCurrencyResponse>> {
  const entries = await Promise.all(
    bases.map(async (base) => {
      try {
        const lowerBase = base.toLowerCase();
        const url = `${FAWAZ_BASE_URL}@${version}/v1/currencies/${lowerBase}.json`;
        const data = await fetchJsonCached<FawazCurrencyResponse>(url);
        return [base, data] as const;
      } catch (error) {
        warnings.push({
          provider: "DeltaMarkets",
          message: `${base} ${version}: ${getErrorMessage(error)}`,
        });
        return null;
      }
    }),
  );

  return new Map(entries.filter((entry): entry is readonly [string, FawazCurrencyResponse] => entry !== null));
}

async function fetchJsonCached<T>(url: string): Promise<T> {
  const cached = responseCache.get(url);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as T;
    responseCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Timed out fetching ticker rates");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function readRate(
  data: FawazCurrencyResponse | undefined,
  from: string,
  to: string,
): number | null {
  if (from === to) {
    return 1;
  }

  const rateMap = data?.[from.toLowerCase()];

  if (!isRecord(rateMap)) {
    return null;
  }

  const rate = rateMap[to.toLowerCase()];

  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
    ? rate
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown ticker API error";
}
