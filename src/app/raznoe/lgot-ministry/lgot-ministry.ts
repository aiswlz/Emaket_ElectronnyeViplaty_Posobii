import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LgotMinistryService } from './lgot-ministry.service';

export interface LgotRecord {
  systemDate: string;
  iin: string;
  fio: string;
  birthDate: string;
  mobu: string;
  rank: string;
  benefitType: string;
  luNumber: string;
  luIssueDate: string;
  issuedBy: string;
  luFrom: string;
  luTo: string;
  country: string;
  letterNumber: string;
}

@Component({
  selector: 'app-lgot-ministry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lgot-ministry.component.html',
  styleUrl: './lgot-ministry.component.scss'
})
export class LgotMinistryComponent implements OnInit {
  iinFilter    = '';
  currentPage  = 1;
  totalRecords = 0;
  pageSize     = 9;
  isLoading    = true;

  filteredRecords: LgotRecord[] = [];
  pagedRecords:    LgotRecord[] = [];
  private allRecords: LgotRecord[] = [];

  constructor(
    private lgotService: LgotMinistryService,
    private cdr: ChangeDetectorRef
  ) {}

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: Math.min(this.totalPages, 5) }, (_, i) => i + 1);
  }

  ngOnInit() {
    this.lgotService.getAll().subscribe({
      next: (data) => {
        this.allRecords  = data;
        this.totalRecords = data.length;
        this.isLoading   = false;
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
    this.filteredRecords = this.iinFilter.trim()
      ? this.allRecords.filter(r => r.iin.includes(this.iinFilter.trim()))
      : [...this.allRecords];
    this.currentPage = 1;
    this.updatePage();
  }

  resetFilter() {
    this.iinFilter = '';
    this.applyFilter();
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