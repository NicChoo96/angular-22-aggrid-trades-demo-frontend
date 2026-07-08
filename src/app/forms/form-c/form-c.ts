import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  max,
  min,
  required,
} from '@angular/forms/signals';
import { ActivityLogService } from '../../services/activity-log.service';
import { TradeCoordinatorService } from '../../services/trade-coordinator.service';
import { TradeStoreService } from '../../services/trade-store.service';
import { RiskProfileData } from '../../models/trade.models';
import { RiskDial } from '../../shared/controls/risk-dial/risk-dial';
import { LeverageSelector } from '../../shared/controls/leverage-selector/leverage-selector';
import { RiskScoreGauge } from '../../shared/controls/risk-score-gauge/risk-score-gauge';

const INITIAL_RISK_PROFILE: RiskProfileData = {
  maxPositionSize: 10000,
  stopLossPercent: 2.0,
  takeProfitPercent: 6.0,
  riskScore: 3,
  leverage: 1,
  hedgeEnabled: false,
};

@Component({
  selector: 'app-form-c',
  imports: [FormField, FormRoot, RiskDial, LeverageSelector, RiskScoreGauge],
  templateUrl: './form-c.html',
  styleUrls: ['./form-c.css'],
})
export class FormCComponent implements OnInit {
  private readonly store = inject(TradeStoreService);
  private readonly coordinator = inject(TradeCoordinatorService);
  private readonly activityLog = inject(ActivityLogService);
  private readonly destroyRef = inject(DestroyRef);

  readonly savedId = this.coordinator.riskProfileId;
  readonly isSaving = signal(false);

  // ── Signal Form ─────────────────────────────────────────────────────────────
  readonly riskModel = signal<RiskProfileData>({ ...INITIAL_RISK_PROFILE });

  readonly riskForm = form(
    this.riskModel,
    (s) => {
      required(s.maxPositionSize, { message: 'Max position size is required' });
      min(s.maxPositionSize, 100, { message: 'Minimum position size is $100' });
      max(s.maxPositionSize, 50_000_000, { message: 'Exceeds maximum allowed' });

      required(s.stopLossPercent, { message: 'Stop loss is required' });
      min(s.stopLossPercent, 0.1, { message: 'Minimum stop loss is 0.1%' });
      max(s.stopLossPercent, 50, { message: 'Maximum stop loss is 50%' });

      required(s.takeProfitPercent, { message: 'Take profit is required' });
      min(s.takeProfitPercent, 0.1, { message: 'Minimum take profit is 0.1%' });
      max(s.takeProfitPercent, 500, { message: 'Maximum take profit is 500%' });

      required(s.riskScore, { message: 'Risk score is required' });
      min(s.riskScore, 1, { message: 'Risk score must be 1–10' });
      max(s.riskScore, 10, { message: 'Risk score must be 1–10' });

      required(s.leverage, { message: 'Select a leverage multiplier' });
      min(s.leverage, 1, { message: 'Minimum leverage is 1x' });
    },
    {
      submission: {
        action: async (f) => {
          this.isSaving.set(true);
          try {
            const id = await this.store.saveRiskProfile(this.riskModel());
            this.coordinator.riskProfileId.set(id);
            this.activityLog.log('C', 'success', `Risk profile saved → ${id}`);
            f().reset({ ...this.riskModel() });
          } finally {
            this.isSaving.set(false);
          }
        },
      },
    },
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.coordinator.registerSaveRiskProfile(() => this.triggerSave());
    this.destroyRef.onDestroy(() => this.coordinator.registerSaveRiskProfile(null));
    this.activityLog.log('C', 'info', 'Form C — Risk Profile ready');
  }

  // ── Public API (called by coordinator) ──────────────────────────────────────
  async triggerSave(): Promise<string> {
    const existingId = this.coordinator.riskProfileId();
    if (existingId && !this.riskForm().dirty()) {
      this.activityLog.log('C', 'info', `Reusing saved risk profile → ${existingId}`);
      return existingId;
    }

    this.riskForm().markAsTouched();
    if (this.riskForm().invalid()) {
      this.activityLog.log('C', 'error', 'Risk profile form has validation errors');
      throw new Error('Risk profile form is invalid');
    }

    this.isSaving.set(true);
    try {
      const id = await this.store.saveRiskProfile(this.riskModel());
      this.coordinator.riskProfileId.set(id);
      this.activityLog.log('C', 'success', `Risk profile saved → ${id}`);
      this.riskForm().reset({ ...this.riskModel() });
      return id;
    } finally {
      this.isSaving.set(false);
    }
  }

  onReset(): void {
    this.riskModel.set({ ...INITIAL_RISK_PROFILE });
    this.riskForm().reset({ ...INITIAL_RISK_PROFILE });
    this.activityLog.log('C', 'info', 'Form C reset');
  }
}
