import { Injectable, signal } from '@angular/core';
import { AuditEntry, AuditAction, TableId, TradeRecord } from '../models/trade.models';

@Injectable({ providedIn: 'root' })
export class TradesAuditService {
  private nextId = 1;
  readonly entries = signal<AuditEntry[]>([]);

  record(params: {
    tableId: TableId;
    action: AuditAction;
    description: string;
    tradeId?: string;
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    snapshot?: TradeRecord;
  }): void {
    const entry: AuditEntry = {
      id: this.nextId++,
      timestamp: new Date(),
      ...params,
    };
    this.entries.update(prev => [entry, ...prev].slice(0, 300));
  }

  clear(): void {
    this.entries.set([]);
  }
}
