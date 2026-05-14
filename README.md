# Multi-Leg FX Router

A Vercel-ready Next.js app that finds the top 3 recipient-maximizing FX/payment routes between a source currency, target currency, and source amount. It supports directed routes with up to 3 legs and keeps live provider failures isolated so partial provider outages still return useful routes.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm test
npm run build
```

## Deploy To Vercel

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Deploy with the default Next.js settings.

No database, secrets, API keys, or environment variables are required.

## Architecture Overview

- `app/page.tsx` renders the main application shell.
- `app/api/routes/route.ts` exposes `POST /api/routes` for route calculation.
- `app/api/analytics/history/route.ts` exposes `GET /api/analytics/history` for dated FX chart history.
- `components/` contains the form, warning state, route cards, and leg breakdown table.
- `data/providers.json` stores live and static provider configuration.
- `lib/providers.ts` loads provider config and creates static directed edges.
- `lib/rates.ts` fetches and normalizes live provider quotes with timeouts, caching, and provider-level warnings.
- `lib/graph.ts` builds directed graph paths without cycles.
- `lib/fees.ts` applies each provider fee model to one leg.
- `lib/router.ts` validates requests, fetches live edges, simulates candidates, ranks routes, and returns the top 3.
- `tests/router.test.ts` covers core fee, graph, cycle, max-leg, and ranking behavior.

## Routing Model

Currencies are graph nodes. Provider quotes are directed graph edges. Every edge includes:

- from currency
- to currency
- provider
- rate
- fee percent
- flat fee
- fee currency

The router enumerates every valid path from source to target with 1, 2, or 3 legs. It does not use a naive shortest-path or best-rate algorithm because flat and percent fees depend on the running amount at each leg.

For each leg:

```text
total_fee = leg_amount * fee_percent + fee_flat
post_fee_amount = leg_amount - total_fee
leg_output = post_fee_amount * rate
```

If the post-fee amount is zero or negative, that candidate path is discarded. Valid paths are ranked by final recipient amount, highest first. Total fees are returned by fee currency because fees from different legs are not safely additive without conversion.

## Provider Failure Handling

Live providers are fetched with `AbortController` timeouts and `Promise.allSettled`. One provider can be down, malformed, missing a rate, or timed out without failing the whole request. The API returns provider warnings alongside any routes found from remaining live and static providers.

Live responses are cached briefly in memory to reduce repeated calls during local development and review.

## Analytics Charts

Fiat chart modals fetch dated USD quote history through the local Next.js API route. The route tries Frankfurter's time-series API first, then falls back to DeltaMarkets/fawazahmed0 dated CDN files if Frankfurter fails. ExchangeRate-API's no-key open endpoint is not used as a chart fallback because it only serves latest rates; its historical endpoint requires an API key/paid historical access.

For example, `30D` requests the calendar range from 30 days ago through today, normalizes each day into a chart point, and carries the latest available market rate across weekends or not-yet-published current-day data. Hover tooltips show both the rate and calendar date.

Crypto/stablecoin analytics use local indicative sample data because the no-key Frankfurter API does not provide USDT/USDC history.

## AI Tools Used

I used OpenAI Codex to scaffold the project, implement the routing engine, write the Next.js API/UI, and add tests. I also used package registry checks for current dependency versions before pinning them in `package.json`.

## One Thing The AI Got Wrong

The easy mistake was treating provider fees as one total number. That is wrong because later-leg fees can be charged in intermediate currencies like USD or USDT. The implementation returns `totalFeesByCurrency` and the UI shows exact per-leg fees instead of pretending all fees are directly additive.

## What I Would Do Differently With More Time

I would add a richer quote freshness and observability layer: provider latency, cache age, and per-base success rates in the response. That would make operational review easier without changing the routing model.
