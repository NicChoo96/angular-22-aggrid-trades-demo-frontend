import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ActivityLogService } from './services/activity-log.service';
import { TradeCoordinatorService } from './services/trade-coordinator.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  private readonly coordinator = inject(TradeCoordinatorService);
  readonly logService = inject(ActivityLogService);

  readonly instrumentId = this.coordinator.instrumentId;
  readonly riskProfileId = this.coordinator.riskProfileId;
}
