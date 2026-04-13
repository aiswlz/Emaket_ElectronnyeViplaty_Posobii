
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { JournalZayavleniyService } from './journal-zayavleniy.component.service';

export interface ZayavlenieRecord {
  nomer: string;
  dateReg: string;
  dateObr: string;
  kodOtd: string;
  nomerDela: string;
  iin: number;        // ← было string
  fio: string;
  dateBirth: string;
  osnova: number;     // ← было string
  vidViplaty: string;
  tipZayav: string;   // ← добавить
  tipIstochnikaZayav: string; // ← добавить
  specialist: number; // ← было string
  dateResh: string;
  razmer: number;     // ← было string
  dateNazn: string;
  vidNazn: string;
}

@Component({
  selector: 'app-journal-zayavleniy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './journal-zayavleniy.component.html',
  styleUrl: './journal-zayavleniy.component.scss'
})
export class JournalZayavleniyComponent implements OnInit {

  // Фильтры
  filterDateFrom   = '';
  filterDateStatus = '';
  filterOtdelenie  = '';
  filterIstochnik  = '';
  filterTip        = '';
  filterOsnova     = '';
  filterFio        = '';
  filterAvto       = false;
  filterEkster     = false;

  // Пагинация
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      ZayavlenieRecord[] = [];
  filteredRecords: ZayavlenieRecord[] = [];
  pagedRecords:    ZayavlenieRecord[] = [];

  constructor(
    private journalService: JournalZayavleniyService,
    private cdr: ChangeDetectorRef
  ) {}

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
    console.log('ngOnInit запустился');
    
    this.journalService.getAll().subscribe({
      next: (data) => {
        console.log('Данные получены:', data);
        this.allRecords = data;
        this.isLoading  = false;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка загрузки:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('complete сработал');
      }
    });
  }

 applyFilter() {
  let result = [...this.allRecords];

  // Фильтр по ФИО или ИИН
  if (this.filterFio.trim()) {
    const q = this.filterFio.trim().toLowerCase();
    result = result.filter(r =>
      r.fio.toLowerCase().includes(q) || r.iin.toString().includes(q)
    );
  }

  // Фильтр по отделению
  if (this.filterOtdelenie) {
    result = result.filter(r => r.kodOtd === this.filterOtdelenie);
  }

  // Фильтр по основанию
  if (this.filterOsnova) {
    result = result.filter(r =>
      r.osnova?.toString().includes(this.filterOsnova)
    );
  }

  // Фильтр по типу назначения
  if (this.filterTip) {
    result = result.filter(r =>
      r.vidNazn?.toLowerCase().includes(this.filterTip.toLowerCase())
    );
  }

  // Фильтр по дате заявления
  if (this.filterDateFrom.trim()) {
    const from = this.parseDate(this.filterDateFrom.trim());
    if (from) {
      result = result.filter(r => {
        const d = this.parseDate(r.dateReg);
        return d ? d >= from : true;
      });
    }
  }

  // Фильтр по дате статуса
  if (this.filterDateStatus.trim() && this.filterDateStatus !== '-') {
    const from = this.parseDate(this.filterDateStatus.trim());
    if (from) {
      result = result.filter(r => {
        const d = this.parseDate(r.dateResh);
        return d ? d >= from : true;
      });
    }
  }

  this.filteredRecords = result;
  this.currentPage = 1;
  this.updatePage();
}

  resetFilter() {
    this.filterDateFrom   = '';
    this.filterDateStatus = '';
    this.filterOtdelenie  = '';
    this.filterIstochnik  = '';
    this.filterTip        = '';
    this.filterOsnova     = '';
    this.filterFio        = '';
    this.filterAvto       = false;
    this.filterEkster     = false;
    this.filteredRecords  = [...this.allRecords];
    this.currentPage      = 1;
    this.updatePage();
  }

  // Хелпер: парсим дату формата DD.MM.YYYY
  private parseDate(str: string): Date | null {
    const parts = str.split('.');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts.map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
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
}