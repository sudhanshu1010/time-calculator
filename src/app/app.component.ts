import { Component } from '@angular/core';
import { TimeInputComponent } from './Components/timeinput/timeinput.component';

@Component({
  selector: 'app-root',
  imports: [TimeInputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'time-calculator-app';
}
