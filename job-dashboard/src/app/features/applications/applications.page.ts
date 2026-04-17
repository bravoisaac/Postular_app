import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-applications-page',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss'
})
export class ApplicationsPageComponent {}
