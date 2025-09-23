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
  firstName = '';
  lastName = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async onSubmit() {
    try {
      if (this.isLoginMode) {
        // LOGIN
        const { data, error } = await this.supabase.signIn(this.email, this.password);
        if (error) throw error;

        this.message = 'Login successful!';
        this.router.navigate(['/dashboard']);
      } else {
        // SIGNUP - Use signUp with options to include user metadata
        const { data, error } = await this.supabase.signUpWithProfile(
          this.email, 
          this.password, 
          this.firstName, 
          this.lastName
        );
        
        if (error) throw error;

        this.message = 'Signup successful! Please check your email to confirm.';
        
        // Optional: Auto-login after signup
        if (data?.user) {
          this.router.navigate(['/dashboard']);
        }
      }
    } catch (err: any) {
      this.message = err.message;
      console.error('Auth error:', err);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.message = '';
  }
}