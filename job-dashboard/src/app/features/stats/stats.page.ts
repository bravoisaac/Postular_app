import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { BaseChartDirective } from 'ng2-charts';

import { JobsStore } from '../jobs/jobs.store';

@Component({
  selector: 'app-stats-page',
  imports: [AsyncPipe, MatCardModule, BaseChartDirective],
  templateUrl: './stats.page.html',
  styleUrl: './stats.page.scss'
})
export class StatsPageComponent {
  readonly vm$ = inject(JobsStore).vm$;
}
