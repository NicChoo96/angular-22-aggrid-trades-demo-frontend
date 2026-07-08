import { Component, input, output } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { DecimalPipe } from '@angular/common';

/** Bottom bar: column sizing, zoom, and CSV export controls. */
@Component({
  selector: 'app-grid-footer',
  imports: [DecimalPipe],
  template: `
    <div class="grid-footer" role="toolbar" [attr.aria-label]="'Grid controls for ' + tableLabel()">
      <div class="footer-group">
        <span class="group-label">Columns</span>
        <button type="button" class="footer-btn" (click)="autoSize()" title="Auto-size all columns">⇔ Auto Size</button>
        <button type="button" class="footer-btn" (click)="fitColumns()" title="Fit columns to grid width">⊞ Fit Width</button>
      </div>
      <div class="footer-sep"></div>
      <div class="footer-group">
        <span class="group-label">Zoom</span>
        <button type="button" class="footer-btn icon" (click)="zoomOut()" [disabled]="zoom() <= 80" aria-label="Zoom out">−</button>
        <input type="range" class="zoom-slider" [value]="zoom()" (input)="onZoomSlider($event)" min="80" max="140" step="5" [attr.aria-label]="'Zoom ' + zoom() + '%'" />
        <button type="button" class="footer-btn icon" (click)="zoomIn()" [disabled]="zoom() >= 140" aria-label="Zoom in">+</button>
        <span class="zoom-label">{{ zoom() }}%</span>
        <button type="button" class="footer-btn small" (click)="resetZoom()" title="Reset zoom">↺</button>
      </div>
      <div class="footer-sep"></div>
      <div class="footer-group">
        <span class="row-count-label">{{ rowCount() | number }} rows</span>
      </div>
    </div>
  `,
  styleUrls: ['./grid-footer.css'],
})
export class GridFooterComponent {
  readonly gridApi    = input<GridApi | null>(null);
  readonly tableLabel = input<string>('Table');
  readonly rowCount   = input<number>(0);
  readonly zoom       = input<number>(100);
  readonly zoomChange = output<number>();

  autoSize(): void  { this.gridApi()?.autoSizeAllColumns(false); }
  fitColumns(): void { this.gridApi()?.sizeColumnsToFit(); }
  zoomIn(): void    { this.zoomChange.emit(Math.min(140, this.zoom() + 10)); }
  zoomOut(): void   { this.zoomChange.emit(Math.max(80,  this.zoom() - 10)); }
  resetZoom(): void { this.zoomChange.emit(100); }
  onZoomSlider(e: Event): void {
    this.zoomChange.emit(Number((e.target as HTMLInputElement).value));
  }
}
