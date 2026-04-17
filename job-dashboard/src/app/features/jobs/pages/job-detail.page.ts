import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';

import { Job } from '../types';
import { JobsStore } from '../jobs.store';

@Component({
  selector: 'app-job-detail-page',
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './job-detail.page.html',
  styleUrl: './job-detail.page.scss'
})
export class JobDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly jobsStore = inject(JobsStore);

  readonly vm$ = combineLatest([
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    this.jobsStore.jobs$
  ]).pipe(map(([id, jobs]) => ({ id, job: jobs.find((j) => j.id === id) })));

  constructor() {
    this.jobsStore.ensureLoaded();
  }

  openOffer(job: Job) {
    if (job.link) window.open(job.link, '_blank', 'noopener');
  }
}
