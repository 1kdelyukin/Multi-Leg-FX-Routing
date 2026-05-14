import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Provider, RateEdge, RoutingRequest, StaticPair } from "./types";

const COMMON_CURRENCIES = [
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

let providerCache: Provider[] | null = null;

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function loadProviders(): Provider[] {
  if (providerCache) {
    return providerCache;
  }

  const filePath = join(process.cwd(), "data", "providers.json");
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown;

  if (!Array.isArray(raw)) {
    throw new Error("providers.json must contain an array of providers");
  }

  providerCache = raw.map(parseProvider);
  return providerCache;
}

export function getStaticEdges(providers: Provider[]): RateEdge[] {
  return providers.flatMap((provider) => {
    const pairs = provider.static_pairs ?? [];

    return pairs
      .map((pair) => createEdge(provider, normalizeStaticPair(pair)))
      .filter((edge): edge is RateEdge => Boolean(edge));
  });
}

export function getCurrencyUniverse(
  providers: Provider[],
  request: RoutingRequest,
): string[] {
  const currencies = new Set<string>([
    normalizeCurrencyCode(request.source),
    normalizeCurrencyCode(request.target),
    ...COMMON_CURRENCIES,
  ]);

  providers.forEach((provider) => {
    provider.supported_currencies?.forEach((currency) => {
      currencies.add(normalizeCurrencyCode(currency));
    });

    provider.static_pairs?.forEach((pair) => {
      currencies.add(normalizeCurrencyCode(pair.from));
      currencies.add(normalizeCurrencyCode(pair.to));
    });
  });

  return [...currencies].sort();
}

function parseProvider(raw: unknown): Provider {
  if (!isRecord(raw)) {
    throw new Error("Invalid provider entry");
  }

  const name = readString(raw, "name");
  const type = readString(raw, "type");
  const rateSource = readString(raw, "rate_source");
  const feeModel = raw.fee_model;

  if (type !== "fiat_broker" && type !== "stablecoin_venue") {
    throw new Error(`Invalid provider type for ${name}`);
  }

  if (
    rateSource !== "frankfurter" &&
    rateSource !== "exchange_rate_api" &&
    rateSource !== "fawazahmed0" &&
    rateSource !== "static"
  ) {
    throw new Error(`Invalid rate_source for ${name}`);
  }

  if (!isRecord(feeModel)) {
    throw new Error(`Invalid fee_model for ${name}`);
  }

  return {
    name,
    type,
    rate_source: rateSource,
    endpoint: readOptionalString(raw, "endpoint"),
    supported_currencies: readOptionalStringArray(raw, "supported_currencies"),
    timeout_ms: readOptionalNumber(raw, "timeout_ms"),
    fee_model: {
      fee_percent: readNumber(feeModel, "fee_percent"),
      fee_flat: readNumber(feeModel, "fee_flat"),
      fee_currency: readString(feeModel, "fee_currency"),
    },
    static_pairs: readStaticPairs(raw.static_pairs),
  };
}

function createEdge(provider: Provider, pair: StaticPair): RateEdge | null {
  if (!Number.isFinite(pair.rate) || pair.rate <= 0) {
    return null;
  }

  const feeCurrency =
    provider.fee_model.fee_currency === "source"
      ? pair.from
      : normalizeCurrencyCode(provider.fee_model.fee_currency);

  return {
    id: `${provider.name}:${pair.from}:${pair.to}`,
    from: pair.from,
    to: pair.to,
    provider: provider.name,
    providerType: provider.type,
    rateSource: provider.rate_source,
    rate: pair.rate,
    feePercent: provider.fee_model.fee_percent,
    feeFlat: provider.fee_model.fee_flat,
    feeCurrency,
  };
}

function normalizeStaticPair(pair: StaticPair): StaticPair {
  return {
    from: normalizeCurrencyCode(pair.from),
    to: normalizeCurrencyCode(pair.to),
    rate: pair.rate,
  };
}

function readStaticPairs(value: unknown): StaticPair[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("static_pairs must be an array when provided");
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Invalid static pair entry");
    }

    return {
      from: readString(entry, "from"),
      to: readString(entry, "to"),
      rate: readNumber(entry, "rate"),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Expected non-empty string field: ${key}`);
  }

  return value;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Expected optional string field: ${key}`);
  }

  return value;
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected finite number field: ${key}`);
  }

  return value;
}

function readOptionalNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Expected optional finite number field: ${key}`);
  }

  return value;
}

function readOptionalStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const value = record[key];

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`Expected optional string array field: ${key}`);
  }

  return value.map((entry) => normalizeCurrencyCode(entry));
}
