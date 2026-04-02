import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface KgdIncomeRecord {
  id: number;
  requestId: string;
  requestDate: string;
  binOrg: string;
  personType: string;
  iin: string;
  fullName: string;
  periodFrom: string;
  periodTo: string;
  responseDate: string;
  user: string;
}

@Component({
  selector: 'app-kgd-income',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kgd-income.html',
  styleUrl: './kgd-income.scss'
})
export class KgdIncomeComponent implements OnInit {

  // Фильтры
  filterIin = '';
  filterBin = '';
  filterPersonType = '';
  filterPeriodFrom = '';
  filterPeriodTo = '';

  personTypes = ['ФЛ', 'ИП', 'ЮЛ'];

  // Пагинация
  currentPage = 1;
  pageSize = 9;
  totalRecords = 100;

  allRecords: KgdIncomeRecord[] = [
    { id: 1,  requestId: '087365', requestDate: '15.03.2024', binOrg: '856789123456', personType: 'ФЛ', iin: '856789123456', fullName: 'Аманжолов Ерлан Сейітұлы',    periodFrom: '15.03.2025', periodTo: '15.03.2024', responseDate: '15.03.2025', user: 'Аманжолов Ерлан Сейітұлы' },
    { id: 2,  requestId: '07865',  requestDate: '08.07.2024', binOrg: '987654321012', personType: 'ИП', iin: '987654321012', fullName: 'Бекмуратов Даниер Талғатұлы',  periodFrom: '07.04.2025', periodTo: '07.07.2024', responseDate: '07.04.2025', user: 'Бекмуратов Даниер Талғатұлы' },
    { id: 3,  requestId: '92804',  requestDate: '22.11.2024', binOrg: '921654987654', personType: 'ФЛ', iin: '921654987654', fullName: 'Сейітов Асылбек Нұрланұлы',   periodFrom: '22.05.2025', periodTo: '22.11.2024', responseDate: '22.05.2025', user: 'Сейітов Асылбек Нұрланұлы' },
    { id: 4,  requestId: '129358', requestDate: '30.01.2024', binOrg: '954321789012', personType: 'ЮЛ', iin: '954321789012', fullName: 'Тұрсынов Жандос Маратұлы',    periodFrom: '30.06.2025', periodTo: '30.05.2024', responseDate: '30.06.2025', user: 'Тұрсынов Жандос Маратұлы' },
    { id: 5,  requestId: '938576', requestDate: '12.05.2024', binOrg: '889012345678', personType: 'ИП', iin: '889012345678', fullName: 'Қудайбергенов Нұрсұлтан Амангелдіұлы', periodFrom: '11.07.2025', periodTo: '18.09.2024', responseDate: '11.07.2025', user: 'Қудайбергенов Нұрсұлтан Амангелдіұлы' },
    { id: 6,  requestId: '82354',  requestDate: '19.08.2024', binOrg: '923456789321', personType: 'ФЛ', iin: '923456789321', fullName: 'Муратов Досжан Серікұлы',     periodFrom: '19.08.2025', periodTo: '04.12.2024', responseDate: '19.08.2025', user: 'Муратов Досжан Серікұлы' },
    { id: 7,  requestId: '207235', requestDate: '04.12.2024', binOrg: '934567890123', personType: 'ФЛ', iin: '934567890123', fullName: 'Сарсенов Нұржан Талғатұлы',   periodFrom: '03.09.2025', periodTo: '12.02.2024', responseDate: '03.09.2025', user: 'Сарсенов Нұржан Талғатұлы' },
    { id: 8,  requestId: '2876',   requestDate: '27.02.2024', binOrg: '945678901234', personType: 'ЮЛ', iin: '945678901234', fullName: 'Жумабаев Ермек Сапарұлы',     periodFrom: '28.10.2025', periodTo: '29.08.2024', responseDate: '28.10.2025', user: 'Жумабаев Ермек Сапарұлы' },
    { id: 9,  requestId: '334521', requestDate: '05.06.2024', binOrg: '112345678901', personType: 'ИП', iin: '112345678901', fullName: 'Ахметов Болат Сейітқалиұлы',  periodFrom: '10.01.2025', periodTo: '05.06.2024', responseDate: '10.01.2025', user: 'Ахметов Болат Сейітқалиұлы' },
  ];

  filteredRecords: KgdIncomeRecord[] = [];

  // Модальное окно добавления
  showAddModal = false;
  newRecord: Partial<KgdIncomeRecord> = {};

  ngOnInit(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredRecords = this.allRecords.filter(r => {
      const iinMatch = !this.filterIin || r.iin.includes(this.filterIin);
      const binMatch = !this.filterBin || r.binOrg.includes(this.filterBin);
      const typeMatch = !this.filterPersonType || r.personType === this.filterPersonType;
      return iinMatch && binMatch && typeMatch;
    });
    this.currentPage = 1;
  }

  resetFilter(): void {
    this.filterIin = '';
    this.filterBin = '';
    this.filterPersonType = '';
    this.filterPeriodFrom = '';
    this.filterPeriodTo = '';
    this.applyFilter();
  }

  get paginatedRecords(): KgdIncomeRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRecords.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openAddModal(): void {
    this.newRecord = {};
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  saveNewRecord(): void {
    const record: KgdIncomeRecord = {
      id: this.allRecords.length + 1,
      requestId: String(Math.floor(Math.random() * 900000) + 100000),
      requestDate: new Date().toLocaleDateString('ru-RU'),
      binOrg: this.newRecord.binOrg || '',
      personType: this.newRecord.personType || '',
      iin: this.newRecord.iin || '',
      fullName: this.newRecord.fullName || '',
      periodFrom: this.newRecord.periodFrom || '',
      periodTo: this.newRecord.periodTo || '',
      responseDate: '',
      user: this.newRecord.fullName || '',
    };
    this.allRecords.unshift(record);
    this.applyFilter();
    this.closeAddModal();
  }
}