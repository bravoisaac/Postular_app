import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom } from 'rxjs';

import { JobService } from '../job.service';
import { CreateJobRequest } from '../types';
import { DiscoveredJob } from '../types';

@Component({
  selector: 'app-discover-jobs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule
  ],
  templateUrl: './discover-jobs.dialog.html',
  styleUrl: './discover-jobs.dialog.scss'
})
export class DiscoverJobsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DiscoverJobsDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly jobService = inject(JobService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly results = signal<DiscoveredJob[]>([]);

  readonly form = this.fb.group({
    query: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    location: this.fb.control('', { nonNullable: true }),
    technologies: this.fb.control<string[]>([], { nonNullable: true }),
    limit: this.fb.control(10, { nonNullable: true })
  });

  discover() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.jobService.discoverJobs(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.results.set(res.jobs ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.snackBar.open((e as any)?.message ?? 'Error descubriendo trabajos', 'Cerrar', {
          duration: 4500
        });
      }
    });
  }

  async importAll() {
    const jobs = this.results();
    if (!jobs.length) return;

    this.loading.set(true);
    try {
      for (const j of jobs) {
        const payload: CreateJobRequest = {
          titulo: j.titulo,
          empresa: j.empresa,
          descripcion: j.descripcion ?? '',
          link: j.link,
          ubicacion: j.ubicacion ?? '',
          aplicado: false,
          match_score: j.match_score ?? 0,
          tecnologias: j.tecnologias ?? [],
          ia_razones: j.ia_razones ?? []
        };
        await lastValueFrom(this.jobService.createJob(payload));
      }
      this.snackBar.open('Trabajos importados', 'Cerrar', { duration: 2500 });
      this.dialogRef.close({ imported: true });
    } catch {
      this.snackBar.open('Error importando trabajos', 'Cerrar', { duration: 4500 });
      this.loading.set(false);
    }
  }

  close() {
    this.dialogRef.close({ imported: false });
  }
}
