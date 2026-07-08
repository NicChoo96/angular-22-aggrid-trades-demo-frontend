// ─── Domain Data Models ───────────────────────────────────────────────────────

/** Form B — Instrument Configuration */
export interface InstrumentData {
  symbol: string;
  exchange: string;
  assetClass: string;
  currency: string;
  lotSize: number;
  description: string;
}

/** Form C — Risk Profile */
export interface RiskProfileData {
  maxPositionSize: number;
  stopLossPercent: number;   // custom RiskDial control
  takeProfitPercent: number;
  riskScore: number;          // custom RiskScoreGauge control
  leverage: number;           // custom LeverageSelector control
  hedgeEnabled: boolean;
}

/** Form A — Master Trade Order */
export interface TradeOrderData {
  tradeName: string;
  direction: string;   // 'BUY' | 'SELL'
  orderType: string;   // 'MARKET' | 'LIMIT' | 'STOP'
  quantity: number;
  limitPrice: number;  // shown only for LIMIT / STOP
  notes: string;
  instrumentId: string;
  riskProfileId: string;
}

// ─── Saved Records (include generated ID) ─────────────────────────────────────

export interface SavedInstrument extends InstrumentData {
  id: string;
  savedAt: Date;
}

export interface SavedRiskProfile extends RiskProfileData {
  id: string;
  savedAt: Date;
}

export interface SavedTradeOrder extends TradeOrderData {
  id: string;
  savedAt: Date;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'success' | 'warning' | 'error';
export type FormId = 'A' | 'B' | 'C' | 'SYSTEM';

export interface ActivityEntry {
  id: number;
  timestamp: Date;
  formId: FormId;
  level: LogLevel;
  message: string;
}

// ─── Domain Enumerations ──────────────────────────────────────────────────────

export const EXCHANGES = ['NYSE', 'NASDAQ', 'LSE', 'EURONEXT', 'TSE', 'HKEX', 'SGX'] as const;
export const ASSET_CLASSES = ['EQUITY', 'BOND', 'COMMODITY', 'FX', 'CRYPTO', 'DERIVATIVE'] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'HKD', 'SGD', 'BTC'] as const;
export const ORDER_TYPES = ['MARKET', 'LIMIT', 'STOP'] as const;
export const DIRECTIONS = ['BUY', 'SELL'] as const;
export const LEVERAGE_OPTIONS = [1, 2, 5, 10, 25, 50, 100] as const;
