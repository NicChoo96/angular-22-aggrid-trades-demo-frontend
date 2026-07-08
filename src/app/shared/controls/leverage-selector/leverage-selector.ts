import { Component, computed, input, model, output } from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';
import { LEVERAGE_OPTIONS } from '../../../models/trade.models';

/**
 * LeverageSelector — implements FormValueControl<number>.
 * Renders a horizontal tile-grid of leverage multipliers.
 * The selected tile glows with a colour that intensifies with leverage.
 */
@Component({
  selector: 'app-leverage-selector',
  template: `
    <div class="flex flex-col gap-2" [class.opacity-40]="disabled()" [class.pointer-events-none]="disabled()">
      <div class="grid grid-cols-4 gap-1.5" role="radiogroup" [attr.aria-label]="'Leverage'">
        @for (opt of options; track opt) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="value() === opt"
            [attr.aria-label]="opt + 'x leverage'"
            class="leverage-tile"
            [class]="tileClass(opt)"
            (click)="select(opt)"
            (blur)="onBlur()"
          >
            <span class="tile-value">{{ opt }}x</span>
            @if (opt >= 50) {
              <span class="tile-tag">HIGH</span>
            } @else if (opt >= 10) {
              <span class="tile-tag">MED</span>
            }
          </button>
        }
      </div>

      @if (invalid() && errors().length > 0) {
        <p class="text-xs text-red-400 mt-1">{{ errors()[0].message }}</p>
      }
    </div>
  `,
  styleUrls: ['./leverage-selector.css'],
})
export class LeverageSelector implements FormValueControl<number> {
  // ── FormValueControl ────────────────────────────────────────────────────────
  readonly value = model<number>(1);
  readonly touch = output<void>();
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);;

  readonly options = [...LEVERAGE_OPTIONS];

  readonly tileClass = (opt: number) =>
    computed(() => {
      const selected = this.value() === opt;
      const base =
        'leverage-tile-base';
      if (!selected) return base + ' tile-unselected';
      if (opt >= 50) return base + ' tile-selected-danger';
      if (opt >= 10) return base + ' tile-selected-warning';
      return base + ' tile-selected-safe';
    })();

  select(opt: number): void {
    this.value.set(opt);
    this.touch.emit();
  }

  onBlur(): void {
    this.touch.emit();
  }
}
