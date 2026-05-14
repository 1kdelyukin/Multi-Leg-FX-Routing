import type { RateEdge, RouteLeg } from "./types";

export function calculateLeg(
  inputAmount: number,
  edge: RateEdge,
): RouteLeg | null {
  if (!Number.isFinite(inputAmount) || inputAmount <= 0) {
    return null;
  }

  if (!Number.isFinite(edge.rate) || edge.rate <= 0) {
    return null;
  }

  const feeAmount = inputAmount * edge.feePercent + edge.feeFlat;
  const postFeeAmount = inputAmount - feeAmount;

  if (postFeeAmount <= 0) {
    return null;
  }

  const outputAmount = postFeeAmount * edge.rate;

  return {
    from: edge.from,
    to: edge.to,
    provider: edge.provider,
    providerType: edge.providerType,
    inputAmount,
    feePercent: edge.feePercent,
    feeFlat: edge.feeFlat,
    feeAmount,
    postFeeAmount,
    rate: edge.rate,
    outputAmount,
  };
}
