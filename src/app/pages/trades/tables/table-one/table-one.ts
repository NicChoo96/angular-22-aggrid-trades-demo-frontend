import {
  Component, computed, effect, ElementRef, inject,
  OnInit, signal, viewChild,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule, ColDef, GridApi, GridReadyEvent,
  IRowNode, ModuleRegistry, RowSelectedEvent,
} from 'ag-grid-community';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { DecimalPipe } from '@angular/common';
import { TradesAuditService } from '../../services/trades-audit.service';
import { TradeFilterData, TradeRecord } from '../../models/trade.models';
import { TABLE_ONE_DATA, TRADE_DESKS, TRADE_STATUSES } from '../../data/trade-data.factory';
import { GridColumnPanelComponent } from '../../components/grid-column-panel/grid-column-panel';
import { GridFooterComponent } from '../../components/grid-footer/grid-footer';
import { TradeFormDialogComponent } from '../../components/trade-form-dialog/trade-form-dialog';

ModuleRegistry.registerModules([AllCommunityModule]);

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const fmtNum = (v: number) => FMT.format(v);
const fmtDate = (v: string) => v ? new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

@Component({
  selector: 'app-table-one',
  imports: [
    AgGridAngular, FormField, FormRoot,
    GridColumnPanelComponent, GridFooterComponent, TradeFormDialogComponent,
    DecimalPipe,
  ],
  templateUrl: './table-one.html',
  styleUrls: ['./table-one.css'],
})
export class TableOneComponent implements OnInit {
  private readonly audit = inject(TradesAuditService);

  // ── Data ────────────────────────────────────────────────────────────────────
  private allRows = signal<TradeRecord[]>([...TABLE_ONE_DATA]);
  readonly rowData = this.allRows;

  // ── Grid API ────────────────────────────────────────────────────────────────
  readonly gridApi = signal<GridApi | null>(null);
  private readonly gridContainer = viewChild<ElementRef<HTMLDivElement>>('gridContainer');

  // ── UI State ────────────────────────────────────────────────────────────────
  readonly showPanel  = signal(false);
  readonly showDialog = signal(false);
  readonly editingTrade = signal<TradeRecord | null>(null);
  readonly selectedRow = signal<TradeRecord | null>(null);
  readonly zoom = signal(100);
  readonly quickFilter = signal('');
  readonly rowCount = computed(() => this.allRows().length);

  // ── Signal Form Filter ──────────────────────────────────────────────────────
  readonly filterModel = signal<TradeFilterData>({
    direction: 'ALL',
    status: 'ALL',
    desk: '',
    pnlMin: -1e9,
    pnlMax: 1e9,
  });

  readonly filterForm = form(this.filterModel);

  readonly filterDesks = ['ALL', ...TRADE_DESKS];
  readonly filterStatuses = ['ALL', ...TRADE_STATUSES];
  readonly filterDirections = ['ALL', 'BUY', 'SELL'];

  // ── Column Definitions ──────────────────────────────────────────────────────
  readonly colDefs: ColDef<TradeRecord>[] = [
    {
      field: 'id', headerName: 'Trade ID', width: 130, pinned: 'left',
      checkboxSelection: true, headerCheckboxSelection: false,
    },
    { field: 'tradeDate',    headerName: 'Date',        width: 120, filter: 'agDateColumnFilter',   valueFormatter: p => fmtDate(p.value) },
    { field: 'symbol',       headerName: 'Symbol',      width: 110, filter: 'agTextColumnFilter',   cellStyle: { fontWeight: '600', color: '#67e8f9' } },
    { field: 'exchange',     headerName: 'Exchange',    width: 100, filter: 'agTextColumnFilter' },
    {
      field: 'direction', headerName: 'Dir', width: 80, filter: 'agTextColumnFilter',
      cellStyle: (p: any) => ({ color: p.value === 'BUY' ? '#34d399' : '#f87171', fontWeight: '700' }),
    },
    { field: 'quantity',     headerName: 'Qty',         width: 100, filter: 'agNumberColumnFilter', type: 'numericColumn' },
    { field: 'price',        headerName: 'Price',       width: 110, filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: p => p.value ? `$${p.value.toFixed(2)}` : '' },
    { field: 'notional',     headerName: 'Notional',    width: 130, filter: 'agNumberColumnFilter', type: 'numericColumn', valueFormatter: p => fmtNum(p.value) },
    {
      field: 'pnl', headerName: 'P&L', width: 130, filter: 'agNumberColumnFilter', type: 'numericColumn',
      valueFormatter: p => fmtNum(p.value),
      cellStyle: (p: any) => ({ color: p.value >= 0 ? '#34d399' : '#f87171', fontWeight: '600' }),
    },
    {
      field: 'status', headerName: 'Status', width: 110, filter: 'agTextColumnFilter',
      cellStyle: (p: any) => {
        const map: Record<string, string> = { OPEN: '#34d399', CLOSED: '#94a3b8', PENDING: '#fbbf24', CANCELLED: '#f87171' };
        return { color: map[p.value] ?? '#94a3b8', fontWeight: '600' };
      },
    },
    { field: 'trader',       headerName: 'Trader',      width: 140, filter: 'agTextColumnFilter' },
    { field: 'desk',         headerName: 'Desk',        width: 120, filter: 'agTextColumnFilter' },
    { field: 'strategy',     headerName: 'Strategy',    width: 130, filter: 'agTextColumnFilter' },
    { field: 'currency',     headerName: 'CCY',         width: 70,  filter: 'agTextColumnFilter' },
    { field: 'counterparty', headerName: 'Counterparty',width: 150, filter: 'agTextColumnFilter' },
  ];

  readonly defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    suppressHeaderMenuButton: false,
  };

  // ── External Filter ─────────────────────────────────────────────────────────
  readonly isExternalFilterPresent = (): boolean => {
    const f = this.filterModel();
    return f.direction !== 'ALL' || f.status !== 'ALL' || f.desk !== '' ||
           f.pnlMin !== -1e9 || f.pnlMax !== 1e9;
  };

  readonly doesExternalFilterPass = (node: IRowNode<TradeRecord>): boolean => {
    const data = node.data!;
    const f = this.filterModel();
    if (f.direction !== 'ALL' && data.direction !== f.direction) return false;
    if (f.status   !== 'ALL' && data.status   !== f.status)   return false;
    if (f.desk && !data.desk.toLowerCase().includes(f.desk.toLowerCase())) return false;
    if (data.pnl < f.pnlMin || data.pnl > f.pnlMax) return false;
    return true;
  };

  constructor() {
    // Propagate form filter changes → grid external filter
    effect(() => {
      this.filterModel(); // track
      this.gridApi()?.onFilterChanged();
    });

    // Propagate quickFilter changes → grid
    effect(() => {
      const q = this.quickFilter();
      this.gridApi()?.setGridOption('quickFilterText', q);
    });

    // Apply zoom
    effect(() => {
      const z = this.zoom();
      const el = this.gridContainer()?.nativeElement;
      if (el) el.style.setProperty('--ag-font-size', `${Math.round(12 * z / 100)}px`);
    });
  }

  ngOnInit(): void {
    this.audit.record({ tableId: 'T1', action: 'FILTER', description: 'Table T1 initialised — 200 rows loaded' });
  }

  // ── Grid Events ─────────────────────────────────────────────────────────────
  onGridReady(params: GridReadyEvent): void {
    this.gridApi.set(params.api);
  }

  onRowSelected(event: RowSelectedEvent<TradeRecord>): void {
    if (event.node.isSelected()) this.selectedRow.set(event.data ?? null);
    else if (!event.api.getSelectedRows().length) this.selectedRow.set(null);
  }

  onSortChanged(): void {
    const state = this.gridApi()?.getColumnState();
    const sorted = state?.filter(c => c.sort).map(c => `${c.colId} ${c.sort}`).join(', ');
    if (sorted) this.audit.record({ tableId: 'T1', action: 'SORT', description: `Sort: ${sorted}` });
  }

  onFilterChanged(): void {
    const model = this.gridApi()?.getFilterModel();
    const cols = Object.keys(model ?? {}).join(', ');
    if (cols) this.audit.record({ tableId: 'T1', action: 'FILTER', description: `Column filter on: ${cols}` });
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  openAdd(): void {
    this.editingTrade.set(null);
    this.showDialog.set(true);
  }

  openEdit(): void {
    const row = this.selectedRow();
    if (!row) return;
    this.editingTrade.set(row);
    this.showDialog.set(true);
  }

  onSaved(trade: TradeRecord): void {
    const existing = this.editingTrade();
    if (existing) {
      const snap = { ...existing };
      this.allRows.update(rows => rows.map(r => r.id === trade.id ? trade : r));
      this.audit.record({
        tableId: 'T1', action: 'UPDATE', tradeId: trade.id,
        description: `Updated ${trade.id} (${trade.symbol})`,
        snapshot: snap,
      });
    } else {
      this.allRows.update(rows => [trade, ...rows]);
      this.audit.record({
        tableId: 'T1', action: 'CREATE', tradeId: trade.id,
        description: `Created ${trade.id} (${trade.symbol} ${trade.direction})`,
      });
    }
    this.showDialog.set(false);
    this.selectedRow.set(null);
  }

  deleteSelected(): void {
    const row = this.selectedRow();
    if (!row || !confirm(`Delete trade ${row.id}?`)) return;
    const snap = { ...row };
    this.allRows.update(rows => rows.filter(r => r.id !== row.id));
    this.audit.record({
      tableId: 'T1', action: 'DELETE', tradeId: row.id,
      description: `Deleted ${row.id} (${row.symbol} ${row.direction})`,
      snapshot: snap,
    });
    this.selectedRow.set(null);
  }

  exportCsv(): void {
    this.gridApi()?.exportDataAsCsv({ fileName: `trades-t1-${Date.now()}.csv` });
    this.audit.record({ tableId: 'T1', action: 'EXPORT', description: 'Exported table T1 as CSV' });
  }

  clearFilters(): void {
    this.filterModel.set({ direction: 'ALL', status: 'ALL', desk: '', pnlMin: -1e9, pnlMax: 1e9 });
    this.filterForm().reset({ direction: 'ALL', status: 'ALL', desk: '', pnlMin: -1e9, pnlMax: 1e9 });
    this.quickFilter.set('');
    this.gridApi()?.setFilterModel(null);
  }

  // ── Revert (called from audit trail) ────────────────────────────────────────
  handleRevert(entry: import('../../models/trade.models').AuditEntry): void {
    if (entry.tableId !== 'T1') return;
    if (entry.action === 'UPDATE' && entry.snapshot) {
      this.allRows.update(rows => rows.map(r => r.id === entry.snapshot!.id ? entry.snapshot! : r));
      this.audit.record({ tableId: 'T1', action: 'UPDATE', description: `Reverted ${entry.snapshot.id} to pre-update state` });
    }
    if (entry.action === 'DELETE' && entry.snapshot) {
      this.allRows.update(rows => [entry.snapshot!, ...rows]);
      this.audit.record({ tableId: 'T1', action: 'CREATE', description: `Restored deleted trade ${entry.snapshot.id}` });
    }
  }
}
