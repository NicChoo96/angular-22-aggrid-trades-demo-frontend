import { Injectable, signal } from '@angular/core';

type SaveFn = () => Promise<string>;

/**
 * Coordinates cross-form save operations.
 *
 * Form B and Form C register their save functions here on init.
 * Form A calls saveInstrument() / saveRiskProfile() to trigger
 * those saves as part of a coordinated "Save All" operation.
 */
@Injectable({ providedIn: 'root' })
export class TradeCoordinatorService {
  readonly instrumentId = signal<string>('');
  readonly riskProfileId = signal<string>('');

  private saveBFn: SaveFn | null = null;
  private saveCFn: SaveFn | null = null;

  registerSaveInstrument(fn: SaveFn | null): void {
    this.saveBFn = fn;
  }

  registerSaveRiskProfile(fn: SaveFn | null): void {
    this.saveCFn = fn;
  }

  async saveInstrument(): Promise<string> {
    if (!this.saveBFn) throw new Error('Form B save is not registered');
    const id = await this.saveBFn();
    this.instrumentId.set(id);
    return id;
  }

  async saveRiskProfile(): Promise<string> {
    if (!this.saveCFn) throw new Error('Form C save is not registered');
    const id = await this.saveCFn();
    this.riskProfileId.set(id);
    return id;
  }

  reset(): void {
    this.instrumentId.set('');
    this.riskProfileId.set('');
  }
}
