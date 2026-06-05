import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { CandidateProfile, ProfileStore } from './profile.store';

@Component({
  selector: 'app-profile-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss'
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  readonly profileStore = inject(ProfileStore);

  readonly form = this.fb.nonNullable.group({
    fullName: this.profileStore.snapshot().fullName,
    email: this.profileStore.snapshot().email,
    phone: this.profileStore.snapshot().phone,
    location: this.profileStore.snapshot().location,
    linkedin: this.profileStore.snapshot().linkedin,
    portfolio: this.profileStore.snapshot().portfolio,
    summary: this.profileStore.snapshot().summary,
    targetRoles: this.profileStore.snapshot().targetRoles,
    skills: this.profileStore.snapshot().skills,
    experience: this.profileStore.snapshot().experience,
    education: this.profileStore.snapshot().education,
    languages: this.profileStore.snapshot().languages,
    cvFileName: this.profileStore.snapshot().cvFileName,
    cvText: this.profileStore.snapshot().cvText
  });

  save() {
    this.profileStore.save(this.form.getRawValue() as CandidateProfile);
    this.snackBar.open('Perfil guardado para generar postulaciones IA', 'Cerrar', {
      duration: 2800
    });
  }

  clear() {
    this.profileStore.clear();
    this.form.reset(this.profileStore.snapshot());
    this.snackBar.open('Perfil limpiado', 'Cerrar', { duration: 2200 });
  }

  onCvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.form.controls.cvFileName.setValue(file.name);

    const lowerName = file.name.toLowerCase();
    const canReadAsText =
      file.type.startsWith('text/') ||
      lowerName.endsWith('.txt') ||
      lowerName.endsWith('.md') ||
      lowerName.endsWith('.csv');

    if (!canReadAsText) {
      this.snackBar.open(
        'CV adjuntado. Para PDF/DOCX pega el texto del CV en el campo inferior.',
        'Cerrar',
        { duration: 4500 }
      );
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.controls.cvText.setValue(String(reader.result ?? ''));
      this.snackBar.open('CV cargado como texto editable', 'Cerrar', { duration: 3000 });
    };
    reader.onerror = () => {
      this.snackBar.open('No se pudo leer el archivo CV', 'Cerrar', { duration: 3000 });
    };
    reader.readAsText(file);
    input.value = '';
  }
}
