// Обновлённый layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  openMenu: string | null = null;
  sidebarCollapsed = false;

  constructor(private authService: AuthService) {}

  toggleMenu(menu: string): void {
    this.openMenu = this.openMenu === menu ? null : menu;
  }
  
  toggleSidebar(): void {  // ← добавить
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout(); // сам редиректит на /login
  }

  get username(): string {
    return this.authService.getUsername();
  }
}