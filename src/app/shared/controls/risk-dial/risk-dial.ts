import {
  Component,
  computed,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalFieldTree } from '@angular/forms/signals';

/**
 * RiskDial — SVG circular drag-knob that implements FormValueControl<number>.
 * Dragging the handle clockwise increases the value; the arc and colour change
 * in real-time to reflect risk level (green → amber → red).
 *
 * The dial sweeps 270° from the 7:30 position (lower-left) through the top
 * to the 4:30 position (lower-right).
 *
 * START angle (7:30 in SVG coords, 0° = right, clockwise): 135°
 * END   angle (4:30 in SVG coords):                        45° (= 135+270)
 */
@Component({
  selector: 'app-risk-dial',
  templateUrl: './risk-dial.html',
  styleUrls: ['./risk-dial.css'],
})
export class RiskDial implements FormValueControl<number> {
  // ── FormValueControl interface ──────────────────────────────────────────────
  readonly value = model<number>(0);
  readonly touch = output<void>();
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly errors = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);

  // ── Configuration inputs ───────────────────────────────────────────────────
  readonly rangeMin = input<number>(0);
  readonly rangeMax = input<number>(50);
  readonly dialLabel = input<string>('Value');
  readonly unit = input<string>('%');

  // ── Internal SVG constants ─────────────────────────────────────────────────
  private readonly MIN_ANGLE = 135;   // 7:30 o'clock position
  private readonly TOTAL_SWEEP = 270;
  private readonly CX = 50;
  private readonly CY = 50;
  private readonly R = 36;
  private readonly TRACK_WIDTH = 8;

  isDragging = false;

  private readonly svgEl = viewChild<ElementRef<SVGSVGElement>>('dialSvg');

  // ── SVG geometry (computed) ────────────────────────────────────────────────

  /** Background track path (fixed, computed once). */
  readonly bgArcPath = this.computeArcPath(135, 45, 1);

  /** Value-arc path — reactive to value changes. */
  readonly valueArcPath = computed(() => {
    const pct = this.valueToPct(this.value());
    const sweep = pct * this.TOTAL_SWEEP;
    if (sweep < 0.5) return '';
    const start = this.pointAt(this.MIN_ANGLE);
    const end = this.pointAt(this.MIN_ANGLE + sweep);
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${this.R} ${this.R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  });

  /** Thumb circle position. */
  readonly thumbPos = computed(() => {
    const pct = this.valueToPct(this.value());
    return this.pointAt(this.MIN_ANGLE + pct * this.TOTAL_SWEEP);
  });

  /** Arc colour reflects risk level. */
  readonly arcColor = computed(() => {
    const pct = this.valueToPct(this.value());
    if (pct < 0.33) return '#10b981';  // emerald — safe
    if (pct < 0.66) return '#f59e0b';  // amber  — caution
    return '#ef4444';                  // red    — danger
  });

  /** Display text for centre of dial. */
  readonly displayValue = computed(() => `${this.value().toFixed(1)}`);

  // ── Pointer-event drag handlers ────────────────────────────────────────────

  onPointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.isDragging = true;
    (event.currentTarget as SVGSVGElement).setPointerCapture(event.pointerId);
    this.updateFromPointer(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    this.updateFromPointer(event);
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.currentTarget as SVGSVGElement).releasePointerCapture(event.pointerId);
    this.touch.emit();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private updateFromPointer(event: PointerEvent): void {
    const svg = this.svgEl()?.nativeElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let angle = Math.atan2(event.clientY - cy, event.clientX - cx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Offset from start angle; wrap into [0, 360)
    let delta = angle - this.MIN_ANGLE;
    if (delta < 0) delta += 360;

    // Clamp into dead-zone: angles beyond the 270° sweep snap to nearest end
    if (delta > this.TOTAL_SWEEP) {
      delta = delta > this.TOTAL_SWEEP + (360 - this.TOTAL_SWEEP) / 2 ? 0 : this.TOTAL_SWEEP;
    }

    const pct = delta / this.TOTAL_SWEEP;
    const raw = this.rangeMin() + pct * (this.rangeMax() - this.rangeMin());
    this.value.set(parseFloat(Math.max(this.rangeMin(), Math.min(this.rangeMax(), raw)).toFixed(1)));
  }

  private valueToPct(v: number): number {
    const span = this.rangeMax() - this.rangeMin();
    if (span === 0) return 0;
    return Math.max(0, Math.min(1, (v - this.rangeMin()) / span));
  }

  private pointAt(deg: number): { x: number; y: number } {
    const rad = (deg * Math.PI) / 180;
    return {
      x: parseFloat((this.CX + this.R * Math.cos(rad)).toFixed(3)),
      y: parseFloat((this.CY + this.R * Math.sin(rad)).toFixed(3)),
    };
  }

  private computeArcPath(startDeg: number, endDeg: number, sweepFlag: 0 | 1): string {
    const start = this.pointAt(startDeg);
    const end = this.pointAt(endDeg);
    return `M ${start.x} ${start.y} A ${this.R} ${this.R} 0 1 ${sweepFlag} ${end.x} ${end.y}`;
  }
}
