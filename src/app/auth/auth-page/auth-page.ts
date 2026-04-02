import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss'
})
export class AuthPage {

  authForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.authForm = this.fb.group({
        login: ['', Validators.required],        
        password: ['', Validators.required],
        agreement: [false, Validators.requiredTrue] 
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  isFormValid(): boolean {
    return this.authForm.valid;
  }

  onSubmit(): void {
    if (!this.authForm.valid) return;

    this.isLoading.set(true);
    this.error = '';

    const { login, password } = this.authForm.value;

    // Заглушка — пока нет бэкенда любой логин/пароль работает
    const success = this.authService.login(login, password);

    if (success) {
      this.router.navigate(['/home']);
    } else {
      this.error = 'Неверный логин или пароль';
      this.isLoading.set(false);
    }
  }
}