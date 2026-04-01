import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { JournalGosGuaranteeService } from './journal-gos-guarantee.service';

export interface GosGuaranteeRecord {
  id:             number;
  nomer:          number;
  iin:            string;
  fio:            string;
  dataPriema:     string;
  moment:         string;
  kodOtdeleniya:  string;
}

@Component({
  selector: 'app-journal-gos-guarantee',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './journal-gos-guarantee.html',
  styleUrl: './journal-gos-guarantee.scss'
})
export class JournalGosGuaranteeComponent implements OnInit {

  // Фильтры
  filterDataOtpravkiFrom = '24.04.2025';
  filterDataOtpravkiTo   = '';
  filterOtdelenie        = '';
  filterIin              = '';
  filterUvedomlenie      = true;

  // Пагинация
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      GosGuaranteeRecord[] = [];
  filteredRecords: GosGuaranteeRecord[] = [];
  pagedRecords:    GosGuaranteeRecord[] = [];

  otdeleniyaList: string[] = [];

  constructor(
    private service: JournalGosGuaranteeService,
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

    if (this.filterIin.trim()) {
      const q = this.filterIin.trim().toLowerCase();
      result = result.filter(r =>
        r.iin.includes(q) || r.fio.toLowerCase().includes(q)
      );
    }

    if (this.filterOtdelenie) {
      result = result.filter(r => r.kodOtdeleniya === this.filterOtdelenie);
    }

    if (this.filterDataOtpravkiFrom.trim()) {
      const from = this.parseDate(this.filterDataOtpravkiFrom.trim());
      if (from) {
        result = result.filter(r => {
          const d = this.parseDate(r.dataPriema);
          return d ? d >= from : true;
        });
      }
    }

    if (this.filterDataOtpravkiTo.trim() && this.filterDataOtpravkiTo !== '-') {
      const to = this.parseDate(this.filterDataOtpravkiTo.trim());
      if (to) {
        result = result.filter(r => {
          const d = this.parseDate(r.dataPriema);
          return d ? d <= to : true;
        });
      }
    }

    this.filteredRecords = result;
    this.currentPage     = 1;
    this.updatePage();
  }

  resetFilter() {
    this.filterDataOtpravkiFrom = '';
    this.filterDataOtpravkiTo   = '';
    this.filterOtdelenie        = '';
    this.filterIin              = '';
    this.filterUvedomlenie      = false;
    this.filteredRecords        = [...this.allRecords];
    this.currentPage            = 1;
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
}