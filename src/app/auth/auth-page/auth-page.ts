import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  authForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);

  constructor(private fb: FormBuilder, private router: Router) {
    this.authForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required],
      agreement: [false, Validators.requiredTrue]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  isFormValid() {
    return this.authForm.valid;
  }

  onSubmit() {
    if (this.authForm.valid) {
      this.isLoading.set(true);
      this.router.navigate(['/home']);
    }
  }
}
