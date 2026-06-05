import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { JobsStore } from '../jobs/jobs.store';
import { Job } from '../jobs/types';

@Component({
  selector: 'app-applications-page',
  imports: [
    AsyncPipe,
    DatePipe,
    NgClass,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss'
})
export class ApplicationsPageComponent {
  readonly jobsStore = inject(JobsStore);

  readonly vm$ = this.jobsStore.jobs$.pipe(
    map((jobs) => {
      const appliedJobs = jobs
        .filter((job) => job.aplicado)
        .sort((a, b) => dateValue(b.aplicado_at) - dateValue(a.aplicado_at));

      const averageScore = appliedJobs.length
        ? Math.round(
            appliedJobs.reduce((total, job) => total + (job.match_score ?? 0), 0) /
              appliedJobs.length
          )
        : 0;

      return {
        appliedJobs,
        totalApplications: appliedJobs.length,
        averageScore,
        lastApplicationDate: appliedJobs[0]?.aplicado_at ?? ''
      };
    })
  );

  constructor() {
    this.jobsStore.ensureLoaded();
  }

  openOffer(job: Job) {
    if (job.link) window.open(job.link, '_blank', 'noopener');
  }
}

function dateValue(value?: string) {
  return value ? new Date(value).getTime() || 0 : 0;
}
