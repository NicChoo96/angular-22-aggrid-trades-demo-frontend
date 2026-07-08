import { Component, inject } from '@angular/core';
import { FormAComponent } from '../../forms/form-a/form-a';
import { FormBComponent } from '../../forms/form-b/form-b';
import { FormCComponent } from '../../forms/form-c/form-c';
import { ActivityLogComponent } from '../../shared/activity-log/activity-log';

@Component({
  selector: 'app-demo-page',
  imports: [FormAComponent, FormBComponent, FormCComponent, ActivityLogComponent],
  template: `
    <div class="demo-page">
      <!-- Forms Grid: B (left) | A (centre) | C (right) -->
      <div class="forms-grid">
        <app-form-b />
        <app-form-a />
        <app-form-c />
      </div>

      <!-- Activity Log -->
      <app-activity-log />
    </div>
  `,
  styles: [`
    :host { display: block; }

    .demo-page {
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
      padding: 16px 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .forms-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
      align-items: start;
    }

    @media (max-width: 1100px) {
      .forms-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 720px) {
      .forms-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DemoPageComponent {}
