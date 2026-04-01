import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { JournalAutoSigningService } from './journal-automated-signs.service';

export interface AutoSigningRecord {
  id:               number;
  nomer:            number;
  iin:              string;
  st:               string;
  fio:              string;
  otdelenie:        string;
  viplata:          string;
  dataObrasheniya:  string;
  dataNaznaniya:    string;
  dataOkonchaniya:  string;
  summa:            string;
  tipIstochnika:    string;
}

@Component({
  selector: 'app-journal-automated-signs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './journal-automated-signs.component.html',
  styleUrl: './journal-automated-signs.component.scss'
})
export class JournalAutomatedSignsComponent implements OnInit {

  // Фильтры
  filterOtdelenie     = '';
  filterOsnova        = '';
  filterStatus        = '';
  filterDataObr       = '24.04.2025';
  filterKolichestvo   = '';
  filterIin           = '';
  filterTipZayavleniya = '';

  // Пагинация
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      AutoSigningRecord[] = [];
  filteredRecords: AutoSigningRecord[] = [];
  pagedRecords:    AutoSigningRecord[] = [];

  otdeleniyaList: string[] = [];

  constructor(
    private service: JournalAutoSigningService,
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
        this.otdeleniyaList = [...new Set(data.map(r => r.otdelenie))].sort();
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
      result = result.filter(r => r.otdelenie === this.filterOtdelenie);
    }

    if (this.filterDataObr.trim()) {
      const from = this.parseDate(this.filterDataObr.trim());
      if (from) {
        result = result.filter(r => {
          const d = this.parseDate(r.dataObrasheniya);
          return d ? d >= from : true;
        });
      }
    }

    if (this.filterTipZayavleniya) {
      result = result.filter(r =>
        r.tipIstochnika.toLowerCase().includes(this.filterTipZayavleniya.toLowerCase())
      );
    }

    this.filteredRecords = result;
    this.currentPage     = 1;
    this.updatePage();
  }

  resetFilter() {
    this.filterOtdelenie      = '';
    this.filterOsnova         = '';
    this.filterStatus         = '';
    this.filterDataObr        = '';
    this.filterKolichestvo    = '';
    this.filterIin            = '';
    this.filterTipZayavleniya = '';
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
}