import { Component } from '@angular/core';
import { TimeInputComponent } from './Components/timeinput/timeinput.component';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './Components/timeinput/loading.component';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    TimeInputComponent,
    CommonModule,
    RouterOutlet,
    LoadingComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  constructor(public loadingService: LoadingService) {}
  title = 'time-calculator-app';
}