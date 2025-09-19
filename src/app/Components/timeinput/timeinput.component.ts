import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WorkDay {
  dayName: string;
  checkIn: string;
  checkOut: string;
  totalMinutes: number;
}

@Component({
  selector: 'app-timeinput',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timeinput.component.html',
  styleUrls: ['./timeinput.component.css']
})
export class TimeInputComponent {
  workWeek: WorkDay[] = [];
  currentDayIndex = new Date().getDay() - 1; // Monday=0 … Friday=4

  constructor() {
    const savedData = localStorage.getItem('workWeek');
    if (savedData) {
      this.workWeek = JSON.parse(savedData);
      this.calculateAll();
    } else {
      this.initWorkWeek();
      this.calculateAll();
    }
  }

  private initWorkWeek() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    this.workWeek = days.map(d => ({
      dayName: d,
      checkIn: '11:15',
      checkOut: '20:30',
      totalMinutes: 0
    }));
  }

  private calculateDayBalance(day: WorkDay): number {
    if (!day.checkIn || !day.checkOut) return 0;

    const [inHour, inMin] = day.checkIn.split(':').map(Number);
    const [outHour, outMin] = day.checkOut.split(':').map(Number);

    if ([inHour, inMin, outHour, outMin].some(isNaN)) return 0;

    const REF_IN = 11 * 60 + 15;   // 11:15 AM
    const REF_OUT = 20 * 60 + 30;  // 8:30 PM

    let penalty = 0;
    if (inHour * 60 + inMin > REF_IN) {
      penalty = -(inHour * 60 + inMin - REF_IN);
    }

    let bonus = 0;
    if (outHour * 60 + outMin > REF_OUT) {
      bonus = (outHour * 60 + outMin - REF_OUT);
    }

    return penalty + bonus;
  }

  calculateAll(): void {
    this.workWeek.forEach(day => {
      day.totalMinutes = this.calculateDayBalance(day);
    });
    localStorage.setItem('workWeek', JSON.stringify(this.workWeek));
  }

  clearStorage() {
    localStorage.removeItem('workWeek');
    this.initWorkWeek();
    this.calculateAll();
  }

  get weeklyTotal(): number {
    return this.workWeek.reduce((sum, d) => sum + d.totalMinutes, 0);
  }
}
