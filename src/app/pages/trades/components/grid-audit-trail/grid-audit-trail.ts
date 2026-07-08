import { Component, computed, inject, input, output, signal } from '@angular/core';
import { TradesAuditService } from '../../services/trades-audit.service';
import { AuditEntry, TableId } from '../../models/trade.models';

@Component({
  selector: 'app-grid-audit-trail',
  template: `
    <div class="audit-panel">
      <div class="audit-header">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="collapse-btn"
            (click)="collapsed.set(!collapsed())"
            [attr.aria-expanded]="!collapsed()"
          >
            {{ collapsed() ? '▶' : '▼' }}
          </button>
          <span class="audit-title">AUDIT TRAIL</span>
          <span class="entry-count">{{ filteredEntries().length }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="filter-tabs" role="group">
            @for (tab of filterTabs; track tab) {
              <button type="button" class="tab-pill" [class.active]="tableFilter() === tab"
                (click)="tableFilter.set(tab)">{{ tab }}</button>
            }
          </div>
          <button type="button" class="clear-btn" (click)="audit.clear()">Clear</button>
        </div>
      </div>

      @if (!collapsed()) {
        <div class="audit-body">
          @if (filteredEntries().length === 0) {
            <p class="empty-msg">No audit entries yet — perform CRUD operations on the grids above.</p>
          } @else {
            <div class="entry-list">
              @for (entry of filteredEntries(); track entry.id) {
                <div class="entry-row" [class]="'action-' + entry.action.toLowerCase()">
                  <span class="entry-time">{{ fmtTime(entry.timestamp) }}</span>
                  <span class="entry-table" [class]="'badge-t' + entry.tableId">{{ entry.tableId }}</span>
                  <span class="entry-action" [class]="'action-badge-' + entry.action.toLowerCase()">{{ entry.action }}</span>
                  <span class="entry-desc">{{ entry.description }}</span>
                  @if (entry.action === 'UPDATE' || entry.action === 'DELETE') {
                    <button
                      type="button"
                      class="revert-btn"
                      (click)="revertRequest.emit(entry)"
                      title="Revert this change"
                      aria-label="Revert change"
                    >↩ Revert</button>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./grid-audit-trail.css'],
})
export class GridAuditTrailComponent {
  readonly audit = inject(TradesAuditService);
  readonly revertRequest = output<AuditEntry>();

  readonly collapsed = signal(false);
  readonly tableFilter = signal<TableId | 'ALL'>('ALL');
  readonly filterTabs: Array<TableId | 'ALL'> = ['ALL', 'T1', 'T2'];

  readonly filteredEntries = computed(() => {
    const f = this.tableFilter();
    return f === 'ALL'
      ? this.audit.entries()
      : this.audit.entries().filter(e => e.tableId === f);
  });

  fmtTime(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
