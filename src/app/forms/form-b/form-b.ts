import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  max,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { ActivityLogService } from '../../services/activity-log.service';
import { TradeCoordinatorService } from '../../services/trade-coordinator.service';
import { TradeStoreService } from '../../services/trade-store.service';
import {
  ASSET_CLASSES,
  CURRENCIES,
  EXCHANGES,
  InstrumentData,
} from '../../models/trade.models';

const INITIAL_INSTRUMENT: InstrumentData = {
  symbol: '',
  exchange: '',
  assetClass: '',
  currency: '',
  lotSize: 100,
  description: '',
};

@Component({
  selector: 'app-form-b',
  imports: [FormField, FormRoot],
  templateUrl: './form-b.html',
  styleUrls: ['./form-b.css'],
})
export class FormBComponent implements OnInit {
  private readonly store = inject(TradeStoreService);
  private readonly coordinator = inject(TradeCoordinatorService);
  private readonly activityLog = inject(ActivityLogService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Domain options ─────────────────────────────────────────────────────────
  readonly exchanges = EXCHANGES;
  readonly assetClasses = ASSET_CLASSES;
  readonly currencies = CURRENCIES;

  // ── Saved ID display ───────────────────────────────────────────────────────
  readonly savedId = this.coordinator.instrumentId;
  readonly isSaving = signal(false);

  // ── Signal Form ─────────────────────────────────────────────────────────────
  readonly instrumentModel = signal<InstrumentData>({ ...INITIAL_INSTRUMENT });

  readonly instrumentForm = form(
    this.instrumentModel,
    (s) => {
      required(s.symbol, { message: 'Symbol is required' });
      minLength(s.symbol, 1, { message: 'Symbol cannot be empty' });
      required(s.exchange, { message: 'Select an exchange' });
      required(s.assetClass, { message: 'Select an asset class' });
      required(s.currency, { message: 'Select a currency' });
      required(s.lotSize, { message: 'Lot size is required' });
      min(s.lotSize, 1, { message: 'Lot size must be at least 1' });
      max(s.lotSize, 1_000_000, { message: 'Lot size cannot exceed 1,000,000' });
    },
    {
      submission: {
        action: async (f) => {
          this.isSaving.set(true);
          try {
            const id = await this.store.saveInstrument(this.instrumentModel());
            this.coordinator.instrumentId.set(id);
            this.activityLog.log('B', 'success', `Instrument saved → ${id}`);
            f().reset({ ...this.instrumentModel() });
          } finally {
            this.isSaving.set(false);
          }
        },
      },
    },
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.coordinator.registerSaveInstrument(() => this.triggerSave());
    this.destroyRef.onDestroy(() => this.coordinator.registerSaveInstrument(null));
    this.activityLog.log('B', 'info', 'Form B — Instrument Config ready');
  }

  // ── Public API (called by coordinator) ─────────────────────────────────────
  async triggerSave(): Promise<string> {
    const existingId = this.coordinator.instrumentId();
    if (existingId && !this.instrumentForm().dirty()) {
      this.activityLog.log('B', 'info', `Reusing saved instrument → ${existingId}`);
      return existingId;
    }

    this.instrumentForm().markAsTouched();
    if (this.instrumentForm().invalid()) {
      this.activityLog.log('B', 'error', 'Instrument form has validation errors');
      throw new Error('Instrument form is invalid');
    }

    this.isSaving.set(true);
    try {
      const id = await this.store.saveInstrument(this.instrumentModel());
      this.coordinator.instrumentId.set(id);
      this.activityLog.log('B', 'success', `Instrument saved → ${id}`);
      this.instrumentForm().reset({ ...this.instrumentModel() });
      return id;
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  onReset(): void {
    this.instrumentModel.set({ ...INITIAL_INSTRUMENT });
    this.instrumentForm().reset({ ...INITIAL_INSTRUMENT });
    this.activityLog.log('B', 'info', 'Form B reset');
  }
}
