import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

export interface ReportItem {
  id: number;
  name: string;
  iconType: 'file' | 'folder';
  hasPlus?: boolean;
}

export interface StatusRow {
  name: string;
  date: string;
  statusLabel: string;
  statusType: 'error' | 'ok';
  number: string;
}

@Component({
  selector: 'app-internal-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './internal-reports.component.html',
  styleUrl: './internal-reports.component.scss'
})
export class InternalReportsComponent implements OnInit {
  searchQuery = '';
  selectedReport: ReportItem | null = null;

  allReports: ReportItem[] = [
    { id: 1,  name: 'Мониторинговые списки',                         iconType: 'file' },
    { id: 2,  name: 'Список ЭМД с просроченными сроками в отделении', iconType: 'file' },
    { id: 3,  name: '10 - Электронные уведомления',                   iconType: 'file' },
    { id: 4,  name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 5,  name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 6,  name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 7,  name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 8,  name: '11 - Движение по электронным уведомлениям',      iconType: 'file' },
    { id: 9,  name: '11 - Движение по электронным уведомлениям',      iconType: 'file' },
    { id: 10, name: '11 - Движение по электронным уведомлениям',      iconType: 'file' },
    { id: 11, name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 12, name: 'Мониторинговые списки',                          iconType: 'file' },
    { id: 13, name: 'Список ЭМД с просроченными сроками в отделении', iconType: 'file' },
    { id: 14, name: '10 - Электронные уведомления',                   iconType: 'file' },
    { id: 15, name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 16, name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 17, name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 18, name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
    { id: 19, name: '11 - Движение по электронным уведомлениям',      iconType: 'file' },
    { id: 20, name: '11 - Движение по электронным уведомлениям',      iconType: 'file' },
    { id: 21, name: '11 - Движение по электронным уведомлениям',      iconType: 'file' },
    { id: 22, name: '110 - Отчеты для центрального офиса',            iconType: 'folder', hasPlus: true },
  ];

  filteredReports: ReportItem[] = [];

  statusRows: StatusRow[] = [
    { name: 'Список по оказанным услугам', date: '25.06.2025 12:10:19', statusLabel: 'Отчет не сформирован', statusType: 'error', number: '123' },
    { name: 'Список по оказанным услугам', date: '25.06.2025 12:10:19', statusLabel: 'Отчет сформирован',    statusType: 'ok',    number: '123' },
    { name: 'Список по оказанным услугам', date: '25.06.2025 12:10:19', statusLabel: 'Отчет не сформирован', statusType: 'error', number: '123' },
    { name: 'Список по оказанным услугам', date: '25.06.2025 12:10:19', statusLabel: 'Отчет не сформирован', statusType: 'error', number: '123' },
    { name: 'Список по оказанным услугам', date: '25.06.2025 12:10:19', statusLabel: 'Отчет не сформирован', statusType: 'error', number: '123' },
    { name: 'Список по оказанным услугам', date: '25.06.2025 12:10:19', statusLabel: 'Отчет не сформирован', statusType: 'error', number: '123' },
  ];

  ngOnInit() {
    this.filteredReports = [...this.allReports];
  }

  selectReport(item: ReportItem) {
    this.selectedReport = item;
  }

  get filteredReportsList(): ReportItem[] {
    if (!this.searchQuery.trim()) return this.allReports;
    return this.allReports.filter(r =>
      r.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  applySearch() {
    this.filteredReports = this.filteredReportsList;
  }

  ngDoCheck() {
    this.filteredReports = this.filteredReportsList;
  }
}