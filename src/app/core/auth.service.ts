import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'emaket_token';

  // Пока нет бэкенда — данные пользователя хардкод
  // Когда будет API — заменить на декодирование JWT токена
  private readonly CURRENT_USER = {
    fullName: 'Adminov Admin',
    shortName: 'Adminov A.A.',
  };

  constructor(private router: Router) {}

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  login(username: string, password: string): boolean {
    if (username && password) {
      localStorage.setItem(this.TOKEN_KEY, 'mock-token');
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  // Показываем сокращённое имя в топбаре
  getUsername(): string {
    return this.CURRENT_USER.shortName;
  }

  getFullName(): string {
    return this.CURRENT_USER.fullName;
  }
}