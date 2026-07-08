import { Component, inject, viewChild } from '@angular/core';
import { TableOneComponent } from './tables/table-one/table-one';
import { TableTwoComponent } from './tables/table-two/table-two';
import { GridAuditTrailComponent } from './components/grid-audit-trail/grid-audit-trail';
import { AuditEntry } from './models/trade.models';

@Component({
  selector: 'app-trades-page',
  imports: [TableOneComponent, TableTwoComponent, GridAuditTrailComponent],
  templateUrl: './trades-page.html',
  styleUrls: ['./trades-page.css'],
})
export class TradesPageComponent {
  private readonly t1 = viewChild<TableOneComponent>(TableOneComponent);
  private readonly t2 = viewChild<TableTwoComponent>(TableTwoComponent);

  onRevert(entry: AuditEntry): void {
    this.t1()?.handleRevert(entry);
    this.t2()?.handleRevert(entry);
  }
}
