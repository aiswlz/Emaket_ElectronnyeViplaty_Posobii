import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SvPayerRecord {
  id: number;
  divisionCode: string;
  fullName: string;
  iin: string;
  paymentType: string;
  approvalDate: string;
  companyName: string;
  binPayer: string;
  emdStatus: string;
  inspectorName: string;
  addDate: string;
}

@Component({
  selector: 'app-sv-payers-registry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sv-payers-registry.html',
  styleUrl: './sv-payers-registry.scss'
})
export class SvPayersRegistryComponent implements OnInit {

  // Фильтры
  filterType = '';
  filterAddDate = '';
  filterBin = '';


  // Типы для фильтра "Тип"
  orgTypes = [
    'ТОО',
    'АО',
    'ИП',
    'Частная практика',
    'Физическое лицо'
  ];

  // Виды выплат для модалки добавления
  paymentTypes = [''];

  // Пагинация
  currentPage = 1;
  pageSize = 9;
  totalRecords = 100;

  // Модалка добавления
  showAddModal = false;
  newRecord: Partial<SvPayerRecord> = {};

  readonly STORAGE_KEY = 'sv-payers-records';

  allRecords: SvPayerRecord[] = [];
  filteredRecords: SvPayerRecord[] = [];

  ngOnInit(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.allRecords = JSON.parse(saved);
    } else {
      this.allRecords = [
        { id: 1, divisionCode: '783', fullName: 'Аманжолов Ерлан Сейітұлы', iin: '9234567890', paymentType: '', approvalDate: '15.03.2024', companyName: 'ТОО "Сарыарка Инвест"', binPayer: '123 456 789 012', emdStatus: 'Принято', inspectorName: 'Аманжолов Ерлан Сейітұлы', addDate: '15.03.2024' },
        { id: 2, divisionCode: '249', fullName: 'Бекмуратов Даниер Талғатұлы', iin: '9987654321', paymentType: '', approvalDate: '08.07.2024', companyName: 'АО "Казахстанские Технологии"', binPayer: '234 567 890 123', emdStatus: 'Принято', inspectorName: 'Бекмуратов Даниер Талғатұлы', addDate: '08.07.2024' },
        { id: 3, divisionCode: '512', fullName: 'Сейітов Асылбек Нұрланұлы', iin: '9551234567', paymentType: '', approvalDate: '22.11.2024', companyName: 'ИП "Алатау Строй"', binPayer: '345 678 901 234', emdStatus: 'Принято', inspectorName: 'Сейітов Асылбек Нұрланұлы', addDate: '22.11.2024' },
        { id: 4, divisionCode: '874', fullName: 'Тұрсынов Жандос Маратұлы', iin: '9876543210', paymentType: '', approvalDate: '30.01.2024', companyName: 'ТОО "Байтерек Групп"', binPayer: '456 789 012 345', emdStatus: 'Принято', inspectorName: 'Тұрсынов Жандос Маратұлы', addDate: '30.01.2024' },
        { id: 5, divisionCode: '635', fullName: 'Қудайбергенов Нұрсұлтан Амангелдіұлы', iin: '8567890123', paymentType: '', approvalDate: '12.05.2024', companyName: 'АО "КазМунайГаз"', binPayer: '567 890 123 456', emdStatus: 'Принято', inspectorName: 'Қудайбергенов Нұрсұлтан Амангелдіұлы', addDate: '12.05.2024' },
        { id: 6, divisionCode: '902', fullName: 'Муратов Досжан Серікұлы', iin: '9216549870', paymentType: '', approvalDate: '19.09.2024', companyName: 'ТОО "Евразия Логистика"', binPayer: '678 901 234 567', emdStatus: 'Принято', inspectorName: 'Муратов Досжан Серікұлы', addDate: '19.09.2024' },
        { id: 7, divisionCode: '318', fullName: 'Сарсенов Нұржан Талғатұлы', iin: '8543210987', paymentType: '', approvalDate: '04.12.2024', companyName: 'ИП "Семейный Бизнес"', binPayer: '789 012 345 678', emdStatus: 'Принято', inspectorName: 'Сарсенов Нұржан Талғатұлы', addDate: '04.12.2024' },
        { id: 8, divisionCode: '467', fullName: 'Жумабаев Ермек Сапарұлы', iin: '7890123456', paymentType: '', approvalDate: '27.02.2024', companyName: 'АО "Казахстанская Энергетика"', binPayer: '890 123 456 789', emdStatus: 'Принято', inspectorName: 'Жумабаев Ермек Сапарұлы', addDate: '27.02.2024' },
        { id: 9, divisionCode: '155', fullName: 'Ахметов Болат Сейітқалиұлы', iin: '6712345678', paymentType: '', approvalDate: '10.01.2025', companyName: 'ТОО "АлматыСтрой"', binPayer: '901 234 567 890', emdStatus: 'Принято', inspectorName: 'Ахметов Болат Сейітқалиұлы', addDate: '10.01.2025' },
      ];
      this.saveToStorage();
    }
    this.applyFilter();
  }

  saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.allRecords));
  }

  applyFilter(): void {
    this.filteredRecords = this.allRecords.filter(r => {
      const typeMatch = !this.filterType || r.companyName.startsWith(this.filterType);
      const dateMatch = !this.filterAddDate || r.addDate.includes(this.filterAddDate);
      const binMatch = !this.filterBin || r.binPayer.includes(this.filterBin);
      return typeMatch && dateMatch && binMatch;
    });
    this.currentPage = 1;
  }

  resetFilter(): void {
    this.filterType = '';
    this.filterAddDate = '';
    this.filterBin = '';
    this.applyFilter();
  }

  get paginatedRecords(): SvPayerRecord[] {
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
    this.newRecord = { emdStatus: 'Принято' };
    this.showAddModal = true;
  }

  saveNewRecord(): void {
    const rec: SvPayerRecord = {
      id: this.allRecords.length + 1,
      divisionCode: String(Math.floor(Math.random() * 900) + 100),
      fullName: this.newRecord.fullName || '',
      iin: this.newRecord.iin || '',
      paymentType: this.newRecord.paymentType || '',
      approvalDate: this.newRecord.approvalDate || '',
      companyName: this.newRecord.companyName || '',
      binPayer: this.newRecord.binPayer || '',
      emdStatus: 'Принято',
      inspectorName: this.newRecord.inspectorName || '',
      addDate: new Date().toLocaleDateString('ru-RU'),
    };
  
    this.allRecords.unshift(rec);
    this.saveToStorage();
    this.applyFilter();
    this.showAddModal = false;
  }
}