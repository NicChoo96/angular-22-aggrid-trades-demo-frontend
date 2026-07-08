import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { form, FormField, FormRoot, required, min, max, minLength } from '@angular/forms/signals';
import { TradeRecord } from '../../models/trade.models';
import {
  TRADE_CURRENCIES, TRADE_DESKS, TRADE_EXCHANGES,
  TRADE_STATUSES, TRADE_STRATEGIES, TRADE_SYMBOLS, TRADE_TRADERS,
} from '../../data/trade-data.factory';

const DIRECTIONS = ['BUY', 'SELL'] as const;

@Component({
  selector: 'app-trade-form-dialog',
  imports: [FormField, FormRoot],
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)">
      <div class="dialog-box" role="dialog"
        [attr.aria-label]="editingTrade() ? 'Edit trade' : 'New trade'"
        aria-modal="true">

        <div class="dialog-header">
          <h2 class="dialog-title">{{ editingTrade() ? '✎ Edit Trade' : '+ New Trade' }}</h2>
          <button type="button" class="dialog-close" (click)="cancel.emit()" aria-label="Close">✕</button>
        </div>

        <form [formRoot]="tradeForm" class="dialog-body" novalidate>
          <div class="form-grid">

            <!-- Symbol -->
            <div class="field-group">
              <label class="field-label" for="dlg-symbol">Symbol *</label>
              <select id="dlg-symbol" class="field-input field-select"
                [class.is-invalid]="tradeForm.symbol().touched() && tradeForm.symbol().invalid()"
                [formField]="tradeForm.symbol">
                <option value="">— Select —</option>
                @for (s of symbols; track s) { <option [value]="s">{{ s }}</option> }
              </select>
              @if (tradeForm.symbol().touched() && tradeForm.symbol().invalid()) {
                <p class="field-error">{{ tradeForm.symbol().errors()[0].message }}</p>
              }
            </div>

            <!-- Exchange -->
            <div class="field-group">
              <label class="field-label" for="dlg-exchange">Exchange *</label>
              <select id="dlg-exchange" class="field-input field-select"
                [formField]="tradeForm.exchange">
                <option value="">— Select —</option>
                @for (e of exchanges; track e) { <option [value]="e">{{ e }}</option> }
              </select>
            </div>

            <!-- Direction -->
            <div class="field-group">
              <label class="field-label" for="dlg-direction">Direction *</label>
              <select id="dlg-direction" class="field-input field-select"
                [formField]="tradeForm.direction">
                @for (d of directions; track d) { <option [value]="d">{{ d }}</option> }
              </select>
            </div>

            <!-- Status -->
            <div class="field-group">
              <label class="field-label" for="dlg-status">Status *</label>
              <select id="dlg-status" class="field-input field-select"
                [formField]="tradeForm.status">
                @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </div>

            <!-- Quantity -->
            <div class="field-group">
              <label class="field-label" for="dlg-qty">Quantity *</label>
              <input id="dlg-qty" type="number" class="field-input"
                [class.is-invalid]="tradeForm.quantity().touched() && tradeForm.quantity().invalid()"
                [formField]="tradeForm.quantity" placeholder="100" />
              @if (tradeForm.quantity().touched() && tradeForm.quantity().invalid()) {
                <p class="field-error">{{ tradeForm.quantity().errors()[0].message }}</p>
              }
            </div>

            <!-- Price -->
            <div class="field-group">
              <label class="field-label" for="dlg-price">Price *</label>
              <input id="dlg-price" type="number" class="field-input"
                [class.is-invalid]="tradeForm.price().touched() && tradeForm.price().invalid()"
                [formField]="tradeForm.price" placeholder="100.00" />
              @if (tradeForm.price().touched() && tradeForm.price().invalid()) {
                <p class="field-error">{{ tradeForm.price().errors()[0].message }}</p>
              }
            </div>

            <!-- P&L -->
            <div class="field-group">
              <label class="field-label" for="dlg-pnl">P&amp;L (USD)</label>
              <input id="dlg-pnl" type="number" class="field-input"
                [formField]="tradeForm.pnl" placeholder="0.00" />
            </div>

            <!-- Trader -->
            <div class="field-group">
              <label class="field-label" for="dlg-trader">Trader *</label>
              <select id="dlg-trader" class="field-input field-select"
                [formField]="tradeForm.trader">
                <option value="">— Select —</option>
                @for (t of traders; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>

            <!-- Desk -->
            <div class="field-group">
              <label class="field-label" for="dlg-desk">Desk *</label>
              <select id="dlg-desk" class="field-input field-select"
                [formField]="tradeForm.desk">
                <option value="">— Select —</option>
                @for (d of desks; track d) { <option [value]="d">{{ d }}</option> }
              </select>
            </div>

            <!-- Strategy -->
            <div class="field-group">
              <label class="field-label" for="dlg-strat">Strategy</label>
              <select id="dlg-strat" class="field-input field-select"
                [formField]="tradeForm.strategy">
                <option value="">— Select —</option>
                @for (s of strategies; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </div>

            <!-- Currency -->
            <div class="field-group">
              <label class="field-label" for="dlg-ccy">Currency *</label>
              <select id="dlg-ccy" class="field-input field-select"
                [formField]="tradeForm.currency">
                <option value="">— Select —</option>
                @for (c of currencies; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>

            <!-- Trade Date -->
            <div class="field-group">
              <label class="field-label" for="dlg-date">Trade Date *</label>
              <input id="dlg-date" type="date" class="field-input"
                [formField]="tradeForm.tradeDate" />
            </div>

          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-ghost" (click)="cancel.emit()">Cancel</button>
            <button type="submit" class="btn-confirm"
              [disabled]="tradeForm().invalid()">
              {{ editingTrade() ? 'Update Trade' : 'Create Trade' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['./trade-form-dialog.css'],
})
export class TradeFormDialogComponent implements OnInit {
  readonly editingTrade = input<TradeRecord | null>(null);
  readonly saved        = output<TradeRecord>();
  readonly cancel       = output<void>();

  readonly symbols    = TRADE_SYMBOLS;
  readonly exchanges  = TRADE_EXCHANGES;
  readonly statuses   = TRADE_STATUSES;
  readonly traders    = TRADE_TRADERS;
  readonly desks      = TRADE_DESKS;
  readonly strategies = TRADE_STRATEGIES;
  readonly currencies = TRADE_CURRENCIES;
  readonly directions = DIRECTIONS;

  private today = new Date().toISOString().split('T')[0];

  private initialData() {
    const t = this.editingTrade();
    return {
      symbol:      t?.symbol      ?? '',
      exchange:    t?.exchange    ?? '',
      direction:   t?.direction   ?? 'BUY',
      status:      t?.status      ?? 'OPEN',
      quantity:    t?.quantity    ?? 100,
      price:       t?.price       ?? 100,
      pnl:         t?.pnl         ?? 0,
      trader:      t?.trader      ?? '',
      desk:        t?.desk        ?? '',
      strategy:    t?.strategy    ?? '',
      currency:    t?.currency    ?? 'USD',
      tradeDate:   t?.tradeDate   ?? this.today,
    };
  }

  readonly tradeModel = signal(this.initialData());

  readonly tradeForm = form(this.tradeModel, (s) => {
    required(s.symbol,    { message: 'Symbol is required' });
    required(s.exchange,  { message: 'Exchange is required' });
    required(s.direction, { message: 'Direction is required' });
    required(s.status,    { message: 'Status is required' });
    required(s.quantity,  { message: 'Quantity is required' });
    min(s.quantity, 1,    { message: 'Quantity must be ≥ 1' });
    required(s.price,     { message: 'Price is required' });
    min(s.price, 0.01,    { message: 'Price must be > 0' });
    required(s.trader,    { message: 'Trader is required' });
    required(s.desk,      { message: 'Desk is required' });
    required(s.currency,  { message: 'Currency is required' });
    required(s.tradeDate, { message: 'Trade date is required' });
  }, {
    submission: {
      action: async () => {
        const data = this.tradeModel();
        const existing = this.editingTrade();
        const trade: TradeRecord = {
          id:           existing?.id ?? `TRD-${Date.now()}`,
          counterparty: existing?.counterparty ?? 'Counterparty',
          notional:     parseFloat((data.quantity * data.price).toFixed(2)),
          ...data,
        };
        this.saved.emit(trade);
      },
    },
  });

  ngOnInit(): void {
    this.tradeModel.set(this.initialData());
  }

  onBackdropClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.cancel.emit();
    }
  }
}
