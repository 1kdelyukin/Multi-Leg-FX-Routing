import type { Provider, RateEdge } from "./types";

export function buildEdges(
  providers: Provider[],
  liveEdges: RateEdge[],
  staticEdges: RateEdge[],
): RateEdge[] {
  const providerNames = new Set(providers.map((provider) => provider.name));

  return [...staticEdges, ...liveEdges].filter((edge) => {
    return (
      providerNames.has(edge.provider) &&
      edge.from !== edge.to &&
      Number.isFinite(edge.rate) &&
      edge.rate > 0
    );
  });
}

export function findCandidatePaths(
  edges: RateEdge[],
  source: string,
  target: string,
  maxLegs = 3,
): RateEdge[][] {
  const outgoing = new Map<string, RateEdge[]>();

  edges.forEach((edge) => {
    const current = outgoing.get(edge.from) ?? [];
    current.push(edge);
    outgoing.set(edge.from, current);
  });

  const paths: RateEdge[][] = [];

  function visit(
    currency: string,
    path: RateEdge[],
    visitedCurrencies: Set<string>,
  ) {
    if (path.length > 0 && currency === target) {
      paths.push([...path]);
      return;
    }

    if (path.length === maxLegs) {
      return;
    }

    const nextEdges = outgoing.get(currency) ?? [];

    nextEdges.forEach((edge) => {
      if (visitedCurrencies.has(edge.to)) {
        return;
      }

      visitedCurrencies.add(edge.to);
      path.push(edge);
      visit(edge.to, path, visitedCurrencies);
      path.pop();
      visitedCurrencies.delete(edge.to);
    });
  }

  visit(source, [], new Set([source]));

  return paths;
}
