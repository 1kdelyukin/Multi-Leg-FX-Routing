import type {
  LiveProviderResult,
  Provider,
  ProviderWarning,
  RateEdge,
} from "./types";
import { normalizeCurrencyCode } from "./providers";

const DEFAULT_TIMEOUT_MS = 3500;
const CACHE_TTL_MS = 5 * 60 * 1000;

type JsonRecord = Record<string, unknown>;
type CachedJson = {
  expiresAt: number;
  data: unknown;
};

const jsonCache = new Map<string, CachedJson>();

export async function fetchLiveProviderEdges(
  provider: Provider,
  baseCurrencies: string[],
  quoteCurrencies = baseCurrencies,
): Promise<LiveProviderResult> {
  switch (provider.rate_source) {
    case "frankfurter":
      return fetchAlphaFXEdges(provider, baseCurrencies, quoteCurrencies);
    case "exchange_rate_api":
      return fetchBetaBankEdges(provider, baseCurrencies, quoteCurrencies);
    case "fawazahmed0":
      return fetchDeltaMarketsEdges(provider, baseCurrencies, quoteCurrencies);
    case "static":
      return { edges: [], warnings: [] };
    default:
      return {
        edges: [],
        warnings: [
          {
            provider: provider.name,
            message: `Unsupported rate source: ${provider.rate_source}`,
          },
        ],
      };
  }
}

export async function fetchAlphaFXEdges(
  provider: Provider,
  baseCurrencies: string[],
  quoteCurrencies = baseCurrencies,
): Promise<LiveProviderResult> {
  const endpoint = requireEndpoint(provider);
  const allowedQuotes = makeCurrencySet(quoteCurrencies);
  const bases = normalizeCurrencyList(baseCurrencies);
  const settled = await Promise.allSettled(
    bases.map(async (base) => {
      const url = `${endpoint}?base=${encodeURIComponent(base)}`;
      const data = await fetchJsonCached(provider, base, url);

      if (!isRecord(data) || !isRecord(data.rates)) {
        throw new Error(`Malformed response for ${base}`);
      }

      return ratesToEdges(provider, base, data.rates, allowedQuotes);
    }),
  );

  return flattenSettled(provider, bases, settled);
}

export async function fetchBetaBankEdges(
  provider: Provider,
  baseCurrencies: string[],
  quoteCurrencies = baseCurrencies,
): Promise<LiveProviderResult> {
  const endpoint = requireEndpoint(provider);
  const allowedQuotes = makeCurrencySet(quoteCurrencies);
  const bases = normalizeCurrencyList(baseCurrencies);
  const settled = await Promise.allSettled(
    bases.map(async (base) => {
      const url = `${endpoint}/${encodeURIComponent(base)}`;
      const data = await fetchJsonCached(provider, base, url);

      if (!isRecord(data)) {
        throw new Error(`Malformed response for ${base}`);
      }

      if (typeof data.result === "string" && data.result !== "success") {
        throw new Error(`Provider returned result=${data.result} for ${base}`);
      }

      const rates = isRecord(data.conversion_rates)
        ? data.conversion_rates
        : data.rates;

      if (!isRecord(rates)) {
        throw new Error(`Missing rates for ${base}`);
      }

      return ratesToEdges(provider, base, rates, allowedQuotes);
    }),
  );

  return flattenSettled(provider, bases, settled);
}

export async function fetchDeltaMarketsEdges(
  provider: Provider,
  baseCurrencies: string[],
  quoteCurrencies = baseCurrencies,
): Promise<LiveProviderResult> {
  const endpoint = requireEndpoint(provider);
  const allowedQuotes = makeCurrencySet(quoteCurrencies);
  const bases = normalizeCurrencyList(baseCurrencies);
  const settled = await Promise.allSettled(
    bases.map(async (base) => {
      const lowerBase = base.toLowerCase();
      const url = `${endpoint}/${encodeURIComponent(lowerBase)}.json`;
      const data = await fetchJsonCached(provider, base, url);

      if (!isRecord(data)) {
        throw new Error(`Malformed response for ${base}`);
      }

      const rates = data[lowerBase] ?? data[base] ?? data.rates;

      if (!isRecord(rates)) {
        throw new Error(`Missing rates for ${base}`);
      }

      return ratesToEdges(provider, base, rates, allowedQuotes);
    }),
  );

  return flattenSettled(provider, bases, settled);
}

export async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Timed out fetching rates");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function requireEndpoint(provider: Provider): string {
  if (!provider.endpoint) {
    throw new Error(`Provider ${provider.name} is missing endpoint`);
  }

  return provider.endpoint;
}

async function fetchJsonCached(
  provider: Provider,
  base: string,
  url: string,
): Promise<unknown> {
  const cacheKey = `${provider.name}:${base}`;
  const cached = jsonCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const timeoutMs = provider.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  const data = await withTimeout(async (signal) => {
    const response = await fetch(url, { cache: "no-store", signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${base}`);
    }

    return response.json() as Promise<unknown>;
  }, timeoutMs);

  jsonCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });

  return data;
}

function ratesToEdges(
  provider: Provider,
  base: string,
  rates: JsonRecord,
  allowedQuotes: Set<string>,
): RateEdge[] {
  return Object.entries(rates)
    .map(([quote, rawRate]) => {
      const to = normalizeCurrencyCode(quote);
      const rate = typeof rawRate === "number" ? rawRate : Number(rawRate);

      if (
        to === base ||
        !allowedQuotes.has(to) ||
        !Number.isFinite(rate) ||
        rate <= 0
      ) {
        return null;
      }

      const feeCurrency =
        provider.fee_model.fee_currency === "source"
          ? base
          : normalizeCurrencyCode(provider.fee_model.fee_currency);

      return {
        id: `${provider.name}:${base}:${to}`,
        from: base,
        to,
        provider: provider.name,
        providerType: provider.type,
        rateSource: provider.rate_source,
        rate,
        feePercent: provider.fee_model.fee_percent,
        feeFlat: provider.fee_model.fee_flat,
        feeCurrency,
      };
    })
    .filter((edge): edge is RateEdge => Boolean(edge));
}

function flattenSettled(
  provider: Provider,
  bases: string[],
  settled: PromiseSettledResult<RateEdge[]>[],
): LiveProviderResult {
  const edges: RateEdge[] = [];
  const warnings: ProviderWarning[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      edges.push(...result.value);
      return;
    }

    warnings.push({
      provider: provider.name,
      message: `${bases[index]}: ${getErrorMessage(result.reason)}`,
    });
  });

  return { edges, warnings };
}

function normalizeCurrencyList(currencies: string[]): string[] {
  return [...new Set(currencies.map(normalizeCurrencyCode))].sort();
}

function makeCurrencySet(currencies: string[]): Set<string> {
  return new Set(normalizeCurrencyList(currencies));
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown provider error";
}
