import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';

/**
 * RiskScoreGauge — implements FormValueControl<number>.
 * Ten clickable segments (1–10) that fill left-to-right.
 * Colour transitions from emerald (low risk) through amber to red (high risk).
 */
@Component({
  selector: 'app-risk-score-gauge',
  template: `
    <div
      class="gauge-wrapper"
      [class.is-disabled]="disabled()"
      [class.is-invalid]="invalid()"
    >
      <div class="segments-row" role="slider"
        [attr.aria-valuenow]="value()"
        aria-valuemin="1"
        aria-valuemax="10"
        [attr.aria-label]="'Risk score: ' + scoreLabel()">
        @for (seg of segments; track seg) {
          <button
            type="button"
            class="segment"
            [class.is-filled]="value() >= seg"
            [class.is-preview]="hoveredSeg() > 0 && hoveredSeg() >= seg && value() < seg"
            [style.--seg-color]="segmentColor(seg)"
            [attr.aria-label]="'Risk score ' + seg"
            (click)="selectScore(seg)"
            (mouseenter)="hoveredSeg.set(seg)"
            (mouseleave)="hoveredSeg.set(0)"
            (blur)="touch.emit()"
          ></button>
        }
      </div>

      <div class="labels-row">
        <span class="label-end">LOW</span>
        <span class="label-score">{{ value() }} — {{ scoreLabel() }}</span>
        <span class="label-end">HIGH</span>
      </div>

      @if (invalid() && errors().length > 0) {
        <p class="gauge-error">{{ errors()[0].message }}</p>
      }
    </div>
  `,
  styleUrls: ['./risk-score-gauge.css'],
})
export class RiskScoreGauge implements FormValueControl<number> {
  readonly value = model<number>(1);
  readonly touch = output<void>();
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);

  readonly segments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly hoveredSeg = signal(0);

  selectScore(seg: number): void {
    if (this.disabled()) return;
    this.value.set(seg);
    this.touch.emit();
  }

  segmentColor(seg: number): string {
    const colors = [
      '#10b981', '#34d399', '#84cc16', '#a3e635', '#facc15',
      '#f59e0b', '#fb923c', '#f97316', '#ef4444', '#dc2626',
    ];
    return colors[seg - 1] ?? '#10b981';
  }

  readonly scoreLabel = computed(() => {
    const v = this.value();
    if (v <= 2) return 'Conservative';
    if (v <= 4) return 'Moderate';
    if (v <= 6) return 'Balanced';
    if (v <= 8) return 'Aggressive';
    return 'Maximum Risk';
  });
}
