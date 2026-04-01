import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { JournalDigitizedCasesService } from './journal-digitized-cases.service';

export interface DigitizedCaseRecord {
  id:                      number;
  nomer:                   number;
  dataStatusa:             string;
  status:                  string;
  kodOtdeleniya:           string;
  iin:                     string;
  fio:                     string;
  dataRozhdeniya:          string;
  viplata:                 string;
  podpisat:                string;
  dataOkonchaniyaViplaty:  string;
  prichinaSniatiya:        string;
}

@Component({
  selector: 'app-journal-digitized-cases',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './journal-digitized-cases.component.html',
  styleUrl: './journal-digitized-cases.component.scss'
})
export class JournalDigitizedCasesComponent implements OnInit {

  // Фильтры
  filterDataStatusFrom = '24.04.2025';
  filterDataStatusTo   = '';
  filterViplata        = '';
  filterIinSik         = '';
  filterOtdelenie      = '';

  // Пагинация
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      DigitizedCaseRecord[] = [];
  filteredRecords: DigitizedCaseRecord[] = [];
  pagedRecords:    DigitizedCaseRecord[] = [];

  otdeleniyaList: string[] = [];
  viplataList:    string[] = [];

  constructor(
    private service: JournalDigitizedCasesService,
    private cdr: ChangeDetectorRef
  ) {}

  get totalRecords(): number { return this.filteredRecords.length; }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.pageSize);
  }

  get pages(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, this.currentPage + 2); i++) {
      range.push(i);
    }
    return range;
  }

  ngOnInit() {
    this.service.getAll().subscribe({
      next: (data) => {
        this.allRecords     = data;
        this.otdeleniyaList = [...new Set(data.map(r => r.kodOtdeleniya))].sort();
        this.viplataList    = [...new Set(data.map(r => r.viplata))].sort();
        this.isLoading      = false;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    let result = [...this.allRecords];

    if (this.filterIinSik.trim()) {
      const q = this.filterIinSik.trim().toLowerCase();
      result = result.filter(r =>
        r.iin.includes(q) || r.fio.toLowerCase().includes(q)
      );
    }

    if (this.filterOtdelenie) {
      result = result.filter(r => r.kodOtdeleniya === this.filterOtdelenie);
    }

    if (this.filterViplata) {
      result = result.filter(r => r.viplata === this.filterViplata);
    }

    if (this.filterDataStatusFrom.trim()) {
      const from = this.parseDate(this.filterDataStatusFrom.trim());
      if (from) {
        result = result.filter(r => {
          const d = this.parseDate(r.dataStatusa);
          return d ? d >= from : true;
        });
      }
    }

    if (this.filterDataStatusTo.trim() && this.filterDataStatusTo !== '-') {
      const to = this.parseDate(this.filterDataStatusTo.trim());
      if (to) {
        result = result.filter(r => {
          const d = this.parseDate(r.dataStatusa);
          return d ? d <= to : true;
        });
      }
    }

    this.filteredRecords = result;
    this.currentPage     = 1;
    this.updatePage();
  }

  resetFilter() {
    this.filterDataStatusFrom = '';
    this.filterDataStatusTo   = '';
    this.filterViplata        = '';
    this.filterIinSik         = '';
    this.filterOtdelenie      = '';
    this.filteredRecords      = [...this.allRecords];
    this.currentPage          = 1;
    this.updatePage();
  }

  private parseDate(str: string): Date | null {
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }

  updatePage() {
    const start       = (this.currentPage - 1) * this.pageSize;
    this.pagedRecords = this.filteredRecords.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Принято': return 'status-accepted';
      case 'Снято':   return 'status-removed';
      default:        return '';
    }
  }
}