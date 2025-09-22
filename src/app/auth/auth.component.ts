import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent {
  email = '';
  password = '';
  isLoginMode = true;
  message = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    try {
      if (this.isLoginMode) {
        const { error } = await this.supabase.signIn(this.email, this.password);
        if (error) throw error;
        this.message = 'Login successful!';
        this.router.navigate(['/dashboard']);
      } else {
        const { error } = await this.supabase.signUp(this.email, this.password);
        if (error) throw error;
        this.message = 'Signup successful! Please check your email to confirm.';
      }
    } catch (err: any) {
      this.message = err.message;
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.message = '';
  }
}
