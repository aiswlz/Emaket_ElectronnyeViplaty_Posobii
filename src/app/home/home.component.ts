import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

export interface LastMaket {
  id: number;
  iin: string;
  fio: string;
  dateBirth: string;
}

interface DashboardItem {
  id: string;
  type: 'banner' | 'donut' | 'bar' | 'makets' | 'reports';
  pinned: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  lastMakets: LastMaket[] = [];
  isLoadingMakets = true;

  topItems: DashboardItem[] = [
    { id: 'banner', type: 'banner', pinned: false },
    { id: 'donut',  type: 'donut',  pinned: false },
    { id: 'bar',    type: 'bar',    pinned: false }
  ];

  botItems: DashboardItem[] = [
    { id: 'makets',  type: 'makets',  pinned: false },
    { id: 'reports', type: 'reports', pinned: false }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadLayout();
    this.loadLastMakets();
  }

  private loadLayout() {
    const savedTop = localStorage.getItem('dashboardTopLayout');
    const savedBot = localStorage.getItem('dashboardBotLayout');
    if (savedTop) this.topItems = JSON.parse(savedTop);
    if (savedBot) this.botItems = JSON.parse(savedBot);
  }

  private saveLayout() {
    localStorage.setItem('dashboardTopLayout', JSON.stringify(this.topItems));
    localStorage.setItem('dashboardBotLayout', JSON.stringify(this.botItems));
  }

  dropTop(event: CdkDragDrop<DashboardItem[]>) {
    moveItemInArray(this.topItems, event.previousIndex, event.currentIndex);
    this.topItems.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    this.saveLayout();
  }

  dropBot(event: CdkDragDrop<DashboardItem[]>) {
    moveItemInArray(this.botItems, event.previousIndex, event.currentIndex);
    this.botItems.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    this.saveLayout();
  }

  togglePin(item: DashboardItem, event: Event) {
    event.stopImmediatePropagation();
    item.pinned = !item.pinned;
    // Закреплённые всегда сверху
    if (this.topItems.includes(item)) {
      this.topItems.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    } else {
      this.botItems.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }
    this.saveLayout();
  }

  getFlex(type: string): string {
    if (type === 'banner') return '1.35';
    if (type === 'makets') return '1.65';
    return '1';
  }

  trackById(index: number, item: DashboardItem): string {
    return item.id;
  }

  // ==================== Данные ====================
  loadLastMakets() {
    this.http.get<any[]>('http://localhost:8080/api/zayavleniya').subscribe({
      next: (data) => {
        this.lastMakets = (data || []).slice(0, 5).map(item => ({
          id: item.id,
          iin: item.iin ? String(item.iin) : '-',
          fio: item.fio || '-',
          dateBirth: this._fmt(item.dateBirth),
        }));
        this.isLoadingMakets = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingMakets = false;
        this.cdr.detectChanges();
      }
    });
  }

  openMaket(maket: LastMaket) {
    this.router.navigate(['/journals/emd', maket.iin]);
  }

  goCreateZayavlenie() {
    this.router.navigate(['/journals/zayavlenie/new']);
  }

  goCreateReport() {
    this.router.navigate(['/reports/internal']);
  }

  goSocViplaty() {
    this.router.navigate(['/reports/gfss']);
  }

  private _fmt(val: any): string {
    if (!val) return '-';
    const s = String(val);
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s;
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return s;
  }
}