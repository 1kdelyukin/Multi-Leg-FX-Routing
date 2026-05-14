import { calculateLeg } from "./fees";
import { buildEdges, findCandidatePaths } from "./graph";
import {
  getCurrencyUniverse,
  getStaticEdges,
  loadProviders,
  normalizeCurrencyCode,
} from "./providers";
import { fetchLiveProviderEdges } from "./rates";
import type {
  CandidateRoute,
  Provider,
  ProviderWarning,
  RateEdge,
  RouteMode,
  RoutingRequest,
  RoutingResponse,
} from "./types";

const MAX_LEGS = 3;
const CURRENCY_CODE_PATTERN = /^[A-Z]{3,5}$/;

export class RoutingValidationError extends Error {
  status = 400;
}

export async function getTopRoutes(
  request: RoutingRequest,
): Promise<RoutingResponse> {
  const normalizedRequest = normalizeRoutingRequest(request);
  validateRoutingRequest(normalizedRequest);

  const providers = loadProviders();
  const staticEdges = getStaticEdges(providers);
  const universe = getCurrencyUniverse(providers, normalizedRequest);
  const liveResults = await fetchAllLiveEdges(providers, universe);
  const allEdges = buildEdges(providers, liveResults.edges, staticEdges);
  const modeFilteredEdges = filterEdgesForMode(
    allEdges,
    normalizedRequest.routeMode ?? "all",
  );
  const routes = rankRoutesForEdges(normalizedRequest, modeFilteredEdges);
  const warnings = [...liveResults.warnings];

  const directAmount = getBestDirectAmount(
    normalizedRequest,
    modeFilteredEdges,
  );

  if (routes.length === 0) {
    warnings.push({
      provider: "Router",
      message: `No valid route found from ${normalizedRequest.source} to ${normalizedRequest.target}.`,
    });
  }

  return {
    source: normalizedRequest.source,
    target: normalizedRequest.target,
    amount: normalizedRequest.amount,
    routes,
    warnings,
    directAmount,
  };
}

export function rankRoutesForEdges(
  request: RoutingRequest,
  edges: RateEdge[],
): CandidateRoute[] {
  const normalizedRequest = normalizeRoutingRequest(request);
  validateRoutingRequest(normalizedRequest);

  const candidatePaths = findCandidatePaths(
    edges,
    normalizedRequest.source,
    normalizedRequest.target,
    MAX_LEGS,
  );

  const simulatedRoutes = candidatePaths
    .map((path) => simulatePath(path, normalizedRequest.amount))
    .filter((route): route is Omit<CandidateRoute, "rank"> => Boolean(route));

  return simulatedRoutes
    .sort((left, right) => right.finalAmount - left.finalAmount)
    .slice(0, 3)
    .map((route, index) => ({
      ...route,
      rank: index + 1,
    }));
}

function simulatePath(
  path: RateEdge[],
  initialAmount: number,
): Omit<CandidateRoute, "rank"> | null {
  let runningAmount = initialAmount;
  const legs = [];
  const totalFeesByCurrency: Record<string, number> = {};

  for (const edge of path) {
    const leg = calculateLeg(runningAmount, edge);

    if (!leg) {
      return null;
    }

    legs.push(leg);
    totalFeesByCurrency[edge.feeCurrency] =
      (totalFeesByCurrency[edge.feeCurrency] ?? 0) + leg.feeAmount;
    runningAmount = leg.outputAmount;
  }

  return {
    path: [path[0].from, ...path.map((edge) => edge.to)],
    finalAmount: runningAmount,
    totalFeesByCurrency,
    legs,
  };
}

async function fetchAllLiveEdges(
  providers: Provider[],
  universe: string[],
): Promise<{ edges: RateEdge[]; warnings: ProviderWarning[] }> {
  const liveProviders = providers.filter(
    (provider) => provider.rate_source !== "static",
  );

  const settled = await Promise.allSettled(
    liveProviders.map(async (provider) => {
      const bases = getProviderBases(provider, universe);
      return fetchLiveProviderEdges(provider, bases, universe);
    }),
  );

  const edges: RateEdge[] = [];
  const warnings: ProviderWarning[] = [];

  settled.forEach((result, index) => {
    const provider = liveProviders[index];

    if (result.status === "fulfilled") {
      edges.push(...result.value.edges);
      warnings.push(...result.value.warnings);
      return;
    }

    warnings.push({
      provider: provider.name,
      message: result.reason instanceof Error ? result.reason.message : "Unknown provider error",
    });
  });

  return { edges, warnings };
}

function getProviderBases(provider: Provider, universe: string[]): string[] {
  if (!provider.supported_currencies || provider.supported_currencies.length === 0) {
    return universe;
  }

  const supported = new Set(provider.supported_currencies.map(normalizeCurrencyCode));
  return universe.filter((currency) => supported.has(currency));
}

function filterEdgesForMode(edges: RateEdge[], mode: RouteMode): RateEdge[] {
  if (mode === "fiat_only") {
    return edges.filter((edge) => edge.providerType === "fiat_broker");
  }

  return edges;
}

function normalizeRoutingRequest(request: RoutingRequest): RoutingRequest {
  return {
    source: normalizeCurrencyCode(request.source ?? ""),
    target: normalizeCurrencyCode(request.target ?? ""),
    amount:
      typeof request.amount === "number"
        ? request.amount
        : Number(request.amount),
    routeMode: request.routeMode === "fiat_only" ? "fiat_only" : "all",
  };
}

function validateRoutingRequest(request: RoutingRequest) {
  if (!request.source || !CURRENCY_CODE_PATTERN.test(request.source)) {
    throw new RoutingValidationError("Source currency must be a valid currency code.");
  }

  if (!request.target || !CURRENCY_CODE_PATTERN.test(request.target)) {
    throw new RoutingValidationError("Target currency must be a valid currency code.");
  }

  if (request.source === request.target) {
    throw new RoutingValidationError("Source and target currencies must be different.");
  }

  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    throw new RoutingValidationError("Amount must be a positive finite number.");
  }
}

function getBestDirectAmount(
  request: RoutingRequest,
  edges: RateEdge[],
): number | undefined {
  const directEdges = edges.filter(
    (edge) => edge.from === request.source && edge.to === request.target,
  );

  if (directEdges.length === 0) {
    return undefined;
  }

  let best: number | undefined;

  for (const edge of directEdges) {
    const leg = calculateLeg(request.amount, edge);
    if (leg && (best === undefined || leg.outputAmount > best)) {
      best = leg.outputAmount;
    }
  }

  return best;
}
