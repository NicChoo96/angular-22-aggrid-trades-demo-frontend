// ─── Core Trade Record ─────────────────────────────────────────────────────────

export interface TradeRecord {
  id: string;
  tradeDate: string;           // 'YYYY-MM-DD'
  symbol: string;
  exchange: string;
  direction: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  notional: number;
  pnl: number;
  status: 'OPEN' | 'CLOSED' | 'PENDING' | 'CANCELLED';
  trader: string;
  desk: string;
  strategy: string;
  currency: string;
  counterparty: string;
}

export type TradeDirection = TradeRecord['direction'];
export type TradeStatus    = TradeRecord['status'];

// ─── Audit ─────────────────────────────────────────────────────────────────────

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'FILTER' | 'SORT' | 'EXPORT';
export type TableId = 'T1' | 'T2';

export interface AuditEntry {
  id: number;
  timestamp: Date;
  tableId: TableId;
  action: AuditAction;
  description: string;
  tradeId?: string;
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  /** Full row snapshot before the change — used for revert */
  snapshot?: TradeRecord;
}

// ─── Grid Filter Form Model ────────────────────────────────────────────────────

export interface TradeFilterData {
  direction: string;   // 'ALL' | 'BUY' | 'SELL'
  status: string;      // 'ALL' | TradeStatus
  desk: string;
  pnlMin: number;
  pnlMax: number;
}
