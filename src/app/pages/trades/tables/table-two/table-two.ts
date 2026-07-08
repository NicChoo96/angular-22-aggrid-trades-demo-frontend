import {
  Component, computed, effect, ElementRef,
  inject, OnInit, signal, viewChild,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule, CellValueChangedEvent, ColDef,
  GridApi, GridReadyEvent, IDatasource, IGetRowsParams, ModuleRegistry,
  RowSelectedEvent,
} from 'ag-grid-community';
import { DecimalPipe } from '@angular/common';

import { TradesAuditService } from '../../services/trades-audit.service';
import { TradeRecord } from '../../models/trade.models';
import { generateTrade, TABLE_TWO_MASTER } from '../../data/trade-data.factory';
import { GridColumnPanelComponent } from '../../components/grid-column-panel/grid-column-panel';
import { GridFooterComponent } from '../../components/grid-footer/grid-footer';

// ModuleRegistry called in table-one; calling again is safe (idempotent)
ModuleRegistry.registerModules([AllCommunityModule]);

const FMT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const fmtNum = (v: number) => FMT.format(v);
const fmtDate = (v: string) => v ? new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

@Component({
  selector: 'app-table-two',
  imports: [AgGridAngular, GridColumnPanelComponent, GridFooterComponent, DecimalPipe],
  templateUrl: './table-two.html',
  styleUrls: ['./table-two.css'],
})
export class TableTwoComponent implements OnInit {
  private readonly audit = inject(TradesAuditService);

  // ── Simulated "server" data store ───────────────────────────────────────────
  private serverData = signal<TradeRecord[]>([...TABLE_TWO_MASTER]);
  private nextNewId = 701;

  // ── Grid API ────────────────────────────────────────────────────────────────
  readonly gridApi = signal<GridApi | null>(null);
  private readonly gridContainer = viewChild<ElementRef<HTMLDivElement>>('gridContainer');

  // ── UI ──────────────────────────────────────────────────────────────────────
  readonly showPanel   = signal(false);
  readonly selectedRow = signal<TradeRecord | null>(null);
  readonly zoom        = signal(100);
  readonly quickFilter = signal('');
  readonly isLoading   = signal(false);
  readonly totalRows   = signal(0);

  // ── Simulated server datasource ─────────────────────────────────────────────
  private buildDatasource(): IDatasource {
    return {
      getRows: (params: IGetRowsParams) => {
        const search   = this.quickFilter().toLowerCase();
        const sortModel = params.sortModel;
        const filterModel = params.filterModel;

        this.isLoading.set(true);

        // Simulate network latency (150-400ms)
        const delay = 150 + Math.floor(Math.random() * 250);

        setTimeout(() => {
          let data = [...this.serverData()];

          // Apply global search
          if (search) {
            data = data.filter(row =>
              Object.values(row).some(v => String(v).toLowerCase().includes(search)),
            );
          }

          // Apply AG Grid column filterModel (text / number / date conditions)
          if (filterModel && Object.keys(filterModel).length > 0) {
            data = data.filter(row => this.applyFilterModel(row, filterModel));
          }

          // Apply sort
          if (sortModel.length > 0) {
            const { colId, sort } = sortModel[0];
            data.sort((a: any, b: any) => {
              const va = a[colId], vb = b[colId];
              const cmp = va < vb ? -1 : va > vb ? 1 : 0;
              return sort === 'asc' ? cmp : -cmp;
            });
          }

          this.totalRows.set(data.length);
          const rowsThisBlock = data.slice(params.startRow, params.endRow);
          const lastRow = params.endRow >= data.length ? data.length : undefined;
          params.successCallback(rowsThisBlock, lastRow);
          this.isLoading.set(false);
        }, delay);
      },
    };
  }

  private applyFilterModel(row: any, filterModel: any): boolean {
    for (const colId of Object.keys(filterModel)) {
      const filter = filterModel[colId];
      const value = row[colId];
      if (!this.matchesFilter(value, filter)) return false;
    }
    return true;
  }

  private matchesFilter(value: any, filter: any): boolean {
    const { filterType, type, filter: fVal, filterTo, condition1, condition2, operator } = filter;

    const matchSingle = (v: any, fType: string, fT: string, fV: any, fVTo: any): boolean => {
      const str = String(v ?? '').toLowerCase();
      const num = Number(v);
      switch (fType) {
        case 'text': {
          const term = String(fV ?? '').toLowerCase();
          if (fT === 'contains')       return str.includes(term);
          if (fT === 'notContains')    return !str.includes(term);
          if (fT === 'equals')         return str === term;
          if (fT === 'notEqual')       return str !== term;
          if (fT === 'startsWith')     return str.startsWith(term);
          if (fT === 'endsWith')       return str.endsWith(term);
          return true;
        }
        case 'number': {
          if (fT === 'equals')         return num === fV;
          if (fT === 'notEqual')       return num !== fV;
          if (fT === 'greaterThan')    return num > fV;
          if (fT === 'greaterThanOrEqual') return num >= fV;
          if (fT === 'lessThan')       return num < fV;
          if (fT === 'lessThanOrEqual')    return num <= fV;
          if (fT === 'inRange')        return num >= fV && num <= (fVTo ?? fV);
          return true;
        }
        case 'date': {
          const d = new Date(v).getTime();
          const fd = new Date(fV).getTime();
          if (fT === 'equals')      return d === fd;
          if (fT === 'greaterThan') return d > fd;
          if (fT === 'lessThan')    return d < fd;
          if (fT === 'inRange')     return d >= fd && d <= new Date(fVTo).getTime();
          return true;
        }
        default: return true;
      }
    };

    if (condition1) {
      const r1 = matchSingle(value, filterType, condition1.type, condition1.filter, condition1.filterTo);
      const r2 = matchSingle(value, filterType, condition2.type, condition2.filter, condition2.filterTo);
      return operator === 'OR' ? r1 || r2 : r1 && r2;
    }
    return matchSingle(value, filterType, type, fVal, filterTo);
  }

  // ── Column Definitions ──────────────────────────────────────────────────────
  readonly colDefs: ColDef<TradeRecord>[] = [
    {
      field: 'id', headerName: 'Trade ID', width: 130, pinned: 'left',
      editable: false, checkboxSelection: true,
    },
    { field: 'tradeDate',    headerName: 'Date',        width: 120, filter: 'agDateColumnFilter',   editable: true, valueFormatter: (p: any) => fmtDate(p.value) },
    { field: 'symbol',       headerName: 'Symbol',      width: 110, filter: 'agTextColumnFilter',   editable: true, cellStyle: { fontWeight: '600', color: '#67e8f9' } },
    { field: 'exchange',     headerName: 'Exchange',    width: 100, filter: 'agTextColumnFilter',   editable: true },
    {
      field: 'direction', headerName: 'Dir', width: 80, filter: 'agTextColumnFilter', editable: true,
      cellStyle: (p: any) => ({ color: p.value === 'BUY' ? '#34d399' : '#f87171', fontWeight: '700' }),
    },
    { field: 'quantity',     headerName: 'Qty',         width: 100, filter: 'agNumberColumnFilter', editable: true, type: 'numericColumn' },
    { field: 'price',        headerName: 'Price',       width: 110, filter: 'agNumberColumnFilter', editable: true, type: 'numericColumn', valueFormatter: (p: any) => p.value ? `$${Number(p.value).toFixed(2)}` : '' },
    { field: 'notional',     headerName: 'Notional',    width: 130, filter: 'agNumberColumnFilter', editable: false, type: 'numericColumn', valueFormatter: (p: any) => fmtNum(p.value) },
    {
      field: 'pnl', headerName: 'P&L', width: 130, filter: 'agNumberColumnFilter', editable: true, type: 'numericColumn',
      valueFormatter: (p: any) => fmtNum(p.value),
      cellStyle: (p: any) => ({ color: p.value >= 0 ? '#34d399' : '#f87171', fontWeight: '600' }),
    },
    {
      field: 'status', headerName: 'Status', width: 110, filter: 'agTextColumnFilter', editable: true,
      cellStyle: (p: any) => {
        const map: Record<string, string> = { OPEN: '#34d399', CLOSED: '#94a3b8', PENDING: '#fbbf24', CANCELLED: '#f87171' };
        return { color: map[p.value] ?? '#94a3b8', fontWeight: '600' };
      },
    },
    { field: 'trader',       headerName: 'Trader',      width: 140, filter: 'agTextColumnFilter',   editable: true },
    { field: 'desk',         headerName: 'Desk',        width: 120, filter: 'agTextColumnFilter',   editable: true },
    { field: 'strategy',     headerName: 'Strategy',    width: 130, filter: 'agTextColumnFilter',   editable: true },
    { field: 'currency',     headerName: 'CCY',         width: 70,  filter: 'agTextColumnFilter',   editable: true },
    { field: 'counterparty', headerName: 'Counterparty',width: 150, filter: 'agTextColumnFilter',   editable: true },
  ];

  readonly defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
  };

  constructor() {
    // When quickFilter changes, reset the datasource to re-query
    effect(() => {
      this.quickFilter(); // track
      this.gridApi()?.setGridOption('datasource', this.buildDatasource());
    });

    // Apply zoom
    effect(() => {
      const z = this.zoom();
      const el = this.gridContainer()?.nativeElement;
      if (el) el.style.setProperty('--ag-font-size', `${Math.round(12 * z / 100)}px`);
    });
  }

  ngOnInit(): void {
    this.audit.record({ tableId: 'T2', action: 'FILTER', description: 'Table T2 initialised — infinite scroll datasource ready (500 server rows)' });
  }

  // ── Grid Events ─────────────────────────────────────────────────────────────
  onGridReady(params: GridReadyEvent): void {
    this.gridApi.set(params.api);
    params.api.setGridOption('datasource', this.buildDatasource());
  }

  onRowSelected(event: RowSelectedEvent<TradeRecord>): void {
    if (event.node.isSelected()) this.selectedRow.set(event.data ?? null);
    else if (!event.api.getSelectedRows().length) this.selectedRow.set(null);
  }

  onCellValueChanged(event: CellValueChangedEvent<TradeRecord>): void {
    const trade = event.data;
    const field = event.column.getColId();
    const oldVal = event.oldValue;
    const newVal = event.newValue;

    // Update the simulated server store
    this.serverData.update(rows =>
      rows.map(r => r.id === trade.id ? { ...r, [field]: newVal } : r),
    );

    this.audit.record({
      tableId: 'T2', action: 'UPDATE', tradeId: trade.id, field,
      oldValue: oldVal, newValue: newVal,
      description: `${trade.id}.${field}: "${oldVal}" → "${newVal}"`,
      snapshot: { ...trade, [field]: oldVal },
    });
  }

  onSortChanged(): void {
    const state = this.gridApi()?.getColumnState();
    const sorted = state?.filter((c: any) => c.sort).map((c: any) => `${c.colId} ${c.sort}`).join(', ');
    if (sorted) this.audit.record({ tableId: 'T2', action: 'SORT', description: `Sort: ${sorted}` });
  }

  onFilterChanged(): void {
    const model = this.gridApi()?.getFilterModel();
    const cols = Object.keys(model ?? {}).join(', ');
    if (cols) this.audit.record({ tableId: 'T2', action: 'FILTER', description: `Column filter on: ${cols}` });
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  addNewRow(): void {
    const trade = generateTrade(this.nextNewId++);
    this.serverData.update(rows => [trade, ...rows]);
    this.gridApi()?.setGridOption('datasource', this.buildDatasource());
    this.audit.record({
      tableId: 'T2', action: 'CREATE', tradeId: trade.id,
      description: `Added new trade ${trade.id} (${trade.symbol} ${trade.direction})`,
    });
  }

  deleteSelected(): void {
    const row = this.selectedRow();
    if (!row || !confirm(`Delete trade ${row.id}?`)) return;
    const snap = { ...row };
    this.serverData.update(rows => rows.filter(r => r.id !== row.id));
    this.gridApi()?.setGridOption('datasource', this.buildDatasource());
    this.audit.record({
      tableId: 'T2', action: 'DELETE', tradeId: row.id,
      description: `Deleted ${row.id} (${row.symbol})`, snapshot: snap,
    });
    this.selectedRow.set(null);
  }

  exportCsv(): void {
    // Export loaded rows from the infinite cache
    const rows: TradeRecord[] = [];
    this.gridApi()?.forEachNode(node => { if (node.data) rows.push(node.data); });
    const cols = Object.keys(rows[0] ?? {}).join(',');
    const csv = [cols, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `trades-t2-${Date.now()}.csv`;
    a.click();
    this.audit.record({ tableId: 'T2', action: 'EXPORT', description: 'Exported loaded T2 rows as CSV' });
  }

  // ── Revert from audit trail ──────────────────────────────────────────────────
  handleRevert(entry: import('../../models/trade.models').AuditEntry): void {
    if (entry.tableId !== 'T2' || !entry.snapshot) return;
    if (entry.action === 'UPDATE') {
      this.serverData.update(rows =>
        rows.map(r => r.id === entry.snapshot!.id ? entry.snapshot! : r),
      );
      this.gridApi()?.setGridOption('datasource', this.buildDatasource());
      this.audit.record({ tableId: 'T2', action: 'UPDATE', description: `Reverted ${entry.snapshot.id}.${entry.field} to "${entry.oldValue}"` });
    }
    if (entry.action === 'DELETE') {
      this.serverData.update(rows => [entry.snapshot!, ...rows]);
      this.gridApi()?.setGridOption('datasource', this.buildDatasource());
      this.audit.record({ tableId: 'T2', action: 'CREATE', description: `Restored deleted trade ${entry.snapshot.id}` });
    }
  }
}
