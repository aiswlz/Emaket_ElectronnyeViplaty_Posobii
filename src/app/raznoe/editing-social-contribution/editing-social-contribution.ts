import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Интерфейс одной строки таблицы ──────────────────────
export interface SocialContribution {
  id: number;
  period: string;
  dateReceipt: string;
  amount: string;
  iin: string;
  rnnEnterprise: string;
  nameEnterprise: string;
  type: string;
  dateOperation: string;
  recipient: string;
  comment: string;
}

// ─── Интерфейс фильтра ────────────────────────────────────
export interface FilterForm {
  iin: string;
  bin: string;
  periodFrom: string;
  periodTo: string;
}

@Component({
  selector: 'app-editing-social-contribution',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editing-social-contribution.html',
  styleUrl: './editing-social-contribution.scss',
})
export class EditingSocialContribution implements OnInit {

  filter: FilterForm = { iin: '', bin: '', periodFrom: '', periodTo: '' };
  selectedRow: SocialContribution | null = null;
  currentPage = 1;
  pageSize = 9;
  totalRecords = 0;
  allData: SocialContribution[] = [];
  filteredData: SocialContribution[] = [];
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showProtocolModal = false;
  showCancelModal = false;
  formData: SocialContribution = this.emptyForm();

  constructor(private cdr: ChangeDetectorRef) {}
  private readonly STORAGE_KEY = 'social_contributions';

  
  ngOnInit() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      // Есть сохранённые данные — берём из localStorage
      this.allData      = JSON.parse(saved);
      this.totalRecords = this.allData.length;
      this.filteredData = [...this.allData];
      this.cdr.detectChanges();
    } else {
      // Первый раз — загружаем из JSON файла
      fetch('data/social-contributions.json')
        .then(res => res.json())
        .then((json: { data: SocialContribution[]; total: number }) => {
          this.allData      = json.data;
          this.totalRecords = json.total;
          this.filteredData = [...this.allData];
          this.saveToStorage();
          this.cdr.detectChanges();
        });
    }
  }

  private saveToStorage() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.allData));
  }

  get pagedData(): SocialContribution[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  selectRow(row: SocialContribution) {
    this.selectedRow = this.selectedRow?.id === row.id ? null : row;
  }

  isSelected(row: SocialContribution): boolean {
    return this.selectedRow?.id === row.id;
  }

  applyFilter() {
    this.filteredData = this.allData.filter(item => {
      const matchIin  = !this.filter.iin  || item.iin.includes(this.filter.iin);
      const matchBin  = !this.filter.bin  || item.rnnEnterprise.includes(this.filter.bin);
      const matchFrom = !this.filter.periodFrom || item.dateReceipt >= this.filter.periodFrom;
      const matchTo   = !this.filter.periodTo   || item.dateReceipt <= this.filter.periodTo;
      return matchIin && matchBin && matchFrom && matchTo;
    });
    this.currentPage = 1;
    this.totalRecords = this.filteredData.length;
  }

  resetFilter() {
    this.filter = { iin: '', bin: '', periodFrom: '', periodTo: '' };
    this.filteredData = [...this.allData];
    this.currentPage = 1;
    this.totalRecords = this.allData.length;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  refresh() {
    this.filteredData = [...this.allData];
    this.currentPage = 1;
    this.selectedRow = null;
    this.totalRecords = this.allData.length;
  }

  openAddModal() {
    this.formData = this.emptyForm();
    this.showAddModal = true;
  }

  saveAdd() {
    const newItem: SocialContribution = {
      ...this.formData,
      id: this.allData.length + 1,
      dateReceipt:   this.toDisplayDate(this.formData.dateReceipt),
      dateOperation: this.toDisplayDate(this.formData.dateOperation),
    };
    this.allData.unshift(newItem);
    this.filteredData = [...this.allData];
    this.totalRecords = this.allData.length;
    this.saveToStorage(); 
    this.showAddModal = false;
  }

  openEditModal() {
    if (!this.selectedRow) return;
    this.formData = { ...this.selectedRow };
    this.showEditModal = true;
  }

  saveEdit() {
    const idx = this.allData.findIndex(r => r.id === this.formData.id);
    if (idx !== -1) {
      this.allData[idx] = {
        ...this.formData,
        dateReceipt:   this.toDisplayDate(this.formData.dateReceipt),
        dateOperation: this.toDisplayDate(this.formData.dateOperation),
      };
      this.filteredData = [...this.allData];
      this.saveToStorage();
    }
    this.showEditModal = false;
    this.selectedRow = null;
  }

  openDeleteModal() {
    if (!this.selectedRow) return;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedRow) return;
    this.allData      = this.allData.filter(r => r.id !== this.selectedRow!.id);
    this.filteredData = this.filteredData.filter(r => r.id !== this.selectedRow!.id);
    this.saveToStorage();
    this.totalRecords = this.allData.length;
    this.selectedRow  = null;
    this.showDeleteModal = false;
  }

  openProtocolModal() { this.showProtocolModal = true; }

  openCancelModal() {
    if (!this.selectedRow) return;
    this.showCancelModal = true;
  }

  confirmCancel() {
    this.showCancelModal = false;
    this.selectedRow = null;
  }

  // ─── Конвертация даты ISO → ДД.ММ.ГГГГ ───────────────
  private toDisplayDate(iso: string): string {
    if (!iso || iso.includes('.')) return iso;
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  private emptyForm(): SocialContribution {
    return {
      id: 0, period: '', dateReceipt: '', amount: '',
      iin: '', rnnEnterprise: '', nameEnterprise: '',
      type: '', dateOperation: '', recipient: '', comment: '',
    };
  }
}