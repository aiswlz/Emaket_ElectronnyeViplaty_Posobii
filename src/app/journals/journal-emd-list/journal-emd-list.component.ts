import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export interface EmdListRecord {
  dateObr: string;
  dateStatus: string;
  status: string;
  kodOtd: string;
  iin: string;
  fio: string;
  dateBirth: string;
  istochnik: string;
  dateNazn: string;
  dateOkon: string;
  srokOkazaniya: string;   // ← добавь
  viplata: string;          // ← добавь
  naznRazmer: string;
  dateRiska: string;
  specialist: string;
  podpisant: string;
}

@Component({
  selector: 'app-journal-emd-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-emd-list.component.html',
  styleUrl: './journal-emd-list.component.scss'
})
export class JournalEmdListComponent implements OnInit {

  filterDateObr    = '';
  filterDateStatus = '';
  filterViplata    = '';
  filterPole1      = '';
  filterPole2      = '';
  filterOsvoe      = true;
  filterEkster     = false;

  isLoading = true;
  allRecords:      EmdListRecord[] = [];
  filteredRecords: EmdListRecord[] = [];
  pagedRecords:    EmdListRecord[] = [];

  currentPage = 1;
  pageSize    = 10;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRecords.length / this.pageSize));
  }

  get pages(): number[] {
    const range: number[] = [];
    for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, this.currentPage + 2); i++) {
      range.push(i);
    }
    return range;
  }

  ngOnInit() {
    this.http.get<EmdListRecord[]>('/data/emd-list.json').subscribe({
      next: (data) => {
        const saved = JSON.parse(localStorage.getItem('emd-new-records') || '[]');
        this.allRecords = [...saved, ...data]; // новые сверху
        this.isLoading  = false;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterFio = '';

  applyFilter() {
    let result = [...this.allRecords];

    // Фильтр по ИИН или ФИО
    if (this.filterFio.trim()) {
      const q = this.filterFio.trim().toLowerCase();
      result = result.filter(r =>
        r.fio.toLowerCase().includes(q) || r.iin.includes(q)
      );
    }

    // Фильтр по дате обращения
    if (this.filterDateObr.trim()) {
      const from = this.parseDate(this.filterDateObr.trim());
      if (from) {
        result = result.filter(r => {
          const d = this.parseDate(r.dateObr);
          return d ? d >= from : true;
        });
      }
    }

    // Фильтр по дате статуса
    if (this.filterDateStatus.trim() && this.filterDateStatus !== '-') {
      const from = this.parseDate(this.filterDateStatus.trim());
      if (from) {
        result = result.filter(r => {
          const d = this.parseDate(r.dateStatus);
          return d ? d >= from : true;
        });
      }
    }

    this.filteredRecords = result;
    this.currentPage = 1;
    this.updatePage();
  }

  private parseDate(str: string): Date | null {
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  }

  resetFilter() {
    this.filterDateObr    = '';  // ← пустая, не '24.04.2025'
    this.filterDateStatus = '';
    this.filterViplata    = '';
    this.filterFio        = '';
    this.filterOsvoe      = false;
    this.filterEkster     = false;
    this.filteredRecords  = [...this.allRecords];
    this.currentPage      = 1;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRecords = this.filteredRecords.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  openCard(iin: string) {
    this.router.navigate(['/journals/emd', iin]);
  }
  addClient() {
    this.router.navigate(['/journals/emd/new/zayavlenie']);
  }
}