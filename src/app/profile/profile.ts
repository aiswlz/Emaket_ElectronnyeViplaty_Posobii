import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {

  activeTab: 'personal' | 'password' | 'roles' | 'ecp' = 'personal';

  // Личные данные — только просмотр, приходят из системы
  personalData = {
    lastName: 'Adminov',
    firstName: 'Admin',
    middleName: 'Adminovich',
    iin: '123456789012',
    email: 'admin@emaket.kz',
    phone: '+7 700 000 0000',
    position: 'Главный специалист отделения',
    department: 'Департамент пенсионных выплат',
    region: 'Астана',
    division: 'Отделение №1',
  };

  // Изменить пароль
  passwordData = { current: '', newPass: '', confirm: '' };
  passwordSuccess = false;
  passwordError = '';

  // Роли — только просмотр
  roles = [
    { code: '38204', name: 'Главный специалист отделения / Бөлімшенің бас маманы' },
    { code: '38207', name: 'Начальник отделения / Бөлімше бастығы' },
    { code: '38204', name: 'Специалист областного Филиала / Облыстық филиал маманы' },
    { code: '38207', name: 'Директор областного Филиала / Облыстық филиалының директоры' },
    { code: '38204', name: 'Специалист департамента / Департамент маманы' },
    { code: '38224', name: 'Начальник отдела департамента / Департамент бөлімінің бастығы' },
    { code: '38227', name: 'Директор департамента / Департаменттің директоры' },
    { code: '38235', name: 'Специалист центра (ДИТ) / Орталық маманы (ДИТ)' },
    { code: '38239', name: 'Редактирование-Аудит / Түзету-Аудит' },
    { code: '38201', name: 'Специалист отделения (ЕМS) / Бөлімше маманы' },
  ];

  // ЭЦП
  ecpData = {
    subject: 'CN=ADMINOV ADMIN, OU=BIN123456789012',
    issuer: 'CN=GОСТ Root CA, O=НУЦ РК, C=KZ',
    validFrom: '01.01.2024',
    validTo: '01.01.2026',
    status: 'Действителен',
  };

  get fullName(): string {
    return `${this.personalData.lastName} ${this.personalData.firstName} ${this.personalData.middleName}`.trim();
  }

  setTab(tab: 'personal' | 'password' | 'roles' | 'ecp'): void {
    this.activeTab = tab;
    this.passwordSuccess = false;
    this.passwordError = '';
  }

  changePassword(): void {
    this.passwordError = '';
    if (!this.passwordData.current) {
      this.passwordError = 'Введите текущий пароль';
      return;
    }
    if (this.passwordData.newPass.length < 6) {
      this.passwordError = 'Новый пароль должен быть не менее 6 символов';
      return;
    }
    if (this.passwordData.newPass !== this.passwordData.confirm) {
      this.passwordError = 'Пароли не совпадают';
      return;
    }
    // Здесь будет API вызов
    this.passwordSuccess = true;
    this.passwordData = { current: '', newPass: '', confirm: '' };
  }
}