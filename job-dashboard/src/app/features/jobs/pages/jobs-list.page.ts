import { AsyncPipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { JobsStore } from '../jobs.store';
import { DiscoverJobsDialogComponent } from '../components/discover-jobs.dialog';

@Component({
  selector: 'app-jobs-list-page',
  imports: [
    AsyncPipe,
    NgClass,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './jobs-list.page.html',
  styleUrl: './jobs-list.page.scss'
})
export class JobsListPageComponent {
  readonly jobsStore = inject(JobsStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly vm$ = this.jobsStore.vm$;
  readonly skeleton = Array.from({ length: 6 }, (_, i) => i);
  constructor() {}

  apply(jobId: number) {
    this.jobsStore.applyToJob(jobId).subscribe({
      next: () => this.snackBar.open('Postulación marcada como enviada', 'Cerrar', { duration: 2500 })
    });
  }

  discoverWithAi() {
    const ref = this.dialog.open(DiscoverJobsDialogComponent, {
      autoFocus: false
    });
    ref.afterClosed().subscribe((result) => {
      if (result?.imported) this.jobsStore.loadJobs();
    });
  }
}
