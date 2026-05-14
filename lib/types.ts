export type ProviderType = "fiat_broker" | "stablecoin_venue";

export type RateSource =
  | "frankfurter"
  | "exchange_rate_api"
  | "fawazahmed0"
  | "static";

export type RouteMode = "all" | "fiat_only";

export interface FeeModel {
  fee_percent: number;
  fee_flat: number;
  fee_currency: "source" | string;
}

export interface StaticPair {
  from: string;
  to: string;
  rate: number;
}

export interface Provider {
  name: string;
  type: ProviderType;
  rate_source: RateSource;
  endpoint?: string;
  supported_currencies?: string[];
  timeout_ms?: number;
  fee_model: FeeModel;
  static_pairs?: StaticPair[];
}

export interface RateEdge {
  id: string;
  from: string;
  to: string;
  provider: string;
  providerType: ProviderType;
  rateSource: RateSource;
  rate: number;
  feePercent: number;
  feeFlat: number;
  feeCurrency: string;
}

export interface RouteLeg {
  from: string;
  to: string;
  provider: string;
  providerType: ProviderType;
  inputAmount: number;
  feePercent: number;
  feeFlat: number;
  feeAmount: number;
  postFeeAmount: number;
  rate: number;
  outputAmount: number;
}

export interface CandidateRoute {
  rank: number;
  path: string[];
  finalAmount: number;
  totalFeesByCurrency: Record<string, number>;
  legs: RouteLeg[];
}

export interface RoutingRequest {
  source: string;
  target: string;
  amount: number;
  routeMode?: RouteMode;
}

export interface ProviderWarning {
  provider: string;
  message: string;
}

export interface RoutingResponse {
  source: string;
  target: string;
  amount: number;
  routes: CandidateRoute[];
  warnings: ProviderWarning[];
  directAmount?: number;
}

export interface LiveProviderResult {
  edges: RateEdge[];
  warnings: ProviderWarning[];
}
