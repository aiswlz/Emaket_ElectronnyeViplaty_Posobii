import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { EaesJournalService } from './eaes-journal.service';

export interface EaesRecord {
  id:                   number;
  idRegistracii:        string;
  dataRegistracii:      string;
  dataZaprosa:          string;
  nomerZaprosa:         string;
  naimenovanieOblasti:  string;
  fio:                  string;
  dataRozhdeniya:       string;
  specialist:           string;
  gosudarstvo:          string;
  status:               string;
  podpisant:            string;
}

@Component({
  selector: 'app-eaes-journal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './eaes-journal.html',
  styleUrl: './eaes-journal.scss'
})
export class EaesJournalComponent implements OnInit {

  private service = inject(EaesJournalService);
  private cdr     = inject(ChangeDetectorRef);

  // Фильтры
  filterDataRegFrom  = '';
  filterDataRegTo    = '';
  filterFio          = '';
  filterStatus       = '';
  filterRegion       = '';
  filterDataZaprFrom = '';
  filterDataZaprTo   = '';
  filterNomerZapr    = '';
  filterGosudarstvo  = '';

  // Пагинация
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      EaesRecord[] = [];
  filteredRecords: EaesRecord[] = [];
  pagedRecords:    EaesRecord[] = [];

  regionList:      string[] = [];
  gosudarstvoList: string[] = [];

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
        this.allRecords      = data;
        this.regionList      = [...new Set(data.map(r => r.naimenovanieOblasti))].sort();
        this.gosudarstvoList = [...new Set(data.map(r => r.gosudarstvo))].sort();
        this.isLoading       = false;
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

    if (this.filterFio.trim()) {
      const q = this.filterFio.trim().toLowerCase();
      result = result.filter(r => r.fio.toLowerCase().includes(q));
    }

    if (this.filterStatus) {
      result = result.filter(r => r.status === this.filterStatus);
    }

    if (this.filterRegion) {
      result = result.filter(r => r.naimenovanieOblasti === this.filterRegion);
    }

    if (this.filterGosudarstvo) {
      result = result.filter(r => r.gosudarstvo === this.filterGosudarstvo);
    }

    if (this.filterNomerZapr.trim()) {
      result = result.filter(r => r.nomerZaprosa.includes(this.filterNomerZapr.trim()));
    }

    if (this.filterDataRegFrom.trim()) {
      const from = this.parseDate(this.filterDataRegFrom.trim());
      if (from) result = result.filter(r => {
        const d = this.parseDate(r.dataRegistracii);
        return d ? d >= from : true;
      });
    }

    if (this.filterDataRegTo.trim()) {
      const to = this.parseDate(this.filterDataRegTo.trim());
      if (to) result = result.filter(r => {
        const d = this.parseDate(r.dataRegistracii);
        return d ? d <= to : true;
      });
    }

    if (this.filterDataZaprFrom.trim()) {
      const from = this.parseDate(this.filterDataZaprFrom.trim());
      if (from) result = result.filter(r => {
        const d = this.parseDate(r.dataZaprosa);
        return d ? d >= from : true;
      });
    }

    if (this.filterDataZaprTo.trim()) {
      const to = this.parseDate(this.filterDataZaprTo.trim());
      if (to) result = result.filter(r => {
        const d = this.parseDate(r.dataZaprosa);
        return d ? d <= to : true;
      });
    }

    this.filteredRecords = result;
    this.currentPage     = 1;
    this.updatePage();
  }

  resetFilter() {
    this.filterDataRegFrom  = '';
    this.filterDataRegTo    = '';
    this.filterFio          = '';
    this.filterStatus       = '';
    this.filterRegion       = '';
    this.filterDataZaprFrom = '';
    this.filterDataZaprTo   = '';
    this.filterNomerZapr    = '';
    this.filterGosudarstvo  = '';
    this.filteredRecords    = [...this.allRecords];
    this.currentPage        = 1;
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