import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface WorkDay {
  checkIn: string;
  checkOut: string;
  balance: number;
}

@Component({
  selector: 'app-time-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timeinput.component.html',
  styleUrl: './timeinput.component.css'
})

export class TimeCalculatorComponent implements OnInit {
  days: WorkDay[] = [];
  totalBalance: number = 0;

  ngOnInit(): void {
    const stored = localStorage.getItem('workDays');
    if (stored) {
      this.days = JSON.parse(stored);
      this.calculateAll();
    } else {
      // initialize 5 days with empty values
      this.days = Array.from({ length: 5 }, () => ({ checkIn: '', checkOut: '', balance: 0 }));
    }
  }

  calculateDay(day: WorkDay): number {
    if (!day.checkIn || !day.checkOut) return 0;

    const refIn = this.parseTime('11:15');
    const refOut = this.parseTime('20:30');

    const inTime = this.parseTime(day.checkIn);
    const outTime = this.parseTime(day.checkOut);

    let checkInPenalty = 0;
    if (inTime > refIn) {
      checkInPenalty = -(inTime - refIn) / 60000; // ms → minutes
    }

    let checkOutBonus = 0;
    if (outTime > refOut) {
      checkOutBonus = (outTime - refOut) / 60000;
    }

    return checkInPenalty + checkOutBonus;
  }

  calculateAll(): void {
    this.totalBalance = 0;
    this.days.forEach((day, index) => {
      day.balance = this.calculateDay(day);
      this.totalBalance += day.balance;
    });

    localStorage.setItem('workDays', JSON.stringify(this.days));
  }

  reset(): void {
    this.days = Array.from({ length: 5 }, () => ({ checkIn: '', checkOut: '', balance: 0 }));
    this.totalBalance = 0;
    localStorage.removeItem('workDays');
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  }
}
