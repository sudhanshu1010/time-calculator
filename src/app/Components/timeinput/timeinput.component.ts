import { Component, OnInit } from '@angular/core';
import { supabase } from '../../supabaseClient';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LoadingService } from '../../services/loading.service';

interface WorkDay {
  id?: number;
  day: string;
  check_in: string;
  check_out: string;
  total_minutes: number;
}

@Component({
  selector: 'app-timeinput',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timeinput.component.html',
  styleUrls: ['./timeinput.component.css'],
})

export class TimeInputComponent implements OnInit {
  workWeek: WorkDay[] = [];
  currentDayIndex = new Date().getDay() - 1;
  userName: string = '';
  loading = true;
  message = '';

  constructor(
    private router: Router,
    private titleService: Title,
    private loadingService: LoadingService
  ) { }

  private readonly DEFAULT_IN = '11:15';
  private readonly DEFAULT_OUT = '20:30';

  async ngOnInit() {
    this.loadingService.show();
    try {
      await this.loadUserInfo();
      await this.loadEntries();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      this.loading = false;
      this.loadingService.hide();
    }
  }

  private async loadUserInfo() {
    this.loadingService.show();
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        alert("Please login or signup first!");
        this.router.navigate(['/']);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user info:', error);
        this.userName = 'User';
        return;
      }

      if (data) {
        this.userName = `${data.first_name}`;
      } else {
        console.warn('No user profile found, using default name');
        this.userName = 'User';
      }

      this.titleService.setTitle(`Time Calculator | ${this.userName}`);
    } finally {
      this.loadingService.hide(); // Hide loading after user info load
    }
  }

  /** Load entries from DB or defaults */
  private async loadEntries() {
    this.loadingService.show();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login or signup first!");
        this.router.navigate(['/']);
        return;
      }

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('day');

      if (error) {
        console.error('Error fetching entries:', error);
        this.message = 'Error loading time entries.';
      }

      this.message = '';

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      this.workWeek = days.map(day => {
        const found = data?.find(entry => entry.day === day);

        if (found) {
          return {
            ...found,
            check_in: found.check_in || this.DEFAULT_IN,
            check_out: found.check_out || this.DEFAULT_OUT,
            total_minutes: found.total_minutes || 0
          };
        }

        return {
          day,
          check_in: this.DEFAULT_IN,
          check_out: this.DEFAULT_OUT,
          total_minutes: 0
        };
      });
    } finally {
      this.loadingService.hide(); // Hide loading after entries load
    }
  }

  /** Save or update entry - FIXED VERSION */
  async saveEntry(day: WorkDay) {
    if (!day.check_in || !day.check_out) {
      console.error('Invalid time values');
      return;
    }

    this.loadingService.show();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Session expired. Please login again.");
        this.router.navigate(['/']);
        return;
      }

      try {
        // Calculate minutes difference
        const [inH, inM] = day.check_in.split(':').map(Number);
        const [outH, outM] = day.check_out.split(':').map(Number);

        if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
          console.error('Invalid time format');
          return;
        }

        const checkInMinutes = inH * 60 + inM;
        const checkOutMinutes = outH * 60 + outM;

        const REF_IN = 11 * 60 + 15;
        const REF_OUT = 20 * 60 + 30;

        let penalty = checkInMinutes > REF_IN ? -(checkInMinutes - REF_IN) : 0;
        let bonus = checkOutMinutes > REF_OUT ? (checkOutMinutes - REF_OUT) : 0;

        day.total_minutes = penalty + bonus;

        if (day.id) {
          // Update existing entry - without updated_at
          const { error } = await supabase
            .from('time_entries')
            .update({
              check_in: day.check_in,
              check_out: day.check_out,
              total_minutes: day.total_minutes
            })
            .eq('id', day.id);

          if (error) throw error;

        } else {
          // Insert new entry
          const { data, error } = await supabase
            .from('time_entries')
            .insert([{
              user_id: user.id,
              day: day.day,
              check_in: day.check_in,
              check_out: day.check_out,
              total_minutes: day.total_minutes,
            }])
            .select()
            .single();

          if (error) throw error;

          if (data) {
            day.id = data.id;
            this.message = `${day.day} entry saved successfully!`;
          }
        }

        // Clear message after 3 seconds
        setTimeout(() => {
          this.message = '';
        }, 3000);
      } catch (error: any) {
        console.error('Save failed:', error.message);
        this.message = `Error saving entry: ${error.message}`;
        alert('Error saving entry: ' + error.message);
      }
    } finally {
      this.loadingService.hide(); // Hide loading after save operation
    }
  }

  /** Weekly total */
  get weeklyTotal(): number {
    return this.workWeek.reduce((sum, d) => sum + d.total_minutes, 0);
  }

  /** Format minutes to hours and minutes */
  formatMinutes(minutes: number): string {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${hours}h ${mins}m`;
  }

  async clearEntry(day: WorkDay) {
    day.check_in = this.DEFAULT_IN;
    day.check_out = this.DEFAULT_OUT;
    day.total_minutes = 0;
    await this.saveEntry(day);
  }

  // Helper to check if current day
  isCurrentDay(dayIndex: number): boolean {
    return dayIndex === this.currentDayIndex;
  }
}