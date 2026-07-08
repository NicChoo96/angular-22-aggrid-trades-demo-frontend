import { TradeRecord } from '../models/trade.models';

// ─── Reference Data ────────────────────────────────────────────────────────────
export const TRADE_SYMBOLS     = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'NFLX', 'BTC/USD', 'ETH/USD', 'GOLD', 'EUR/USD', 'GBP/JPY', 'WTI/USD'];
export const TRADE_EXCHANGES   = ['NYSE', 'NASDAQ', 'LSE', 'HKEX', 'CME', 'CBOE'];
export const TRADE_STATUSES    = ['OPEN', 'CLOSED', 'PENDING', 'CANCELLED'] as const;
export const TRADE_TRADERS     = ['Alice Chen', 'Bob Kumar', 'Carlos Silva', 'Diana Park', 'Eric Walsh', 'Fatima Al-Hassan', 'George Nakamura', 'Hannah Müller'];
export const TRADE_DESKS       = ['Equity', 'Fixed Income', 'FX', 'Derivatives', 'Commodities'];
export const TRADE_STRATEGIES  = ['Momentum', 'Mean Reversion', 'Arbitrage', 'Market Making', 'Event Driven', 'Statistical Arb'];
export const TRADE_CURRENCIES  = ['USD', 'EUR', 'GBP', 'JPY', 'HKD'];
export const TRADE_COUNTERPARTIES = ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Deutsche Bank', 'HSBC', 'Barclays', 'UBS'];

// ─── Seeded Pseudo-Random ──────────────────────────────────────────────────────

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

function pick<T>(arr: readonly T[], r: number): T {
  return arr[Math.floor(r * arr.length)];
}

function randFloat(min: number, max: number, r: number, decimals = 2): number {
  return parseFloat((r * (max - min) + min).toFixed(decimals));
}

function randDate(daysBack: number, r: number): string {
  const d = new Date(2026, 5, 15); // 2026-06-15 base
  d.setDate(d.getDate() - Math.floor(r * daysBack));
  return d.toISOString().split('T')[0];
}

export function generateTrade(id: number, seed?: number): TradeRecord {
  const rand = seededRand(seed ?? id * 7919);
  const direction = rand() > 0.5 ? 'BUY' : 'SELL';
  const price     = randFloat(5, 4500, rand());
  const quantity  = Math.floor(rand() * 9990) + 10;
  const notional  = parseFloat((price * quantity).toFixed(2));
  const pnl       = randFloat(-80000, 150000, rand());

  return {
    id: `TRD-${String(id).padStart(6, '0')}`,
    tradeDate:    randDate(365, rand()),
    symbol:       pick(TRADE_SYMBOLS,       rand()),
    exchange:     pick(TRADE_EXCHANGES,     rand()),
    direction,
    quantity,
    price,
    notional,
    pnl,
    status:       pick(TRADE_STATUSES,      rand()) as TradeRecord['status'],
    trader:       pick(TRADE_TRADERS,       rand()),
    desk:         pick(TRADE_DESKS,         rand()),
    strategy:     pick(TRADE_STRATEGIES,    rand()),
    currency:     pick(TRADE_CURRENCIES,    rand()),
    counterparty: pick(TRADE_COUNTERPARTIES, rand()),
  };
}

/** Generate n trade records starting at id offset */
export function generateTrades(count: number, startId = 1): TradeRecord[] {
  return Array.from({ length: count }, (_, i) => generateTrade(startId + i));
}

/** Seeded data sets — stable across reloads */
export const TABLE_ONE_DATA = generateTrades(200, 1);
export const TABLE_TWO_MASTER = generateTrades(500, 201);
