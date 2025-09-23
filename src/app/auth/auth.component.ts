import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../supabase.service';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})

export class AuthComponent implements OnInit {
  email = '';
  password = '';
  isLoginMode = true;
  message = '';
  firstName = '';
  lastName = '';

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private titleService: Title,
    private loadingService: LoadingService
  ) { }

  ngOnInit() {
    this.updateTitle();
  }

  private updateTitle() {
    const mode = this.isLoginMode ? 'Login' : 'Sign Up';
    this.titleService.setTitle(`Time Calculator | ${mode}`);
  }

  async onSubmit() {
    // Show loading animation
    this.loadingService.show();

    try {
      if (this.isLoginMode) {
        // LOGIN
        const { data, error } = await this.supabase.signIn(this.email, this.password);
        if (error) throw error;

        this.message = 'Login successful! Redirecting...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      } else {
        // SIGNUP - Use signUp with options to include user metadata
        const { data, error } = await this.supabase.signUpWithProfile(
          this.email,
          this.password,
          this.firstName,
          this.lastName
        );

        if (error) throw error;

        this.message = 'Signup successful! Please check your email to confirm your account.';

        // Optional: Auto-switch to login mode after signup
        setTimeout(() => {
          this.isLoginMode = true;
          this.updateTitle();
          this.message = 'Please login with your confirmed account.';
        }, 5000);
      }
    } catch (err: any) {
      this.message = err.message;
      console.error('Auth error:', err);
    } finally {
      // Hide loading animation whether success or error
      this.loadingService.hide();
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.message = '';
    this.updateTitle();
  }
}