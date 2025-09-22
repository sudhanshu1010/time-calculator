import { Component, OnInit } from '@angular/core';
import { supabase } from '../../supabaseClient'; // supabase client
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


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
  currentDayIndex = new Date().getDay() - 1; // Monday=0 … Friday=4

    constructor(private router: Router) {}
  

  private readonly DEFAULT_IN = '11:15';
  private readonly DEFAULT_OUT = '20:30';

  async ngOnInit() {
    await this.loadEntries();
  }

  /** Load entries from DB or defaults */
  private async loadEntries() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please login or signup first!");
      this.router.navigate(['/']);
      return;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching entries:', error.message);
      return;
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    this.workWeek = days.map(d => {
      const found = data?.find(entry => entry.day === d);
      return found
        ? { ...found }
        : { day: d, check_in: this.DEFAULT_IN, check_out: this.DEFAULT_OUT, total_minutes: 0 };
    });
  }


  /** Save or update entry */
  async saveEntry(day: WorkDay) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate minutes difference
    const [inH, inM] = day.check_in.split(':').map(Number);
    const [outH, outM] = day.check_out.split(':').map(Number);
    const checkInMinutes = inH * 60 + inM;
    const checkOutMinutes = outH * 60 + outM;

    const REF_IN = 11 * 60 + 15;   // 11:15 AM
    const REF_OUT = 20 * 60 + 30;  // 8:30 PM

    let penalty = checkInMinutes > REF_IN ? -(checkInMinutes - REF_IN) : 0;
    let bonus = checkOutMinutes > REF_OUT ? (checkOutMinutes - REF_OUT) : 0;

    day.total_minutes = penalty + bonus;

    if (day.id) {
      // Update existing entry
      const { error } = await supabase
        .from('time_entries')
        .update({
          check_in: day.check_in,
          check_out: day.check_out,
          total_minutes: day.total_minutes,
        })
        .eq('id', day.id);

      if (error) console.error('Update failed:', error.message);
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

      if (!error && data) {
        day.id = data.id; // assign id for future updates
      } else if (error) {
        console.error('Insert failed:', error.message);
      }
    }
  }

  /** Weekly total */
  get weeklyTotal(): number {
    return this.workWeek.reduce((sum, d) => sum + d.total_minutes, 0);
  }

  clearEntry(day: WorkDay) {
    day.check_in = this.DEFAULT_IN;
    day.check_out = this.DEFAULT_OUT;
    this.saveEntry(day);
  }
}