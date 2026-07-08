import { Injectable, signal } from '@angular/core';
import {
  InstrumentData,
  RiskProfileData,
  TradeOrderData,
  SavedInstrument,
  SavedRiskProfile,
  SavedTradeOrder,
} from '../models/trade.models';

@Injectable({ providedIn: 'root' })
export class TradeStoreService {
  private instrumentCounter = 1;
  private riskCounter = 1;
  private orderCounter = 1;

  readonly savedInstruments = signal<SavedInstrument[]>([]);
  readonly savedRiskProfiles = signal<SavedRiskProfile[]>([]);
  readonly savedOrders = signal<SavedTradeOrder[]>([]);

  async saveInstrument(data: InstrumentData): Promise<string> {
    await this.simulateLatency(500 + Math.random() * 300);
    const id = `INST-${String(this.instrumentCounter++).padStart(4, '0')}`;
    this.savedInstruments.update(prev => [{ ...data, id, savedAt: new Date() }, ...prev]);
    return id;
  }

  async saveRiskProfile(data: RiskProfileData): Promise<string> {
    await this.simulateLatency(400 + Math.random() * 300);
    const id = `RISK-${String(this.riskCounter++).padStart(4, '0')}`;
    this.savedRiskProfiles.update(prev => [{ ...data, id, savedAt: new Date() }, ...prev]);
    return id;
  }

  async saveTradeOrder(data: TradeOrderData): Promise<string> {
    await this.simulateLatency(600 + Math.random() * 400);
    const id = `TRD-${String(this.orderCounter++).padStart(6, '0')}`;
    this.savedOrders.update(prev => [{ ...data, id, savedAt: new Date() }, ...prev]);
    return id;
  }

  private simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
