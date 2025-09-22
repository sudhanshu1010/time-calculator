import { Component } from '@angular/core';
import { TimeInputComponent } from './Components/timeinput/timeinput.component';
import { AuthComponent } from './auth/auth.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    TimeInputComponent, 
    AuthComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'time-calculator-app';
}
