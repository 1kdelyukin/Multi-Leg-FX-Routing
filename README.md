# Multi-Leg FX Router

Live Deploy: https://sdm-orcin-five.vercel.app 

## Table Of Contents

- [Architecture](#architecture)
- [Website Features](#website-features)
- [Providers, APIs, And Normalization](#providers-apis-and-normalization)
- [Detailed Architecture Modeling](#detailed-architecture-modeling)
- [Deployment](#deployment)
- [Testing](#testing)
- [AI Tools Used](#ai-tools-used)
- [One Thing The AI Got Wrong](#one-thing-the-ai-got-wrong)
- [What I Would Do Differently With More Time](#what-i-would-do-differently-with-more-time)

## Architecture

### Stack Used

- **Next.js App Router** for pages and server API routes.
- **TypeScript** across the app, routing engine, API handlers, and tests.
- **React** for interactive route search, route cards, analytics modals, and chart tooltips.
- **Tailwind CSS** for UI styling.
- **Vercel-compatible API routes** for server-side routing and analytics history fetching.
- **Vitest** for unit tests.
- **No database**. Provider config lives in `data/providers.json`.
- **No API keys or environment variables**. All live providers use public no-key endpoints.

### Deployment Type

The app is designed for **Vercel**:

- Static pages are prerendered where possible.
- `POST /api/routes` runs server-side on demand.
- `GET /api/analytics/history` runs server-side on demand.
- Live API calls use `fetch`, `AbortController`, and short in-memory caching.
- There are no long-running background processes.

### Important Files

```text
app/
  page.tsx                         Home page and top moving price band
  routes/page.tsx                  Main route search page
  analytics/page.tsx               Pair analytics page and historical chart modal
  api/routes/route.ts              POST route calculation endpoint
  api/analytics/history/route.ts   GET historical chart data endpoint

components/
  RouteForm.tsx                    Search form and route filter controls
  RouteResults.tsx                 Loading/error/warning/result states
  RouteCard.tsx                    Ranked route cards
  LegBreakdown.tsx                 Per-leg execution details

lib/
  providers.ts                     Provider config loading and static edge creation
  rates.ts                         Live provider fetchers and normalization
  graph.ts                         Directed graph path discovery
  fees.ts                          Per-leg fee and output calculation
  router.ts                        Request validation, simulation, ranking
  formatting.ts                    Currency, amount, rate formatting helpers

data/
  providers.json                   Six provider definitions and static pairs

tests/
  router.test.ts                   Routing and fee tests
  formatting.test.ts               Amount formatting tests
```

### High-Level Request Flow

```mermaid
flowchart LR
  User["User enters source, target, amount"] --> UI["Routes UI"]
  UI --> API["POST /api/routes"]
  API --> Router["lib/router.ts"]
  Router --> Providers["load providers.json"]
  Router --> Live["fetch live broker rates"]
  Router --> Static["load static stablecoin pairs"]
  Live --> Edges["normalized RateEdge[]"]
  Static --> Edges
  Edges --> Graph["find paths up to 3 legs"]
  Graph --> Sim["simulate fees and outputs"]
  Sim --> Rank["sort by final recipient amount"]
  Rank --> UIResults["top 3 route cards + warnings"]
```

## Website Features

### Home

- Landing page for the product.
- Top moving price band with common FX/stablecoin pairs.
- Quick search widget that navigates into the route search page.
- Navigation links for `Home`, `Routes`, and `Analytics`.

### Routes

- Inputs for source currency, target currency, and source amount.
- Amount input formats while typing and shows the source currency symbol.
- Route mode switch:
  - **All**: fiat broker plus stablecoin venue routes.
  - **Fiat Only**: only fiat broker routes between fiat currencies.
- Search button and estimated receive preview.
- Top 3 routes ranked by final recipient amount, highest first.
- Route cards show:
  - rank
  - final recipient amount
  - path with provider per leg
  - direct-route difference when a direct route exists
  - badges for fiat/stablecoin route types
  - total fees by fee currency
  - provider warnings when live APIs fail
  - per-leg execution detail table

### Analytics

- Fiat and crypto/stablecoin pair analytics views.
- Pair cards with current quote, recent change, and chart entry point.
- Pair cards and chart modals use the same `/api/analytics/history` data path, so the closed card price matches the opened chart's current price.
- Chart modal with `7D`, `30D`, `90D`, and `1Y` periods.
- Fiat charts pull dated daily API data.
- Stablecoin analytics intentionally show only `USDT` and `USDC`.
- Stablecoin charts pull dated daily data from fawazahmed0 because that API supports crypto symbols and historical date URLs.
- Chart tooltip shows rate and date inline, for example `0.85361 Thu, May 14`.
- Tooltip anchors to the chart edge so it does not cover high points.
- Historical chart endpoint has a provider fallback chain.

## Providers, APIs, And Normalization

Provider definitions are stored in `data/providers.json`. Every provider has:

- `name`
- `type`
- `rate_source`
- `fee_model`
- optional `endpoint`
- optional `supported_currencies`
- optional `static_pairs`

### Provider List

| Provider | Type | Rate Source | Fee Model |
| --- | --- | --- | --- |
| AlphaFX | fiat broker | Frankfurter live API | `0.0015` percent, `0` flat |
| BetaBank | fiat broker | ExchangeRate-API open endpoint | `0.0008` percent, `25` flat |
| DeltaMarkets | fiat broker | fawazahmed0 currency API | `0.0011` percent, `5` flat |
| GammaCrypto | stablecoin venue | static directed pairs | `0.0010` percent, `1` flat |
| EpsilonChain | stablecoin venue | static directed pairs | `0.0012` percent, `2` flat |
| ZetaSwap | stablecoin venue | static directed pairs | `0.0025` percent, `0` flat |

All fees are charged in the source currency of the leg.

### Live APIs Used For Routing

#### AlphaFX - Frankfurter

Example:

```http
GET https://api.frankfurter.dev/v1/latest?base=GBP
```

Typical shape:

```json
{
  "amount": 1,
  "base": "GBP",
  "date": "2026-05-14",
  "rates": {
    "USD": 1.33,
    "EUR": 1.17
  }
}
```

#### BetaBank - ExchangeRate-API Open Endpoint

Example:

```http
GET https://open.er-api.com/v6/latest/GBP
```

Possible shapes:

```json
{
  "result": "success",
  "provider": "...",
  "documentation": "...",
  "terms_of_use": "...",
  "time_last_update_unix": "...",
  "time_last_update_utc": "...",
  "time_next_update_unix": "...",
  "time_next_update_utc": "...",
  "time_eol_unix": "...",
  "base_code": "GBP",
  "rates": {
    "USD": 1.33
  }
}
```

or:

```json
{
  "result": "success",
  "provider": "...",
  "documentation": "...",
  "terms_of_use": "...",
  "time_last_update_unix": "...",
  "time_last_update_utc": "...",
  "time_next_update_unix": "...",
  "time_next_update_utc": "...",
  "time_eol_unix": "...",
  "base_code": "GBP",
  "conversion_rates": {
    "USD": 1.33
  }
}
```

#### DeltaMarkets - fawazahmed0 Currency API

Example:

```http
GET https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/gbp.json
```

Typical shape:

```json
{
  "date": "2026-05-14",
  "gbp": {
    "usd": 1.33,
    "eur": 1.17
  }
}
```

### Static Stablecoin Providers

GammaCrypto, EpsilonChain, and ZetaSwap use `static_pairs` in `providers.json`.


### Important modeling choice:

- Static pairs are **directed**.
- The router does **not** infer reverse rates.
- If `USDT -> JPY` exists but `JPY -> USDT` does not, only `USDT -> JPY` is available.

- Use request base as `from`.
- Each `rates` entry becomes one directed edge: `GBP -> USD`, `GBP -> EUR`, etc.
- DeltaMarkets API Currency codes --> Normalized to uppercase.
- BetaBank API --> Accept either `rates` or `conversion_rates`.
- BetaBank API --> Reject non-success responses when `result` is present.
- Convert each valid quote into a directed `RateEdge`.
- The nested base map is converted into directed `RateEdge` objects.

### RateEdge Normalization

All live and static quotes are normalized into the same internal shape:

```ts
type RateEdge = {
  from: string;
  to: string;
  provider: string;
  providerType: "fiat_broker" | "stablecoin_venue";
  rateSource: "frankfurter" | "exchange_rate_api" | "fawazahmed0" | "static";
  rate: number;
  feePercent: number;
  feeFlat: number;
  feeCurrency: string;
};
```

This lets the graph and fee simulation treat all providers uniformly.

```mermaid
flowchart TD
  A["Frankfurter response"] --> N["Normalize into RateEdge[]"]
  B["ExchangeRate-API response"] --> N
  C["fawazahmed0 response"] --> N
  D["static providers.json pairs"] --> N
  N --> G["Graph routing engine"]
  G --> P["Enumerate paths, simulate fees, rank top 3"]
```

### Failure Handling

The live provider fetch layer is defensive because public APIs can be slow, unavailable, malformed, or missing specific currency pairs. The app handles this with three main mechanisms.

#### 1. Timeouts

Every live provider request is wrapped with `AbortController`.

If a provider takes too long, the request is cancelled and converted into a warning instead of blocking the entire search.

```text
BetaBank takes too long
        |
        v
request is aborted
        |
        v
router continues with AlphaFX, DeltaMarkets, and static providers
```

#### 2. Isolated Provider Failures

Live providers are fetched with `Promise.allSettled`, not `Promise.all`.

That means one failed provider does not fail the whole routing request.

```text
AlphaFX       fulfilled
BetaBank      rejected
DeltaMarkets  fulfilled
        |
        v
Use AlphaFX + DeltaMarkets
Return warning for BetaBank
```

#### 3. Response And Rate Validation

The app validates provider responses before turning them into graph edges.

It checks for:

- expected response shape, such as `rates` or `conversion_rates`
- provider success status when the API returns one
- missing rates
- non-numeric rates
- non-finite values
- zero or negative rates

Only valid quotes become `RateEdge` objects. Invalid data is skipped so bad provider data cannot produce bad route recommendations.

Additional handling:

- Provider warnings are returned in the API response and shown in the UI.
- Live responses are cached briefly in memory to reduce repeated calls during local testing.

## Detailed Architecture Modeling

### Route Search Model

Currencies are graph nodes. Provider quotes are directed graph edges.

Example graph:

```mermaid
flowchart LR
  GBP((GBP))
  USD((USD))
  JPY((JPY))
  USDT((USDT))
  USDC((USDC))
  CHF((CHF))

  GBP -- "AlphaFX" --> USD
  USD -- "BetaBank" --> JPY
  GBP -- "GammaCrypto" --> USDC
  GBP -- "DeltaMarkets" --> USDT
  USDT -- "ZetaSwap" --> CHF
  CHF -- "AlphaFX" --> JPY
  USDC -- "EpsilonChain" --> JPY
```

The router does not choose routes by best individual rate. It enumerates candidate paths and simulates the actual money movement through every leg.

```mermaid
flowchart TD
  A["Validate request"] --> B["Load providers"]
  B --> C["Build currency universe"]
  C --> D["Fetch live fiat broker edges"]
  C --> E["Load static stablecoin edges"]
  D --> F["Merge normalized edges"]
  E --> F
  F --> G{"Route mode"}
  G -->|All| H["Use fiat + stablecoin edges"]
  G -->|Fiat Only| I["Keep fiat broker edges between fiat currencies only"]
  H --> J["DFS paths from source to target"]
  I --> J
  J --> K["Reject cycles and paths over 3 legs"]
  K --> L["Simulate each path"]
  L --> M["Discard legs where fees consume amount"]
  M --> N["Sort by final output descending"]
  N --> O["Return top 3"]
```

**Path Search**

Depth-first search is used. That means it starts at the source currency and keeps walking until either:
- it reaches target currency
- it hits 3 legs
- it would revisit a currency

At this stage, the app has only found possible paths.

**Fee Simulation**

Each valid leg is simulated and fees are applied at each stage:

```text
total_fee = leg_amount * fee_percent + fee_flat
post_fee_amount = leg_amount - total_fee
leg_output = post_fee_amount * rate
```

If `post_fee_amount <= 0`, the leg is invalid and the whole route is discarded.

Flat fees matter because the best route can change by amount size. A route with a low percent fee and high flat fee might be bad for a small amount but strong for a large amount.

**Ranking & Direct Route**
Inside the backend, the router calculates two things:

**The top 3 best routes**
After simulating every candidate route, the app sorts them:

```text
#1 best final recipient amount
#2 second best
#3 third best
```

**The best direct route amount, if a direct route exists.**
The direct route means a one-leg route:
If multiple providers quote GBP -> JPY, it checks all of them:
```text
GBP -> [AlphaFX] -> JPY
GBP -> [BetaBank] -> JPY
GBP -> [DeltaMarkets] -> JPY
```
Then it simulates the fee and output for each direct edge and keeps the best direct output for comparison.

### Fiat And Crypto Route Behavior

**All mode**

- Includes fiat broker live edges.
- Includes stablecoin static edges.
- Can produce mixed routes such as:

```text
GBP -> [DeltaMarkets] -> USDT -> [ZetaSwap] -> CHF -> [AlphaFX] -> JPY
```

**Fiat Only mode**

- Filters out stablecoin venue edges.
- Allows only providers where `providerType === "fiat_broker"`.
- Requires every leg currency to be fiat, so `USDT` and `USDC` are excluded even when a live fiat API happens to quote them.
- The UI limits the currency picker to fiat currencies in this mode and moves an already-selected stablecoin to a valid fiat fallback.
- Can still produce multi-leg fiat paths such as:

```text
GBP -> [AlphaFX] -> CHF -> [AlphaFX] -> JPY
```

### Top Moving Price Band

The home page includes a lightweight scrolling price band backed by live daily rates fetched once per page load. It uses `GET /api/market/ticker`, which fetches current and previous daily quotes from the fawazahmed0 currency API. This provider is used for the band because it covers both fiat pairs and stablecoin pairs such as `USDT -> USD` and `GBP -> USDC`.

```mermaid
flowchart LR
  Home["Home page"] --> Component["MarketTicker component"]
  Component --> API["GET /api/market/ticker"]
  API --> Latest["fawazahmed0 @latest rates"]
  API --> Previous["fawazahmed0 previous-day rates"]
  Latest --> NormalizeTicker["Normalize ticker pairs"]
  Previous --> NormalizeTicker
  NormalizeTicker --> Direction["Compare latest vs previous"]
  Direction --> Track["Duplicate list for seamless ticker loop"]
  Track --> CSS["ticker-track CSS animation + fade mask"]
  CSS --> Band["moving live price band"]
```

Implementation notes:

- The ticker is live market context, but it is still not used in route ranking.
- The route engine fetches its own provider data through `/api/routes`.
- The ticker endpoint returns `rate`, `previousRate`, `change`, and `up` for each pair.
- The comparison uses the date reported by the `@latest` API response, then compares against the prior calendar day. This avoids comparing `@latest` to the same dated file when the provider has not published the current calendar day yet.
- Zero change is treated as neutral instead of green.
- If a ticker request fails, the component shows a loading/fallback state instead of breaking the page.
- Pairs are duplicated so the animation can loop continuously.
- CSS masks and faded borders make the band blend into the page.

### Chart Data Model

Analytics charts pull dated historical points through `GET /api/analytics/history`.

Example 30-day request:

```http
GET /api/analytics/history?base=USD&quote=EUR&days=30
```

Stablecoin example:

```http
GET /api/analytics/history?base=USD&quote=USDT&days=30
```

If today is May 14, the API requests the calendar range from Apr 14 through May 14. The endpoint returns one chart point per calendar day.

```mermaid
sequenceDiagram
  participant Modal as Analytics cards/modal
  participant API as /api/analytics/history
  participant F as Frankfurter
  participant E as ExchangeRate-API
  participant D as DeltaMarkets/fawazahmed0

  Modal->>API: base=USD, quote=EUR, days=30
  alt quote is USDT or USDC
    API->>D: /@2026-04-14/v1/currencies/usd.json ... /@2026-05-14/...
    D-->>API: dated daily rate files
  else fiat quote
    API->>F: /v1/2026-04-14..2026-05-14?base=USD&symbols=EUR
    alt Frankfurter succeeds
      F-->>API: dated rate map
    else Frankfurter fails
      API->>E: skip as historical backup
      Note right of API: open.er-api.com is latest-only without API-key historical access
      API->>D: dated CDN files for each date
      D-->>API: dated daily rate files
    end
  end
  API->>API: normalize to [{ date, rate, sourceDate, filled }]
  API-->>Modal: chart points + source + warnings
  Modal->>Modal: render sparkline and date/rate tooltip
```

Chart normalization:

- Dates are returned as ISO strings.
- Rates are numeric.
- Missing calendar days, such as weekends or not-yet-published current-day data, carry forward the latest available market rate.
- Each point includes:

```ts
type HistoricalPoint = {
  date: string;
  rate: number;
  sourceDate: string;
  filled: boolean;
};
```

Stablecoin analytics:

- The stablecoin view only shows `USDT` and `USDC`.
- The chart endpoint sends those requests directly to fawazahmed0.
- fawazahmed0 supports dated URLs and crypto symbols, so `USD -> USDT` and `USD -> USDC` return real daily points.
- If the API fails, the UI falls back to a flat USD peg sample so the modal still renders.

```mermaid
flowchart LR
  A["Open USDT or USDC chart"] --> B["GET /api/analytics/history"]
  B --> C["Prefer fawazahmed0 dated files"]
  C --> D["Normalize usd.usdt or usd.usdc"]
  D --> E["Render daily stablecoin chart"]
  C -->|failure| F["Use flat peg fallback"]
```

Tooltip behavior:

- The cursor snaps to the nearest chart point.
- The label shows rate and date inline.
- The label appears on the upper chart bound by default.
- If the hovered point is high, the label moves to the lower chart bound to avoid covering the line.

## Deployment

### Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Useful local checks:

```bash
npm test
npm run build
```

### Deploy To Vercel

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Use the default Next.js settings.
4. Deploy.

No database, secrets, API keys, or environment variables are required.

## Testing

The current test suite covers:

- percent plus flat fee calculation
- small trades invalidated by flat fees
- static multi-leg route discovery
- max 3 legs
- no cycles
- ranking by simulated final output instead of raw rate alone
- amount input formatting

Run tests:

```bash
npm test
```

Run production build:

```bash
npm run build
```

## AI Tools Used

I used OpenAI Codex, Copilot and Claude Opus as implementation partners to scaffold the Next.js project, build the routing engine, code API routes, develop the UI, and add tests. I used it iteratively: first for the core graph and fee model, then for provider integration, then for UI polish and analytics chart behavior.

The important human decisions were the Route Search Model and failure behavior: enumerate and simulate every valid route instead of using a naive shortest-path algorithm, keep provider failures isolated, and show fees by currency rather than inventing a misleading single total.

## One Thing The AI Got Wrong

The easy mistake was treating provider fees as one total number. That is wrong because later-leg fees can be charged in intermediate currencies like USD, USDT, or CHF. I caught it while reviewing multi-leg route outputs where fees came from different leg source currencies; adding them directly would have implied they were all in GBP. The implementation now returns `totalFeesByCurrency` and the UI shows exact per-leg fees.

## What I Would Do Differently With More Time

In real production enveriments and with more time I would add richer quote freshness and observability: provider latency, cache age, per-base success rates, and adapt the UI for better mobile use.
