# SmartFlow

Automated smart money discovery for Solana. SmartFlow analyzes on-chain data to identify wallets that consistently buy tokens before they appear on trending lists, scores them by historical performance, and delivers real-time alerts when they make a new move.

Built for the Birdeye BIP Sprint 4 hackathon using the Birdeye Data API as the core data layer.

---

## What it does

Most traders enter tokens after they trend. SmartFlow finds the wallets that were already there hours before.

The discovery engine runs automatically every 2 hours. It pulls trending tokens from the Birdeye API, reconstructs each token's price history using OHLCV data, identifies the volume peak, and then cross-references the top holders against on-chain transaction history via Helius to find which wallets bought in before the peak. Each wallet receives a score based on how many times it has done this, how far in advance it bought, and what the average return was.

The result is a ranked list of wallets with a verifiable track record, not a manually curated list.

Users can then monitor any wallet in real time. The system checks for new trades every 30 seconds and surfaces alerts with the token name, action type, and a security score for the token being traded.

---

## Birdeye API endpoints used

| Endpoint | Purpose |
|---|---|
| `/defi/token_trending` | Fetch current trending tokens to drive the discovery cycle |
| `/defi/ohlcv` | Reconstruct price and volume history to identify each token's peak |
| `/defi/v3/token/holder` | Get top holders of a token to identify candidate wallets |
| `/defi/token_security` | Score token safety when generating trade alerts |
| `/defi/token_overview` | Fetch token metadata for display |

Helius (`/v0/addresses/{wallet}/transactions`) is used alongside Birdeye to resolve on-chain transaction history for wallet analysis, since granular per-wallet trade history requires RPC-level access.

---

## Architecture

```
Vercel Cron (every 2h)
    |
    v
Discovery Engine (lib/discovery.ts)
    |-- Birdeye: /defi/token_trending       -> list of tokens to analyze
    |-- Birdeye: /defi/ohlcv               -> price history + peak detection
    |-- Birdeye: /defi/v3/token/holder     -> top holders per token
    |-- Helius:  /v0/addresses/.../transactions -> wallet trade history
    |
    v
Supabase (smart_wallets, early_buys, wallet_alerts)
    |
    v
Next.js API Routes -> Frontend (Next.js + Tailwind)
```

Everything runs inside a single Next.js project deployed on Vercel. There is no separate backend process. The Vercel Cron Job replaces a scheduler. Supabase replaces a self-hosted database. This means zero infrastructure to maintain and zero risk of service downtime during the judging period.

---

## Scoring model

Each wallet's score is computed from its detected early buys:

- Base points per early buy: 10
- Bonus if bought more than 3 hours before peak: +5
- Bonus if return exceeded 50%: +5
- Bonus if return exceeded 100%: +10
- Diversification bonus if wallet traded more than 3 different tokens: +10

Score labels: Weak (0-24), Moderate (25-49), Strong (50-79), Elite (80+).

---

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
- Vercel (hosting + cron jobs)
- Birdeye Data API
- Helius API

---

## Running locally

**Requirements:** Node.js 20+, pnpm, a Birdeye API key, a Helius API key, a Supabase project.

**1. Clone and install:**

```bash
git clone https://github.com/YOUR_USERNAME/smartflow
cd smartflow
pnpm install
```

**2. Create `.env.local`:**

```
BIRDEYE_API_KEY=your_birdeye_key
HELIUS_API_KEY=your_helius_key
NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=any_random_string
```

**3. Initialize the database:**

Run the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE smart_wallets (
  address TEXT PRIMARY KEY,
  score INTEGER DEFAULT 0,
  total_early_buys INTEGER DEFAULT 0,
  successful_buys INTEGER DEFAULT 0,
  avg_return_pct REAL DEFAULT 0,
  tokens_traded TEXT[] DEFAULT '{}',
  last_updated BIGINT DEFAULT 0
);

CREATE TABLE trending_tokens (
  address TEXT PRIMARY KEY,
  symbol TEXT,
  peak_timestamp BIGINT,
  peak_price REAL,
  pre_peak_price REAL,
  analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE early_buys (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  buy_timestamp BIGINT,
  peak_timestamp BIGINT,
  hours_before_peak REAL,
  price_at_buy REAL,
  price_at_peak REAL,
  return_pct REAL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallet_alerts (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_address TEXT,
  token_symbol TEXT,
  action TEXT,
  amount_usd REAL,
  timestamp BIGINT,
  security_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_smart_wallets_score ON smart_wallets(score DESC);
CREATE INDEX idx_early_buys_wallet ON early_buys(wallet_address);
CREATE INDEX idx_wallet_alerts_wallet ON wallet_alerts(wallet_address, timestamp DESC);
```

**4. Start the dev server:**

```bash
pnpm dev
```

**5. Trigger the first discovery run:**

```bash
curl -X POST http://localhost:3000/api/discovery/run
```

The discovery takes 5-10 minutes on first run. Wallets will appear in the UI automatically when it completes.

---

## Deploying to Vercel

**1. Push to GitHub:**

```bash
git add .
git commit -m "feat: initial release"
git push origin main
```

**2. Deploy:**

```bash
vercel
```

**3. Add environment variables** in the Vercel dashboard under Settings > Environment Variables. Add all variables from `.env.local`.

**4. The `vercel.json` cron configuration** runs discovery automatically:

```json
{
  "crons": [
    {
      "path": "/api/cron/discovery",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

No additional configuration is needed. The system starts accumulating wallet data immediately after deploy.

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wallets/top` | Ranked list of smart money wallets |
| GET | `/api/wallets/:address` | Wallet detail, early buy history, recent activity |
| GET | `/api/wallets/:address/alerts` | Historical alerts for a wallet |
| GET | `/api/wallets/:address/alerts?check=true` | Check for new trades right now |
| GET | `/api/tokens/trending` | Current trending tokens from Birdeye |
| GET | `/api/tokens/:address/security` | Security score for a token |
| GET | `/api/stats` | System-wide statistics |
| POST | `/api/discovery/run` | Trigger a discovery cycle manually |

---

## Project structure

```
smartflow/
  app/
    api/
      wallets/         # Wallet endpoints
      tokens/          # Token endpoints
      stats/           # Stats endpoint
      discovery/       # Manual discovery trigger
      cron/            # Vercel cron handler
    page.tsx           # Main ranking page
    wallet/[address]/  # Wallet detail page
  lib/
    birdeye.ts         # Birdeye API client
    discovery.ts       # Discovery engine and monitor
    supabase.ts        # Supabase clients
    client.ts          # Frontend fetch helpers
  components/
    WalletRow.tsx
    ScoreBadge.tsx
    SecurityBadge.tsx
  vercel.json          # Cron job configuration
```

---

## Security considerations

- The Vercel Cron endpoint is protected by a `CRON_SECRET` header check. Unauthenticated requests return 401.
- The `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the frontend. All writes go through server-side API routes only.
- Token security scores are calculated from Birdeye's security data on every alert, not cached, to reflect the current state of the token.

---

## License

MIT