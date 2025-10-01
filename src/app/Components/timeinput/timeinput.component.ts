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
  hasChanges?: boolean;
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

  private calculateTotalMinutes(checkIn: string, checkOut: string): number {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);

    const checkInMinutes = inH * 60 + inM;
    const checkOutMinutes = outH * 60 + outM;

    const REF_IN = 11 * 60 + 15;   // 11:15 AM
    const REF_OUT = 20 * 60 + 30;  // 8:30 PM

    // Early check-in: positive minutes for arriving before 11:15
    const earlyBonus = Math.max(0, REF_IN - checkInMinutes);
    
    // Late check-in: negative minutes for arriving after 11:15
    const latePenalty = Math.min(0, REF_IN - checkInMinutes);
    
    // Overtime: positive minutes for staying after 8:30
    const overtimeBonus = Math.max(0, checkOutMinutes - REF_OUT);
    
    // Early leave: negative minutes for leaving before 8:30
    const earlyLeavePenalty = Math.min(0, checkOutMinutes - REF_OUT);

    return earlyBonus + overtimeBonus + latePenalty + earlyLeavePenalty;
  }

  /** Recalculate total minutes when time inputs change */
  onTimeChange(day: WorkDay) {
    if (day.check_in && day.check_out) {
      day.total_minutes = this.calculateTotalMinutes(day.check_in, day.check_out);
      day.hasChanges = true; // Mark as having unsaved changes
    }
  }

  /** Save all entries that have changes */
  async saveAllEntries() {
    this.loadingService.show();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Session expired. Please login again.");
        this.router.navigate(['/']);
        return;
      }

      let savedCount = 0;
      let errorCount = 0;

      // Save each day that has changes
      for (const day of this.workWeek) {
        if (day.hasChanges && day.check_in && day.check_out) {
          try {
            if (day.id) {
              // Update existing entry
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
              }
            }
            
            day.hasChanges = false; // Mark as saved
            savedCount++;
            
          } catch (error) {
            console.error(`Error saving ${day.day}:`, error);
            errorCount++;
          }
        }
      }

      if (savedCount > 0 && errorCount === 0) {
        this.message = `Successfully saved ${savedCount} day${savedCount > 1 ? 's' : ''}!`;
      } else if (savedCount > 0 && errorCount > 0) {
        this.message = `Saved ${savedCount} day${savedCount > 1 ? 's' : ''}, ${errorCount} error${errorCount > 1 ? 's' : ''}`;
      } else if (savedCount === 0 && errorCount === 0) {
        this.message = 'No changes to save.';
      } else {
        this.message = `Error saving ${errorCount} day${errorCount > 1 ? 's' : ''}`;
      }

      // Clear message after 3 seconds
      setTimeout(() => {
        this.message = '';
      }, 3000);

    } catch (error: any) {
      console.error('Save all failed:', error.message);
      this.message = `Error saving entries: ${error.message}`;
    } finally {
      this.loadingService.hide();
    }
  }

  /** Clear individual entry */
  async clearEntry(day: WorkDay) {
    day.check_in = this.DEFAULT_IN;
    day.check_out = this.DEFAULT_OUT;
    day.total_minutes = 0;
    day.hasChanges = true; // Mark as having changes to save
    
    // Optional: Auto-save after clear, or let user click "Save All"
    // await this.saveEntry(day); // Uncomment if you want auto-save on clear
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

  // Helper to check if current day
  isCurrentDay(dayIndex: number): boolean {
    return dayIndex === this.currentDayIndex;
  }
}