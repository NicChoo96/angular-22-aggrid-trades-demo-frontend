import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  form,
  FormField,
  hidden,
  min,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { ActivityLogService } from '../../services/activity-log.service';
import { TradeCoordinatorService } from '../../services/trade-coordinator.service';
import { TradeStoreService } from '../../services/trade-store.service';
import {
  DIRECTIONS,
  ORDER_TYPES,
  TradeOrderData,
} from '../../models/trade.models';

const INITIAL_ORDER: TradeOrderData = {
  tradeName: '',
  direction: 'BUY',
  orderType: 'MARKET',
  quantity: 1,
  limitPrice: 0,
  notes: '',
  instrumentId: '',
  riskProfileId: '',
};

@Component({
  selector: 'app-form-a',
  imports: [FormField],
  templateUrl: './form-a.html',
  styleUrls: ['./form-a.css'],
})
export class FormAComponent implements OnInit {
  private readonly store = inject(TradeStoreService);
  private readonly coordinator = inject(TradeCoordinatorService);
  private readonly activityLog = inject(ActivityLogService);

  readonly directions = DIRECTIONS;
  readonly orderTypes = ORDER_TYPES;

  readonly isSaving = signal(false);
  readonly lastSavedOrderId = signal<string>('');

  // IDs from coordinator (live-updating signals)
  readonly instrumentId = this.coordinator.instrumentId;
  readonly riskProfileId = this.coordinator.riskProfileId;

  // ── Signal Form ─────────────────────────────────────────────────────────────
  readonly orderModel = signal<TradeOrderData>({ ...INITIAL_ORDER });

  readonly orderForm = form(this.orderModel, (s) => {
    required(s.tradeName, { message: 'Trade name is required' });
    minLength(s.tradeName, 3, { message: 'Trade name must be at least 3 characters' });
    required(s.direction, { message: 'Direction is required' });
    required(s.orderType, { message: 'Order type is required' });
    required(s.quantity, { message: 'Quantity is required' });
    min(s.quantity, 1, { message: 'Quantity must be at least 1' });
    // Price required only for LIMIT/STOP order types
    hidden(s.limitPrice, {
      when: ({ valueOf }) => valueOf(s.orderType) === 'MARKET',
    });
    required(s.limitPrice, { message: 'Price is required for LIMIT/STOP orders' });
    min(s.limitPrice, 0.01, { message: 'Price must be greater than 0' });
  });

  // Is the price field visible?
  readonly showPrice = computed(() => this.orderModel().orderType !== 'MARKET');

  // Can Save All proceed?
  readonly canSaveAll = computed(
    () => !this.isSaving() && this.orderForm().valid(),
  );

  readonly formHasChanges = computed(() => this.orderForm().dirty());

  ngOnInit(): void {
    this.activityLog.log('A', 'info', 'Form A — Trade Order ready (master form)');
  }

  // ── Direction toggle ────────────────────────────────────────────────────────
  setDirection(dir: 'BUY' | 'SELL'): void {
    this.orderModel.update(m => ({ ...m, direction: dir }));
    this.orderForm.direction().markAsTouched();
    this.activityLog.log('A', 'info', `Direction set to ${dir}`);
  }

  // ── Save All (master action) ────────────────────────────────────────────────
  onSaveAll(): void {
    // Validate FormA first
    this.orderForm().markAsTouched();
    if (this.orderForm().invalid()) {
      this.activityLog.log('A', 'error', 'Trade order has validation errors — fix before saving');
      return;
    }
    this.performSaveAll();
  }

  private async performSaveAll(): Promise<void> {
    this.isSaving.set(true);
    this.activityLog.log('A', 'info', '⬡ Save All initiated — coordinating B + C + A');

    try {
      // Step 1: Save Instrument (Form B)
      this.activityLog.log('A', 'info', 'Saving Form B (Instrument)…');
      const instrId = await this.coordinator.saveInstrument();

      // Step 2: Save Risk Profile (Form C)
      this.activityLog.log('A', 'info', 'Saving Form C (Risk Profile)…');
      const riskId = await this.coordinator.saveRiskProfile();

      // Step 3: Update Form A model with resolved IDs then save
      this.orderModel.update(m => ({ ...m, instrumentId: instrId, riskProfileId: riskId }));
      this.activityLog.log('A', 'info', 'Saving Form A (Trade Order)…');
      const orderId = await this.store.saveTradeOrder(this.orderModel());

      this.lastSavedOrderId.set(orderId);
      this.activityLog.log('A', 'success',
        `✓ Save All complete — Order: ${orderId} | Instrument: ${instrId} | Risk: ${riskId}`);

      this.orderForm().reset({ ...this.orderModel() });
    } catch (err) {
      this.activityLog.log('A', 'error', `Save All failed: ${(err as Error).message}`);
    } finally {
      this.isSaving.set(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  onReset(): void {
    this.orderModel.set({ ...INITIAL_ORDER });
    this.orderForm().reset({ ...INITIAL_ORDER });
    this.coordinator.reset();
    this.lastSavedOrderId.set('');
    this.activityLog.log('A', 'warning', 'Form A reset — coordinator IDs cleared');
  }

  // ── Individual save FormA only ─────────────────────────────────────────────
  onSaveOrderOnly(): void {
    this.orderForm().markAsTouched();
    if (this.orderForm().invalid()) {
      this.activityLog.log('A', 'error', 'Cannot save — trade order is invalid');
      return;
    }
    submit(this.orderForm, {
      action: async () => {
        this.isSaving.set(true);
        try {
          const instrId = this.instrumentId() || '—';
          const riskId = this.riskProfileId() || '—';
          this.orderModel.update(m => ({ ...m, instrumentId: instrId, riskProfileId: riskId }));
          const id = await this.store.saveTradeOrder(this.orderModel());
          this.lastSavedOrderId.set(id);
          this.activityLog.log('A', 'success', `Trade order saved → ${id}`);
          this.orderForm().reset({ ...this.orderModel() });
        } finally {
          this.isSaving.set(false);
        }
      },
    });
  }
}
