import { NextResponse } from "next/server";

type HistoricalPoint = {
  date: string;
  rate: number;
  sourceDate: string;
  filled: boolean;
};

type FrankfurterTimeSeriesResponse = {
  base?: string;
  start_date?: string;
  end_date?: string;
  rates?: Record<string, Record<string, number>>;
};

type FawazCurrencyResponse = {
  date?: string;
} & Record<string, unknown>;

type ProviderWarning = {
  provider: string;
  message: string;
};

type HistoricalProviderResult = {
  source: string;
  points: HistoricalPoint[];
  warnings: ProviderWarning[];
};

const FRANKFURTER_TIME_SERIES_URL = "https://api.frankfurter.dev/v1";
const FAWAZ_JSDELIVR_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";
const FAWAZ_CLOUDFLARE_HOST = "currency-api.pages.dev";
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
const FAWAZ_CONCURRENCY = 12;
const FAWAZ_HISTORICAL_CODES = new Set(["USDT", "USDC"]);
const cache = new Map<string, { expiresAt: number; data: unknown }>();

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = normalizeCurrency(searchParams.get("base") ?? "USD");
  const quote = normalizeCurrency(searchParams.get("quote") ?? "");
  const days = Number(searchParams.get("days") ?? "30");

  if (!base || !quote) {
    return NextResponse.json(
      { error: "Base and quote currencies are required." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(days) || days < 1 || days > 366) {
    return NextResponse.json(
      { error: "Days must be a number between 1 and 366." },
      { status: 400 },
    );
  }

  const endDate = toIsoDate(new Date());
  const startDate = toIsoDate(addDays(new Date(`${endDate}T00:00:00.000Z`), -days));

  try {
    const result =
      base === quote
        ? {
            source: "identity",
            points: makeIdentityPoints(startDate, endDate),
            warnings: [],
          }
        : await fetchHistoricalPointsWithFallback(base, quote, startDate, endDate);

    return NextResponse.json({
      base,
      quote,
      days,
      startDate,
      endDate,
      source: result.source,
      points: result.points,
      warnings: result.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof HistoricalProviderError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unable to load historical rates.",
        warnings: error instanceof HistoricalProviderError ? error.warnings : [],
        base,
        quote,
        startDate,
        endDate,
      },
      { status: 502 },
    );
  }
}

class HistoricalProviderError extends Error {
  constructor(
    message: string,
    public warnings: ProviderWarning[],
  ) {
    super(message);
    this.name = "HistoricalProviderError";
  }
}

async function fetchHistoricalPointsWithFallback(
  base: string,
  quote: string,
  startDate: string,
  endDate: string,
): Promise<HistoricalProviderResult> {
  const warnings: ProviderWarning[] = [];

  if (shouldPreferFawazHistory(base, quote)) {
    try {
      return {
        source: "DeltaMarkets (fawazahmed0)",
        points: await fetchFawazPoints(base, quote, startDate, endDate),
        warnings,
      };
    } catch (error) {
      warnings.push({
        provider: "DeltaMarkets (fawazahmed0)",
        message: getErrorMessage(error),
      });
    }

    warnings.push({
      provider: "Frankfurter",
      message: "Skipped for stablecoin chart fallback: Frankfurter does not cover USDT or USDC.",
    });
    warnings.push({
      provider: "ExchangeRate-API",
      message:
        "Skipped for chart fallback: the no-key open.er-api.com endpoint is latest-only; dated history requires their API-key historical endpoint.",
    });

    throw new HistoricalProviderError("All historical rate providers failed.", warnings);
  }

  try {
    return {
      source: "Frankfurter",
      points: await fetchFrankfurterPoints(base, quote, startDate, endDate),
      warnings,
    };
  } catch (error) {
    warnings.push({
      provider: "Frankfurter",
      message: getErrorMessage(error),
    });
  }

  warnings.push({
    provider: "ExchangeRate-API",
    message:
      "Skipped for chart fallback: the no-key open.er-api.com endpoint is latest-only; dated history requires their API-key historical endpoint.",
  });

  try {
    return {
      source: "DeltaMarkets (fawazahmed0)",
      points: await fetchFawazPoints(base, quote, startDate, endDate),
      warnings,
    };
  } catch (error) {
    warnings.push({
      provider: "DeltaMarkets (fawazahmed0)",
      message: getErrorMessage(error),
    });
  }

  throw new HistoricalProviderError("All historical rate providers failed.", warnings);
}

function shouldPreferFawazHistory(base: string, quote: string): boolean {
  return FAWAZ_HISTORICAL_CODES.has(base) || FAWAZ_HISTORICAL_CODES.has(quote);
}

async function fetchFrankfurterPoints(
  base: string,
  quote: string,
  startDate: string,
  endDate: string,
): Promise<HistoricalPoint[]> {
  const url = `${FRANKFURTER_TIME_SERIES_URL}/${startDate}..${endDate}?base=${encodeURIComponent(
    base,
  )}&symbols=${encodeURIComponent(quote)}`;
  const data = await fetchJsonCached<FrankfurterTimeSeriesResponse>(url);

  if (!data.rates || typeof data.rates !== "object") {
    throw new Error("Historical rate response was malformed.");
  }

  const dailyRates = new Map<string, number>();
  Object.entries(data.rates).forEach(([date, rates]) => {
    const rate = rates?.[quote];

    if (typeof rate === "number" && Number.isFinite(rate)) {
      dailyRates.set(date, rate);
    }
  });

  if (dailyRates.size === 0) {
    throw new Error(`No historical ${base}/${quote} rates were returned.`);
  }

  return makeDailyPoints(startDate, endDate, dailyRates);
}

async function fetchFawazPoints(
  base: string,
  quote: string,
  startDate: string,
  endDate: string,
): Promise<HistoricalPoint[]> {
  const failures: string[] = [];
  const dailyRates = new Map<string, number>();
  const dates = eachIsoDate(startDate, endDate);

  await mapWithConcurrency(dates, FAWAZ_CONCURRENCY, async (date) => {
    try {
      const rate = await fetchFawazDatedRate(base, quote, date);
      dailyRates.set(date, rate);
    } catch (error) {
      failures.push(`${date}: ${getErrorMessage(error)}`);
    }
  });

  if (dailyRates.size === 0) {
    const details = failures.slice(0, 3).join("; ");
    throw new Error(
      `No usable fawazahmed0 historical ${base}/${quote} rates were returned.${
        details ? ` ${details}` : ""
      }`,
    );
  }

  return makeDailyPoints(startDate, endDate, dailyRates);
}

async function fetchFawazDatedRate(
  base: string,
  quote: string,
  date: string,
): Promise<number> {
  const baseCode = base.toLowerCase();
  const quoteCode = quote.toLowerCase();
  const urls = [
    `${FAWAZ_JSDELIVR_URL}@${date}/v1/currencies/${baseCode}.json`,
    `https://${date}.${FAWAZ_CLOUDFLARE_HOST}/v1/currencies/${baseCode}.json`,
  ];
  let lastError: unknown;

  for (const url of urls) {
    try {
      const data = await fetchJsonCached<FawazCurrencyResponse>(url);
      const rates = data[baseCode];

      if (!isRecord(rates)) {
        throw new Error(`Missing ${baseCode} rate map.`);
      }

      const rate = rates[quoteCode] ?? rates[quote];

      if (typeof rate !== "number" || !Number.isFinite(rate)) {
        throw new Error(`Missing ${base}/${quote} rate.`);
      }

      return rate;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(getErrorMessage(lastError));
}

async function fetchJsonCached<T>(url: string): Promise<T> {
  const cached = cache.get(url);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Historical rate API returned ${response.status}.`);
    }

    const data = (await response.json()) as T;
    cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Timed out loading historical rates.");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function makeDailyPoints(
  startDate: string,
  endDate: string,
  dailyRates: Map<string, number>,
): HistoricalPoint[] {
  const sortedDates = [...dailyRates.keys()].sort();
  const firstRate = dailyRates.get(sortedDates[0]) ?? 0;
  let lastRate = firstRate;
  let sourceDate = sortedDates[0];
  const points: HistoricalPoint[] = [];

  for (const date of eachIsoDate(startDate, endDate)) {
    const directRate = dailyRates.get(date);

    if (typeof directRate === "number") {
      lastRate = directRate;
      sourceDate = date;
    }

    points.push({
      date,
      rate: lastRate,
      sourceDate,
      filled: typeof directRate !== "number",
    });
  }

  return points;
}

function makeIdentityPoints(startDate: string, endDate: string): HistoricalPoint[] {
  return eachIsoDate(startDate, endDate).map((date) => ({
    date,
    rate: 1,
    sourceDate: date,
    filled: false,
  }));
}

function eachIsoDate(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normalizeCurrency(value: string): string {
  return value.trim().toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown provider error.";
}

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  callback: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, values.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        await callback(values[index]);
      }
    }),
  );
}
