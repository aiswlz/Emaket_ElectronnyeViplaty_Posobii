import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { JournalElectronicApplicationsService } from './journal-electronic-applications.service';

export interface ElectronicAppRecord {
  id:                 number;
  data:               string;   // дата группы
  kolichestvo:        number;   // количество в группе
  vremya:             string;   // время
  nomerZayavleniya:   string;   // № заявления
  otdelenie:          string;   // отделение
  iin:                string;
  fio:                string;
  dataRozhdeniya:     string;
  status:             string;
  osnova:             string;
  istochnik:          string;
  kommentariy:        string;
}

// Группа строк по дате (для отображения левой колонки с датой и количеством)
export interface DateGroup {
  data:        string;
  kolichestvo: number;
  records:     ElectronicAppRecord[];
}

@Component({
  selector: 'app-journal-electronic-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './journal-electronic-applications.html',
  styleUrl: './journal-electronic-applications.scss'
})
export class JournalElectronicApplications implements OnInit {

  // Фильтры
  filterGod        = '2025';
  filterMesyats    = 'Январь';
  filterIstochnik  = '';
  filterStatus     = 'Проверен';
  filterOsnova     = '';
  filterTip        = '';
  filterFio        = '';
  filterUvedomlenie   = true;
  filterEksterritorial = false;

  // Пагинация
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      ElectronicAppRecord[] = [];
  filteredRecords: ElectronicAppRecord[] = [];
  pagedRecords:    ElectronicAppRecord[] = [];
  dateGroups:      DateGroup[]           = [];

  // Уникальные значения для select-ов
  otdeleniyaList: string[] = [];
  istochnikList:  string[] = [];

  constructor(
    private service: JournalElectronicApplicationsService,
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
        this.allRecords = data;
        // Собираем уникальные значения для фильтров
        this.otdeleniyaList = [...new Set(data.map(r => r.otdelenie))].sort();
        this.istochnikList  = [...new Set(data.map(r => r.istochnik))].sort();
        this.isLoading = false;
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
      result = result.filter(r =>
        r.fio.toLowerCase().includes(q) || r.iin.includes(q)
      );
    }

    if (this.filterStatus) {
      result = result.filter(r => r.status === this.filterStatus);
    }

    if (this.filterIstochnik) {
      result = result.filter(r => r.istochnik === this.filterIstochnik);
    }

    if (this.filterOsnova) {
      result = result.filter(r =>
        r.osnova.toLowerCase().includes(this.filterOsnova.toLowerCase())
      );
    }

    if (this.filterTip) {
      result = result.filter(r =>
        r.otdelenie === this.filterTip
      );
    }

    this.filteredRecords = result;
    this.currentPage = 1;
    this.updatePage();
  }

  resetFilter() {
    this.filterGod           = '2025';
    this.filterMesyats       = 'Январь';
    this.filterIstochnik     = '';
    this.filterStatus        = '';
    this.filterOsnova        = '';
    this.filterTip           = '';
    this.filterFio           = '';
    this.filterUvedomlenie   = false;
    this.filterEksterritorial = false;
    this.filteredRecords     = [...this.allRecords];
    this.currentPage         = 1;
    this.updatePage();
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRecords = this.filteredRecords.slice(start, start + this.pageSize);
    this.buildDateGroups();
  }

  // Строим группы дат для левой колонки таблицы
  buildDateGroups() {
    const groupMap = new Map<string, ElectronicAppRecord[]>();
    for (const r of this.pagedRecords) {
      if (!groupMap.has(r.data)) groupMap.set(r.data, []);
      groupMap.get(r.data)!.push(r);
    }
    this.dateGroups = [];
    groupMap.forEach((records, data) => {
      this.dateGroups.push({ data, kolichestvo: records.length, records });
    });
  }

  // Сколько строк занимает ячейка даты (rowspan)
  getRowspan(record: ElectronicAppRecord): number {
    return this.pagedRecords.filter(r => r.data === record.data).length;
  }

  isFirstInGroup(record: ElectronicAppRecord): boolean {
    const group = this.pagedRecords.filter(r => r.data === record.data);
    return group[0]?.id === record.id;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Проверен':         return 'status-checked';
      case 'На рассмотрении':  return 'status-pending';
      case 'Отклонен':         return 'status-rejected';
      default:                 return '';
    }
  }
}