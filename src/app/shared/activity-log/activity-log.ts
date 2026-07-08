import { Component, computed, inject, signal } from '@angular/core';
import { ActivityLogService } from '../../services/activity-log.service';
import { ActivityEntry, FormId, LogLevel } from '../../models/trade.models';

type FilterOption = FormId | 'ALL';

@Component({
  selector: 'app-activity-log',
  templateUrl: './activity-log.html',
  styleUrls: ['./activity-log.css'],
})
export class ActivityLogComponent {
  private readonly logService = inject(ActivityLogService);

  readonly filter = signal<FilterOption>('ALL');
  readonly filterOptions: FilterOption[] = ['ALL', 'A', 'B', 'C', 'SYSTEM'];

  readonly filteredEntries = computed(() => {
    const f = this.filter();
    const all = this.logService.entries();
    return f === 'ALL' ? all : all.filter(e => e.formId === f);
  });

  readonly entryCount = computed(() => this.filteredEntries().length);

  setFilter(f: FilterOption): void {
    this.filter.set(f);
  }

  clear(): void {
    this.logService.clear();
  }

  trackById(_: number, entry: ActivityEntry): number {
    return entry.id;
  }

  levelClass(level: LogLevel): string {
    return {
      info: 'badge-info',
      success: 'badge-success',
      warning: 'badge-warning',
      error: 'badge-error',
    }[level];
  }

  formBadgeClass(formId: FormId): string {
    return {
      A: 'form-badge-a',
      B: 'form-badge-b',
      C: 'form-badge-c',
      SYSTEM: 'form-badge-sys',
    }[formId];
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
