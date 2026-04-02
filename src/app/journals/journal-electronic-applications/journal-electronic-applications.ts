import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { JournalElectronicApplicationsService } from './journal-electronic-applications.service';

export interface ElectronicAppRecord {
  id:                 number;
  data:               string;
  vremya:             string;
  nomerZayavleniya:   string;
  otdelenie:          string;
  iin:                string;
  fio:                string;
  dataRozhdeniya:     string;
  status:             string;
  osnova:             string;
  istochnik:          string;
  kommentariy:        string;
}

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

  private service = inject(JournalElectronicApplicationsService);
  private cdr     = inject(ChangeDetectorRef);

  // Фильтры
  filterGod            = '2025';
  filterMesyats        = 'Январь';
  filterIstochnik      = '';
  filterStatus         = 'Проверен';
  filterOsnova         = '';
  filterTip            = '';
  filterFio            = '';
  filterUvedomlenie    = true;
  filterEksterritorial = false;

  // Пагинация (остаётся для общей таблицы)
  currentPage = 1;
  pageSize    = 10;
  isLoading   = true;

  allRecords:      ElectronicAppRecord[] = [];
  filteredRecords: ElectronicAppRecord[] = [];
  pagedRecords:    ElectronicAppRecord[] = [];   // используется только для пагинации

  // Группы дат — теперь строятся по ВСЕМ отфильтрованным записям
  dateGroups:      DateGroup[]           = [];

  // Выбранная дата и её записи
  selectedDate:    string                  = '';
  selectedRecords: ElectronicAppRecord[]   = [];

  otdeleniyaList: string[] = [];
  istochnikList:  string[] = [];

  get totalRecords(): number { 
    return this.filteredRecords.length; 
  }

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
        this.istochnikList  = [...new Set(data.map(r => r.istochnik))].sort();
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

    if (this.filterFio.trim()) {
      const q = this.filterFio.trim().toLowerCase();
      result = result.filter(r => 
        r.fio.toLowerCase().includes(q) || r.iin.includes(q)
      );
    }
    if (this.filterStatus)    result = result.filter(r => r.status === this.filterStatus);
    if (this.filterIstochnik) result = result.filter(r => r.istochnik === this.filterIstochnik);
    if (this.filterOsnova)    result = result.filter(r => 
      r.osnova.toLowerCase().includes(this.filterOsnova.toLowerCase())
    );
    if (this.filterTip)       result = result.filter(r => r.otdelenie === this.filterTip);

    this.filteredRecords = result;
    this.currentPage     = 1;
    this.updatePage();
  }

  resetFilter() {
    this.filterGod            = '2025';
    this.filterMesyats        = 'Январь';
    this.filterIstochnik      = '';
    this.filterStatus         = '';
    this.filterOsnova         = '';
    this.filterTip            = '';
    this.filterFio            = '';
    this.filterUvedomlenie    = false;
    this.filterEksterritorial = false;

    this.filteredRecords = [...this.allRecords];
    this.currentPage     = 1;
    this.updatePage();
  }

  updatePage() {
    // Пагинация для общей таблицы
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRecords = this.filteredRecords.slice(start, start + this.pageSize);

    this.buildDateGroups();

    // Автоматически выбираем первую дату (самую новую)
    if (this.dateGroups.length > 0) {
      this.selectDate(this.dateGroups[0].data);
    } else {
      this.selectedDate = '';
      this.selectedRecords = [];
    }
  }

  // ← Главное изменение: строим группы по ВСЕМ отфильтрованным записям
  buildDateGroups() {
    const groupMap = new Map<string, ElectronicAppRecord[]>();

    for (const r of this.filteredRecords) {
      if (!groupMap.has(r.data)) {
        groupMap.set(r.data, []);
      }
      groupMap.get(r.data)!.push(r);
    }

    this.dateGroups = Array.from(groupMap.entries())
      .map(([data, records]) => ({
        data,
        kolichestvo: records.length,
        records: [...records]
      }))
      // Сортируем по убыванию даты (новые сверху)
      .sort((a, b) => b.data.localeCompare(a.data));
  }

  selectDate(date: string) {
    this.selectedDate = date;
    const group = this.dateGroups.find(g => g.data === date);
    this.selectedRecords = group ? [...group.records] : [];
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Проверен':        return 'status-checked';
      case 'На рассмотрении': return 'status-pending';
      case 'Отклонен':        return 'status-rejected';
      default:                return '';
    }
  }
}