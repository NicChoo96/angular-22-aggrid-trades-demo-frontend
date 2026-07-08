import { Component, computed, signal } from '@angular/core';

export interface SkillSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
  tags: string[];
  copied?: boolean;
}

export interface SkillSection {
  id: string;
  title: string;
  icon: string;
  accent: string;
  snippets: SkillSnippet[];
}

export const SKILL_SECTIONS: SkillSection[] = [
  {
    id: 'setup',
    title: 'Setup & Form Model',
    icon: '⬡',
    accent: '#06b6d4',
    snippets: [
      {
        id: 'setup-import',
        title: 'Import Signal Form primitives',
        description: 'Core imports from @angular/forms/signals needed to build any Signal Form.',
        tags: ['import', 'setup'],
        code: `import { form, FormField, FormRoot, submit } from '@angular/forms/signals';
import { required, min, max, minLength, maxLength, email } from '@angular/forms/signals';
import { disabled, hidden, readonly } from '@angular/forms/signals';`,
      },
      {
        id: 'setup-model',
        title: 'Define data interface + model signal',
        description: 'Create a TypeScript interface for your form data and wrap it in signal().',
        tags: ['model', 'signal', 'interface'],
        code: `interface TradeData {
  symbol: string;
  quantity: number;
  direction: string;
}

// In your component class:
readonly tradeModel = signal<TradeData>({
  symbol: '',
  quantity: 1,
  direction: 'BUY',
});`,
      },
      {
        id: 'setup-form',
        title: 'Create a form with validation schema',
        description: 'Pass the model signal and a schema callback to form(). The schemaPath gives type-safe access to every field path.',
        tags: ['form()', 'schema', 'validation'],
        code: `readonly tradeForm = form(
  this.tradeModel,
  (schemaPath) => {
    required(schemaPath.symbol,   { message: 'Symbol is required' });
    required(schemaPath.quantity, { message: 'Quantity is required' });
    min(schemaPath.quantity, 1,   { message: 'Must be at least 1' });
  },
);`,
      },
      {
        id: 'setup-component',
        title: 'Full minimal component scaffold',
        description: 'Complete standalone component with Signal Form wired up end-to-end.',
        tags: ['component', 'scaffold'],
        code: `import { Component, signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';

interface LoginData { email: string; password: string; }

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot],
  template: \`
    <form [formRoot]="loginForm">
      <input type="email" [formField]="loginForm.email" />
      <input type="password" [formField]="loginForm.password" />
      <button type="submit">Log in</button>
    </form>
  \`,
})
export class LoginComponent {
  readonly loginModel = signal<LoginData>({ email: '', password: '' });

  readonly loginForm = form(this.loginModel, (s) => {
    required(s.email,    { message: 'Email is required' });
    required(s.password, { message: 'Password is required' });
  });
}`,
      },
    ],
  },
  {
    id: 'field-state',
    title: 'Field State Signals',
    icon: '◈',
    accent: '#8b5cf6',
    snippets: [
      {
        id: 'state-all-signals',
        title: 'All available field state signals',
        description: 'Calling a field as a function — form.fieldName() — returns a FieldState with these reactive signals.',
        tags: ['FieldState', 'signals', 'reference'],
        code: `// Access via form.fieldName() → FieldState
const state = myForm.email();

// Validation
state.valid()    // true if all validators pass
state.invalid()  // true if any validator fails
state.errors()   // ValidationError[]
state.pending()  // true during async validation

// Interaction
state.touched()  // user focused + blurred the field
state.dirty()    // user modified the value

// Availability
state.disabled() // field is disabled
state.hidden()   // field is hidden
state.readonly() // field is readonly

// Value
state.value()    // WritableSignal with current value

// Methods
state.markAsTouched()        // programmatically mark touched
state.markAsTouched({ skipDescendants: true })
state.reset(newValue?)       // clear touched/dirty flags
state.focusBoundControl()    // move focus to bound input`,
      },
      {
        id: 'state-dirty-unsaved',
        title: 'Detect unsaved changes with dirty()',
        description: 'Use the form-level dirty() to show "unsaved changes" warnings. dirty() stays true even if the user reverts to the original value.',
        tags: ['dirty()', 'unsaved', 'form-level'],
        code: `<!-- In template -->
@if (myForm().dirty()) {
  <div class="unsaved-banner">
    ⚠ You have unsaved changes
  </div>
}

<!-- Disable save button when nothing changed -->
<button [disabled]="!myForm().dirty()">Save</button>

// In component:
readonly hasChanges = computed(() => this.myForm().dirty());`,
      },
      {
        id: 'state-touched-errors',
        title: 'Show errors only after touch',
        description: 'Best practice: reveal validation errors only once the user has interacted with (touched) a field.',
        tags: ['touched()', 'errors', 'UX'],
        code: `<!-- Show error only after user has blurred the field -->
@if (myForm.email().touched() && myForm.email().invalid()) {
  <p class="error">
    {{ myForm.email().errors()[0].message }}
  </p>
}

<!-- Style input based on state -->
<input
  type="email"
  [formField]="myForm.email"
  [class.is-invalid]="myForm.email().touched() && myForm.email().invalid()"
  [class.is-valid]="myForm.email().touched()   && myForm.email().valid()"
/>`,
      },
      {
        id: 'state-form-level',
        title: 'Form-level state aggregation',
        description: 'The root form aggregates state from all child fields — valid only when ALL interactive fields are valid.',
        tags: ['form-level', 'valid()', 'invalid()'],
        code: `// Form is valid when all interactive fields are valid
myForm().valid()    // ← all fields valid, no pending
myForm().invalid()  // ← at least one field has errors
myForm().dirty()    // ← at least one field was modified
myForm().touched()  // ← at least one field was touched
myForm().pending()  // ← async validation in progress

// Disable submit when form is invalid
<button type="submit" [disabled]="myForm().invalid()">
  Submit
</button>

// Enable save only when there are changes
<button [disabled]="!myForm().dirty() || myForm().invalid()">
  Save changes
</button>`,
      },
    ],
  },
  {
    id: 'submission',
    title: 'Form Submission & Reset',
    icon: '▶',
    accent: '#10b981',
    snippets: [
      {
        id: 'submit-formroot',
        title: 'Submit with FormRoot directive',
        description: 'Attach [formRoot] to the <form> element. When submitted, it auto-calls submit(), marks all fields touched, and runs your action only if valid.',
        tags: ['FormRoot', 'submit', 'action'],
        code: `// In component:
readonly myForm = form(
  this.myModel,
  schemaFn,
  {
    submission: {
      action: async (f) => {
        // Only runs when form is valid
        await api.save(this.myModel());

        // Reset touched/dirty flags (optionally pass new values)
        f().reset({ ...this.myModel() });
      },
    },
  },
);

// In template:
<form [formRoot]="myForm">
  <input [formField]="myForm.email" />
  <button type="submit" [disabled]="myForm().invalid()">
    Submit
  </button>
</form>`,
      },
      {
        id: 'submit-manual',
        title: 'Manual submit() call',
        description: 'Call submit() programmatically — useful when submit logic requires coordination with other forms or services.',
        tags: ['submit()', 'manual', 'programmatic'],
        code: `import { submit } from '@angular/forms/signals';

// In component:
onSave(): void {
  submit(this.myForm, {
    action: async () => {
      const id = await this.api.save(this.myModel());
      this.savedId.set(id);
      this.myForm().reset({ ...this.myModel() });
    },
  });
}

// submit() automatically:
// 1. Marks all fields as touched (reveals errors)
// 2. Runs action() only if form is VALID
// 3. Handles submission state internally`,
      },
      {
        id: 'submit-reset',
        title: 'Reset form state',
        description: 'reset() clears touched and dirty flags. Pass new values to also update the model data.',
        tags: ['reset()', 'dirty', 'touched'],
        code: `// Reset interaction state only (keep current values)
this.myForm().reset();

// Reset AND update model data (full clean slate)
const INITIAL = { email: '', password: '' };
this.myForm().reset({ ...INITIAL });

// After successful save — reset with current values
// to clear dirty/touched without changing displayed data
this.myForm().reset({ ...this.myModel() });

// Mark all fields touched (to reveal validation errors)
this.myForm().markAsTouched();`,
      },
      {
        id: 'submit-loading',
        title: 'Loading state during async submit',
        description: 'Track a local isSaving signal to show spinners and disable the button while the async action runs.',
        tags: ['loading', 'async', 'UX'],
        code: `// In component:
readonly isSaving = signal(false);

readonly myForm = form(this.myModel, schemaFn, {
  submission: {
    action: async (f) => {
      this.isSaving.set(true);
      try {
        await this.api.save(this.myModel());
        f().reset({ ...this.myModel() });
      } finally {
        this.isSaving.set(false);
      }
    },
  },
});

// In template:
<button type="submit" [disabled]="isSaving()">
  @if (isSaving()) { <span class="spinner"></span> Saving… }
  @else            { Save }
</button>`,
      },
    ],
  },
  {
    id: 'validation',
    title: 'Validation & Schema',
    icon: '✦',
    accent: '#f59e0b',
    snippets: [
      {
        id: 'validation-built-in',
        title: 'All built-in validators',
        description: 'Reference for every built-in validator available in @angular/forms/signals.',
        tags: ['validators', 'schema', 'reference'],
        code: `import {
  required, email,
  min, max,
  minLength, maxLength,
  pattern,
} from '@angular/forms/signals';

form(model, (s) => {
  required(s.name,       { message: 'Name is required' });
  email(s.email,         { message: 'Invalid email address' });
  min(s.age,       18,   { message: 'Must be 18 or older' });
  max(s.age,      120,   { message: 'Invalid age' });
  minLength(s.password, 8,   { message: 'At least 8 characters' });
  maxLength(s.password, 64,  { message: 'Too long' });
  pattern(s.code, /^[A-Z]{3}\d{3}$/, { message: 'Format: ABC123' });
});`,
      },
      {
        id: 'validation-availability',
        title: 'Conditional field availability',
        description: 'disabled(), hidden(), and readonly() accept a when() predicate. Use valueOf() to read other field values inside the predicate.',
        tags: ['disabled()', 'hidden()', 'readonly()', 'conditional'],
        code: `import { disabled, hidden, readonly } from '@angular/forms/signals';

form(model, (s) => {
  // Hide shipping fields when no shipping needed
  hidden(s.shippingAddress, {
    when: ({ valueOf }) => !valueOf(s.requiresShipping),
  });

  // Disable coupon when order < $50
  disabled(s.couponCode, {
    when: ({ valueOf }) => valueOf(s.orderTotal) < 50,
  });

  // Make username readonly (never editable)
  readonly(s.username);
});

// In template — gate with @if for hidden fields:
@if (!myForm.shippingAddress().hidden()) {
  <input [formField]="myForm.shippingAddress" />
}`,
      },
      {
        id: 'validation-reusable-schema',
        title: 'Reusable schema with schema() + apply()',
        description: 'Package validation rules alongside custom controls for reuse across multiple forms.',
        tags: ['schema()', 'apply()', 'reusable'],
        code: `import { schema, apply } from '@angular/forms/signals';
import { required, email, minLength } from '@angular/forms/signals';

// Define a reusable email field schema
export const emailFieldSchema = schema<string>((path) => {
  required(path,  { message: 'Email is required' });
  email(path,     { message: 'Enter a valid email address' });
});

// Define a reusable password schema
export const passwordSchema = schema<string>((path) => {
  required(path,    { message: 'Password is required' });
  minLength(path, 8, { message: 'At least 8 characters' });
});

// Consume in any form with apply():
readonly loginForm = form(this.loginModel, (s) => {
  apply(s.email,    emailFieldSchema);
  apply(s.password, passwordSchema);
  // Can still add more rules to the same field
});`,
      },
      {
        id: 'validation-cross-field',
        title: 'Cross-field validation with valueOf()',
        description: 'Read sibling field values inside any rule\'s when() predicate using valueOf(schemaPath.otherField).',
        tags: ['cross-field', 'valueOf()', 'conditional'],
        code: `form(model, (s) => {
  // Stop loss must be less than take profit
  // (using disabled to express dependency)
  disabled(s.stopLossPercent, {
    when: ({ valueOf }) =>
      valueOf(s.orderType) === 'MARKET',
  });

  // Price required only for LIMIT/STOP
  hidden(s.limitPrice, {
    when: ({ valueOf }) =>
      valueOf(s.orderType) === 'MARKET',
  });
  required(s.limitPrice, { message: 'Price required for LIMIT/STOP' });
});

// The value() signal inside when() is reactive —
// the rule re-evaluates whenever the referenced field changes.`,
      },
    ],
  },
  {
    id: 'custom-controls',
    title: 'Custom Form Controls',
    icon: '⬦',
    accent: '#f97316',
    snippets: [
      {
        id: 'custom-value-control',
        title: 'Minimal FormValueControl<T>',
        description: 'Any component implementing FormValueControl<T> with a value model() signal works with [formField]. FormField auto-detects the interface.',
        tags: ['FormValueControl', 'custom', 'model()'],
        code: `import { Component, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

@Component({
  selector: 'app-star-rating',
  template: \`
    @for (star of [1,2,3,4,5]; track star) {
      <button type="button" (click)="value.set(star)">
        {{ value() >= star ? '★' : '☆' }}
      </button>
    }
  \`,
})
export class StarRating implements FormValueControl<number> {
  // Required: model() signal for two-way binding
  readonly value = model<number>(0);
}

// Usage — just like a native input:
// <app-star-rating [formField]="myForm.rating" />`,
      },
      {
        id: 'custom-checkbox-control',
        title: 'FormCheckboxControl for toggle/switch',
        description: 'Use FormCheckboxControl when your control represents a boolean on/off state. Must use checked (not value).',
        tags: ['FormCheckboxControl', 'boolean', 'toggle'],
        code: `import { Component, model } from '@angular/core';
import { FormCheckboxControl } from '@angular/forms/signals';

@Component({
  selector: 'app-toggle-switch',
  template: \`
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      (click)="checked.update(v => !v)"
    >
      <span [class.on]="checked()"></span>
    </button>
  \`,
})
export class ToggleSwitch implements FormCheckboxControl {
  // Required: checked model() for boolean binding
  readonly checked = model<boolean>(false);
  // IMPORTANT: must NOT have a 'value' property
}

// Usage:
// <app-toggle-switch [formField]="myForm.isEnabled" />`,
      },
      {
        id: 'custom-stateful',
        title: 'Stateful custom control with all optional inputs',
        description: 'Add optional input signals to receive form state (disabled, invalid, errors, touched). FormField automatically wires these.',
        tags: ['stateful', 'inputs', 'errors', 'disabled'],
        code: `import { Component, input, model, output } from '@angular/core';
import {
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
  DisabledReason,
} from '@angular/forms/signals';

@Component({ selector: 'app-custom-input', template: \`...\` })
export class CustomInput implements FormValueControl<string> {
  // ── Required ──────────────────────────────────────────────
  readonly value = model<string>('');

  // ── Interaction ───────────────────────────────────────────
  // touch: emit on blur so debounce('blur') works
  readonly touch = output<void>();
  // touched: read-only reflection of field touched state
  readonly touched = input<boolean>(false);

  // ── Availability ──────────────────────────────────────────
  readonly disabled       = input<boolean>(false);
  readonly disabledReasons = input<readonly DisabledReason[]>([]);
  readonly readonly       = input<boolean>(false);
  readonly hidden         = input<boolean>(false);

  // ── Validation ────────────────────────────────────────────
  readonly invalid = input<boolean>(false);
  readonly errors  = input<readonly WithOptionalFieldTree<ValidationError>[]>([]);

  // ── Constraints (from schema validators) ─────────────────
  readonly required  = input<boolean>(false);
  readonly minLength = input<number | undefined>(undefined);
  readonly maxLength = input<number | undefined>(undefined);
}`,
      },
      {
        id: 'custom-drag-control',
        title: 'Drag-based SVG control (RiskDial pattern)',
        description: 'Pattern for a pointer-event drag control on SVG. Uses setPointerCapture for smooth dragging outside the element.',
        tags: ['SVG', 'drag', 'pointer events', 'model()'],
        code: `@Component({ selector: 'app-dial', template: \`
  <svg #dialSvg
    (pointerdown)="onDown($event)"
    (pointermove)="onMove($event)"
    (pointerup)="onUp($event)"
    (pointercancel)="onUp($event)"
  >
    <!-- background + value arc + thumb -->
  </svg>
\`})
export class Dial implements FormValueControl<number> {
  readonly value = model<number>(0);
  readonly touch = output<void>();
  private readonly svgEl = viewChild<ElementRef<SVGSVGElement>>('dialSvg');
  isDragging = false;

  onDown(e: PointerEvent): void {
    this.isDragging = true;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    this.update(e);
  }

  onMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    this.update(e);
  }

  onUp(e: PointerEvent): void {
    this.isDragging = false;
    (e.currentTarget as SVGSVGElement).releasePointerCapture(e.pointerId);
    this.touch.emit();  // triggers touched() state
  }

  private update(e: PointerEvent): void {
    const rect = this.svgEl()!.nativeElement.getBoundingClientRect();
    const angle = Math.atan2(
      e.clientY - rect.top - rect.height / 2,
      e.clientX - rect.left - rect.width / 2,
    ) * (180 / Math.PI);
    // convert angle → value and set
    this.value.set(this.angleToValue(angle));
  }
}`,
      },
    ],
  },
  {
    id: 'patterns',
    title: 'Architecture Patterns',
    icon: '⬟',
    accent: '#a78bfa',
    snippets: [
      {
        id: 'pattern-master-form',
        title: 'Master form coordinating child form saves',
        description: 'Pattern for a master form (Form A) that triggers saves on independent child forms (B, C) before saving itself, using a coordinator service.',
        tags: ['coordination', 'multi-form', 'service'],
        code: `// ── Coordinator Service ──────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FormCoordinatorService {
  readonly entityAId = signal('');
  readonly entityBId = signal('');

  private saveBFn: (() => Promise<string>) | null = null;
  private saveCFn: (() => Promise<string>) | null = null;

  registerSaveB(fn: (() => Promise<string>) | null) { this.saveBFn = fn; }
  registerSaveC(fn: (() => Promise<string>) | null) { this.saveCFn = fn; }

  async saveB(): Promise<string> {
    const id = await this.saveBFn!();
    this.entityAId.set(id);
    return id;
  }

  async saveC(): Promise<string> {
    const id = await this.saveCFn!();
    this.entityBId.set(id);
    return id;
  }
}

// ── Child Form (B) ────────────────────────────────────────────
export class FormBComponent implements OnInit {
  private readonly coordinator = inject(FormCoordinatorService);
  private readonly destroyRef   = inject(DestroyRef);

  ngOnInit(): void {
    this.coordinator.registerSaveB(() => this.triggerSave());
    this.destroyRef.onDestroy(() => this.coordinator.registerSaveB(null));
  }

  async triggerSave(): Promise<string> {
    // Reuse saved ID if form is unmodified
    const existing = this.coordinator.entityAId();
    if (existing && !this.myForm().dirty()) return existing;

    this.myForm().markAsTouched();
    if (this.myForm().invalid()) throw new Error('Form B invalid');

    const id = await this.api.save(this.myModel());
    this.myForm().reset({ ...this.myModel() });
    return id;
  }
}

// ── Master Form (A) ───────────────────────────────────────────
export class FormAComponent {
  async onSaveAll(): Promise<void> {
    this.masterForm().markAsTouched();
    if (this.masterForm().invalid()) return;

    const [bId, cId] = await Promise.all([
      this.coordinator.saveB(),
      this.coordinator.saveC(),
    ]);

    this.masterModel.update(m => ({ ...m, bId, cId }));
    await this.api.saveOrder(this.masterModel());
    this.masterForm().reset({ ...this.masterModel() });
  }
}`,
      },
      {
        id: 'pattern-effect-log',
        title: 'Log form state changes with effect()',
        description: 'Use effect() to react to form state changes for logging, analytics, or cross-form sync.',
        tags: ['effect()', 'logging', 'reactive'],
        code: `import { Component, effect, inject } from '@angular/core';
import { ActivityLogService } from './services/activity-log.service';

export class MyFormComponent {
  private readonly log = inject(ActivityLogService);

  readonly myForm = form(this.myModel, schemaFn);

  constructor() {
    // Log when form becomes dirty
    effect(() => {
      if (this.myForm().dirty()) {
        this.log.info('Form has unsaved changes');
      }
    });

    // Log validation state changes
    effect(() => {
      const state = this.myForm().invalid() ? 'INVALID' : 'VALID';
      this.log.debug(\`Form is \${state}\`);
    });
  }
}`,
      },
      {
        id: 'pattern-computed-state',
        title: 'Derived state with computed()',
        description: 'Use computed() for values derived from field signals — Angular automatically re-computes when dependencies change.',
        tags: ['computed()', 'derived', 'reactive'],
        code: `export class TradeFormComponent {
  readonly tradeForm = form(this.tradeModel, schemaFn);

  // Risk:Reward ratio — updates as user adjusts dials
  readonly rrRatio = computed(() => {
    const sl = this.tradeForm.stopLoss().value();
    const tp = this.tradeForm.takeProfit().value();
    return sl > 0 ? (tp / sl).toFixed(2) : '—';
  });

  // Password strength indicator
  readonly strength = computed(() => {
    const pw = this.tradeForm.password().value();
    if (pw.length < 8)  return 'weak';
    if (pw.length < 12) return 'medium';
    return 'strong';
  });

  // Can save only when form is dirty AND valid
  readonly canSave = computed(
    () => this.tradeForm().dirty() && this.tradeForm().valid(),
  );
}`,
      },
      {
        id: 'pattern-form-array',
        title: 'Array fields with @for tracking',
        description: 'For array-type fields, always track by field identity (not index) to prevent Angular from reusing stateful input elements.',
        tags: ['arrays', '@for', 'tracking', 'identity'],
        code: `// Model with array
interface WatchlistData { symbols: string[] }

readonly watchlistModel = signal<WatchlistData>({
  symbols: ['AAPL', 'MSFT', 'NVDA'],
});
readonly watchlistForm = form(this.watchlistModel);

// Template — track by FIELD IDENTITY, not index!
// The form system maintains stable field references.
@for (field of watchlistForm.symbols; track field) {
  <input [formField]="field" />
}

// ❌ DON'T track by $index — causes input reuse bugs:
// @for (field of watchlistForm.symbols; track $index)

// Add / remove items via the model signal:
addSymbol(): void {
  this.watchlistModel.update(m => ({
    ...m,
    symbols: [...m.symbols, ''],
  }));
}`,
      },
    ],
  },
];

@Component({
  selector: 'app-skills-page',
  templateUrl: './skills-page.html',
  styleUrls: ['./skills-page.css'],
})
export class SkillsPageComponent {
  readonly sections = SKILL_SECTIONS;

  readonly activeSection = signal<string>(SKILL_SECTIONS[0].id);
  readonly searchQuery = signal<string>('');
  readonly copiedId = signal<string>('');

  readonly activeData = computed(() =>
    this.sections.find(s => s.id === this.activeSection()) ?? this.sections[0],
  );

  readonly filteredSnippets = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const section = this.activeData();
    if (!query) return section.snippets;
    return section.snippets.filter(
      s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.tags.some(t => t.toLowerCase().includes(query)),
    );
  });

  readonly totalSnippets = computed(() =>
    this.sections.reduce((acc, s) => acc + s.snippets.length, 0),
  );

  setSection(id: string): void {
    this.activeSection.set(id);
    this.searchQuery.set('');
  }

  async copyToClipboard(snippet: SkillSnippet): Promise<void> {
    try {
      await navigator.clipboard.writeText(snippet.code);
      this.copiedId.set(snippet.id);
      setTimeout(() => {
        if (this.copiedId() === snippet.id) this.copiedId.set('');
      }, 2000);
    } catch {
      // Fallback for insecure contexts
      const el = document.createElement('textarea');
      el.value = snippet.code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.copiedId.set(snippet.id);
      setTimeout(() => this.copiedId.set(''), 2000);
    }
  }

  sectionAccent(sectionId: string): string {
    return this.sections.find(s => s.id === sectionId)?.accent ?? '#06b6d4';
  }
}
