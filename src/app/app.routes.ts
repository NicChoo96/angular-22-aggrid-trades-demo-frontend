import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'demo',
    pathMatch: 'full',
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./pages/demo/demo-page').then(m => m.DemoPageComponent),
  },
  {
    path: 'skills',
    loadComponent: () =>
      import('./pages/skills/skills-page').then(m => m.SkillsPageComponent),
  },
];
