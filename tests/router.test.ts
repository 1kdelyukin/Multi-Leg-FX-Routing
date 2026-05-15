import { describe, expect, it } from "vitest";

import { calculateLeg } from "../lib/fees";
import { findCandidatePaths } from "../lib/graph";
import { filterEdgesForMode, rankRoutesForEdges } from "../lib/router";
import type { RateEdge } from "../lib/types";

function edge(
  from: string,
  to: string,
  provider: string,
  rate: number,
  feePercent = 0,
  feeFlat = 0,
): RateEdge {
  return {
    id: `${provider}:${from}:${to}`,
    from,
    to,
    provider,
    providerType: provider.startsWith("Fiat")
      ? "fiat_broker"
      : "stablecoin_venue",
    rateSource: "static",
    rate,
    feePercent,
    feeFlat,
    feeCurrency: from,
  };
}

describe("fee calculation", () => {
  it("deducts percent and flat fees before applying the rate", () => {
    const result = calculateLeg(1000, edge("GBP", "USD", "Test", 1.25, 0.01, 5));

    expect(result).not.toBeNull();
    expect(result?.feeAmount).toBeCloseTo(15);
    expect(result?.postFeeAmount).toBeCloseTo(985);
    expect(result?.outputAmount).toBeCloseTo(1231.25);
  });

  it("invalidates small trades consumed by flat fees", () => {
    const result = calculateLeg(4, edge("GBP", "USD", "Test", 1.25, 0, 5));

    expect(result).toBeNull();
  });
});

describe("route discovery", () => {
  it("finds static multi-leg directed paths", () => {
    const edges = [
      edge("GBP", "USD", "A", 1.2),
      edge("USD", "JPY", "B", 150),
      edge("GBP", "EUR", "C", 1.1),
      edge("EUR", "JPY", "D", 160),
    ];

    const paths = findCandidatePaths(edges, "GBP", "JPY", 3);
    const pathStrings = paths.map((path) => path.map((leg) => leg.provider).join(">"));

    expect(pathStrings).toContain("A>B");
    expect(pathStrings).toContain("C>D");
  });

  it("does not return paths longer than 3 legs", () => {
    const edges = [
      edge("GBP", "USD", "A", 1),
      edge("USD", "EUR", "B", 1),
      edge("EUR", "CHF", "C", 1),
      edge("CHF", "JPY", "D", 1),
    ];

    const paths = findCandidatePaths(edges, "GBP", "JPY", 3);

    expect(paths).toHaveLength(0);
  });

  it("does not revisit currencies within a route", () => {
    const edges = [
      edge("GBP", "USD", "A", 1),
      edge("USD", "GBP", "B", 1),
      edge("USD", "JPY", "C", 1),
    ];

    const paths = findCandidatePaths(edges, "GBP", "JPY", 3);

    expect(paths).toHaveLength(1);
    expect(paths[0].map((leg) => leg.to)).toEqual(["USD", "JPY"]);
  });
});

describe("route ranking", () => {
  it("ranks by simulated final output instead of raw rate alone", () => {
    const edges = [
      edge("GBP", "JPY", "HighFeeDirect", 200, 0, 900),
      edge("GBP", "USD", "LowFeeFirst", 1.25, 0, 1),
      edge("USD", "JPY", "LowFeeSecond", 150, 0, 1),
    ];

    const routes = rankRoutesForEdges(
      { source: "GBP", target: "JPY", amount: 1000 },
      edges,
    );

    expect(routes[0].legs.map((leg) => leg.provider)).toEqual([
      "LowFeeFirst",
      "LowFeeSecond",
    ]);
    expect(routes[0].finalAmount).toBeGreaterThan(routes[1].finalAmount);
  });
});

describe("route mode filtering", () => {
  it("excludes stablecoin currencies in fiat-only mode even from fiat providers", () => {
    const edges = [
      edge("GBP", "USD", "FiatA", 1.25),
      edge("USD", "EUR", "FiatB", 0.92),
      edge("JPY", "USDT", "FiatC", 0.0063),
      edge("GBP", "USDC", "StableVenue", 1.26),
    ];

    const filtered = filterEdgesForMode(edges, "fiat_only");

    expect(filtered.map((filteredEdge) => `${filteredEdge.from}->${filteredEdge.to}`)).toEqual([
      "GBP->USD",
      "USD->EUR",
    ]);
  });
});
