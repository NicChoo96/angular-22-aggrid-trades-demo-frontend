import { Injectable, signal } from '@angular/core';
import { ActivityEntry, FormId, LogLevel } from '../models/trade.models';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private nextId = 1;

  readonly entries = signal<ActivityEntry[]>([]);

  log(formId: FormId, level: LogLevel, message: string): void {
    const entry: ActivityEntry = {
      id: this.nextId++,
      timestamp: new Date(),
      formId,
      level,
      message,
    };
    this.entries.update(prev => [entry, ...prev].slice(0, 80));
  }

  clear(): void {
    this.entries.set([]);
    this.log('SYSTEM', 'info', 'Activity log cleared');
  }
}
