import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { lastValueFrom } from 'rxjs';

import { JobService } from '../job.service';
import { CreateJobRequest } from '../types';
import { DiscoveredJob } from '../types';
import { PERSONAL_ROLES } from '../personal/roles';

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
    MatSlideToggleModule,
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
  readonly personalRoles = PERSONAL_ROLES;

  readonly form = this.fb.group({
    query: this.fb.control('', { nonNullable: true }),
    location: this.fb.control('', { nonNullable: true }),
    technologies: this.fb.control<string[]>([], { nonNullable: true }),
    roles: this.fb.control<string[]>([], { nonNullable: true }),
    remoteOnly: this.fb.control(false, { nonNullable: true }),
    noExperience: this.fb.control(false, { nonNullable: true }),
    limit: this.fb.control(10, { nonNullable: true })
  });

  fillQueryFromRoles() {
    const q = buildDiscoverQuery({
      query: '',
      roles: this.form.controls.roles.value,
      remoteOnly: this.form.controls.remoteOnly.value,
      noExperience: this.form.controls.noExperience.value
    });
    this.form.controls.query.setValue(q);
  }

  discover() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();
    const query = buildDiscoverQuery({
      query: raw.query,
      roles: raw.roles,
      remoteOnly: raw.remoteOnly,
      noExperience: raw.noExperience
    });

    if (!query.trim()) {
      this.loading.set(false);
      this.snackBar.open('Escribe una búsqueda o selecciona cargos', 'Cerrar', { duration: 3500 });
      return;
    }

    const location =
      raw.location?.trim() || (raw.remoteOnly ? 'Remoto' : '');

    this.jobService
      .discoverJobs({
        query,
        location,
        technologies: raw.technologies,
        limit: raw.limit
      })
      .subscribe({
      next: (res) => {
        this.results.set(dedupeByLink(res.jobs ?? []));
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
    const jobs = dedupeByLink(this.results());
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

function buildDiscoverQuery(input: {
  query: string;
  roles: string[];
  remoteOnly: boolean;
  noExperience: boolean;
}) {
  const base = String(input.query ?? '').trim();
  const roles = Array.isArray(input.roles) ? input.roles.filter(Boolean) : [];

  const rolePart = roles.length
    ? `(${roles.map((r) => `"${r}"`).join(' OR ')})`
    : '';

  let q = base || rolePart || 'Junior developer';
  if (base && rolePart) q = `${q} ${rolePart}`;

  if (input.remoteOnly) q += ' remoto remote';
  if (input.noExperience) q += ' sin experiencia trainee entry level';

  return q.trim();
}

function normalizeLink(link: string) {
  const raw = String(link ?? '').trim();
  if (!raw) return '';
  try {
    const u = new URL(raw);
    u.hash = '';
    const tracking = new Set([
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'ref',
      'source'
    ]);
    for (const key of [...u.searchParams.keys()]) {
      if (tracking.has(key.toLowerCase())) u.searchParams.delete(key);
    }
    u.hostname = u.hostname.toLowerCase();
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

function dedupeByLink(jobs: DiscoveredJob[]) {
  const seen = new Set<string>();
  const out: DiscoveredJob[] = [];
  for (const j of jobs) {
    const norm = normalizeLink(j?.link ?? '');
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(j);
  }
  return out;
}
