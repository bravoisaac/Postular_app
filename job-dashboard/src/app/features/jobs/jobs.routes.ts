import { Routes } from '@angular/router';
import { ApplyGeneratorPageComponent } from './pages/apply-generator.page';
import { JobDetailPageComponent } from './pages/job-detail.page';
import { JobsListPageComponent } from './pages/jobs-list.page';

export const JOBS_ROUTES: Routes = [
  { path: '', component: JobsListPageComponent },
  { path: ':id', component: JobDetailPageComponent },
  { path: ':id/generate', component: ApplyGeneratorPageComponent }
];
