import {
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GridApi } from 'ag-grid-community';

interface ColInfo {
  colId: string;
  headerName: string;
  visible: boolean;
  pinned: 'left' | 'right' | null;
}

/**
 * Custom column-configuration side panel for AG Grid Community.
 * Provides show/hide, pin, and reset — since the AG Grid Enterprise
 * side bar panels are not available in Community.
 */
@Component({
  selector: 'app-grid-column-panel',
  template: `
    @if (open()) {
      <div class="panel-overlay" (click)="close.emit()" aria-hidden="true"></div>
      <aside class="column-panel" role="dialog" aria-label="Column configuration">
        <div class="panel-header">
          <span class="panel-title">Column Config</span>
          <button type="button" class="panel-close" (click)="close.emit()" aria-label="Close panel">✕</button>
        </div>

        <div class="panel-section">
          <p class="section-label">VISIBILITY</p>
          <div class="col-list">
            @for (col of columns(); track col.colId) {
              <label class="col-row">
                <input
                  type="checkbox"
                  [checked]="col.visible"
                  (change)="toggleVisibility(col)"
                  class="col-check"
                  [attr.aria-label]="'Toggle ' + col.headerName"
                />
                <span class="col-name">{{ col.headerName }}</span>
                <div class="pin-buttons">
                  <button
                    type="button"
                    class="pin-btn"
                    [class.active]="col.pinned === 'left'"
                    (click)="pinColumn(col, 'left')"
                    title="Pin left"
                    aria-label="Pin left"
                  >◀</button>
                  <button
                    type="button"
                    class="pin-btn"
                    [class.active]="col.pinned === null"
                    (click)="pinColumn(col, null)"
                    title="Unpin"
                    aria-label="Unpin"
                  >⊞</button>
                  <button
                    type="button"
                    class="pin-btn"
                    [class.active]="col.pinned === 'right'"
                    (click)="pinColumn(col, 'right')"
                    title="Pin right"
                    aria-label="Pin right"
                  >▶</button>
                </div>
              </label>
            }
          </div>
        </div>

        <div class="panel-section">
          <button type="button" class="reset-btn" (click)="resetColumns()">
            ↺ Reset Columns
          </button>
        </div>

        <div class="panel-section enterprise-note">
          <p class="section-label">⚡ ENTERPRISE ONLY</p>
          <div class="enterprise-items">
            <span class="ent-item locked">Row Grouping</span>
            <span class="ent-item locked">Pivot Mode</span>
            <span class="ent-item locked">Value Aggregation</span>
          </div>
        </div>
      </aside>
    }
  `,
  styleUrls: ['./grid-column-panel.css'],
})
export class GridColumnPanelComponent implements OnDestroy {
  readonly open   = input.required<boolean>();
  readonly gridApi = input<GridApi | null>(null);
  readonly close  = output<void>();

  readonly columns = signal<ColInfo[]>([]);

  constructor() {
    effect(() => {
      const api = this.gridApi();
      if (api && this.open()) this.loadColumns(api);
    });
  }

  ngOnDestroy(): void {}

  private loadColumns(api: GridApi): void {
    const cols = api.getColumns() ?? [];
    this.columns.set(
      cols.map(col => ({
        colId:      col.getColId(),
        headerName: (col.getColDef().headerName ?? col.getColId()),
        visible:    col.isVisible(),
        pinned:     col.getPinned() as 'left' | 'right' | null,
      })),
    );
  }

  toggleVisibility(col: ColInfo): void {
    const api = this.gridApi();
    if (!api) return;
    api.setColumnsVisible([col.colId], !col.visible);
    this.columns.update(list =>
      list.map(c => c.colId === col.colId ? { ...c, visible: !c.visible } : c),
    );
  }

  pinColumn(col: ColInfo, pinned: 'left' | 'right' | null): void {
    const api = this.gridApi();
    if (!api) return;
    api.setColumnsPinned([col.colId], pinned);
    this.columns.update(list =>
      list.map(c => c.colId === col.colId ? { ...c, pinned } : c),
    );
  }

  resetColumns(): void {
    const api = this.gridApi();
    if (!api) return;
    api.resetColumnState();
    this.loadColumns(api);
  }
}
