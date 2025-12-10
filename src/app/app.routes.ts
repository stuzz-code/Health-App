import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/stats', pathMatch: 'full' },
  {
    path: 'stats',
    loadComponent: () =>
      import('./stats/stat-entry/stat-entry.component').then((m) => m.StatEntryComponent),
  },
  {
    path: 'goals',
    loadComponent: () => import('./goals/goals.component').then((m) => m.GoalsComponent),
  },
];
