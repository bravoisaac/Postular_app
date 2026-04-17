import { Routes } from '@angular/router';

import { MainLayoutComponent } from './core/layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        path: 'jobs',
        loadChildren: () => import('./features/jobs/jobs.routes').then((m) => m.JOBS_ROUTES)
      },
      {
        path: 'applications',
        loadChildren: () =>
          import('./features/applications/applications.routes').then(
            (m) => m.APPLICATIONS_ROUTES
          )
      },
      {
        path: 'stats',
        loadChildren: () => import('./features/stats/stats.routes').then((m) => m.STATS_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
