import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ReportService, DAction, OrderRequest } from './internal-reports.component.service';

export interface StatusRow {
  orderId: number;
  name: string;
  date: string;
  statusLabel: string;
  statusType: 'pending' | 'ok' | 'error';
  number: string;
  dateFrom?: string;
  dateTo?: string;
  generatedAt?: string;
  completedAt?: string;
  duration?: string;
  columns?: string[];
  rows?: string[][];
  attachments?: { name: string; size: string }[];
}

@Component({
  selector: 'app-internal-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './internal-reports.component.html',
  styleUrl: './internal-reports.component.scss',
})
export class InternalReportsComponent implements OnInit, OnDestroy {
  searchQuery = '';
  selectedReport: DAction | null = null;

  // ─── Дерево отчётов ──────────────────────────────────
  treeNodes: DAction[] = [];      // корневые узлы (без parentId)
  isLoadingTree = true;

  // ─── Модал с датами ──────────────────────────────────
  showDateModal = false;
  pendingReport: DAction | null = null;
  dateFrom = '';
  dateTo   = '';
  dateError = '';
  isGenerating = false;

  // ─── Toast ───────────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' } | null = null;

  // ─── Модал с результатом отчёта ──────────────────────
  showReportModal = false;
  activeReport: StatusRow | null = null;

  // ─── Таблица статусов ────────────────────────────────
  statusRows: StatusRow[] = [];

  private reportCounter = 100;
  private pollingTimers: ReturnType<typeof setInterval>[] = [];
  private readonly STORAGE_KEY = 'internal_reports_status_rows';

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private reportService: ReportService
  ) {}

  ngOnInit() {
    this.loadFromStorage();
    this.loadTree();
  }

  ngOnDestroy() {
    this.pollingTimers.forEach(t => clearInterval(t));
  }

  // ─── Загрузка дерева отчётов из API ──────────────────
  loadTree() {
    this.isLoadingTree = true;
    this.reportService.getActions().subscribe({
      next: (actions) => {
        this.treeNodes = this._buildTree(actions, null);
        this.isLoadingTree = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingTree = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Строим дерево из плоского списка ────────────────
  private _buildTree(all: DAction[], parentId: number | null): DAction[] {
    return all
      .filter(a => a.parentId === parentId)
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
      .map(a => ({
        ...a,
        expanded: false,
        children: a.actionType === 1 ? this._buildTree(all, a.id) : [],
      }));
  }

  // ─── Фильтрация дерева по поиску ─────────────────────
  get filteredTree(): DAction[] {
    if (!this.searchQuery.trim()) return this.treeNodes;
    const q = this.searchQuery.toLowerCase();
    return this._filterTree(this.treeNodes, q);
  }

  private _filterTree(nodes: DAction[], q: string): DAction[] {
    const result: DAction[] = [];
    for (const node of nodes) {
      if (node.nameRus.toLowerCase().includes(q)) {
        result.push(node);
      } else if (node.children?.length) {
        const filteredChildren = this._filterTree(node.children, q);
        if (filteredChildren.length) {
          result.push({ ...node, expanded: true, children: filteredChildren });
        }
      }
    }
    return result;
  }

  // ─── Клик по узлу дерева ─────────────────────────────
  onNodeClick(node: DAction) {
    if (node.actionType === 1) {
      // Папка — раскрыть/свернуть
      node.expanded = !node.expanded;
    } else {
      // Отчёт — открыть модал с датами
      this.openDateModal(node);
    }
  }

  // ─── Открыть модал с датами ──────────────────────────
  openDateModal(item: DAction) {
    this.pendingReport = item;
    this.selectedReport = item;
    this.dateFrom  = '';
    this.dateTo    = '';
    this.dateError = '';
    this.showDateModal = true;
  }

  closeDateModal() {
    this.showDateModal = false;
    this.pendingReport = null;
  }

  // ─── Сформировать отчёт ──────────────────────────────
  generateReport() {
    if (!this.dateFrom || !this.dateTo) {
      this.dateError = 'Пожалуйста, укажите обе даты.';
      return;
    }
    if (new Date(this.dateFrom) > new Date(this.dateTo)) {
      this.dateError = 'Дата «с» не может быть позже даты «по».';
      return;
    }

    this.dateError   = '';
    this.isGenerating = true;

    const req: OrderRequest = {
      idReport: this.pendingReport!.id,
      empId:    1, // TODO: брать из сессии пользователя
      params:   '',
      begDate:  this.dateFrom,
      endDate:  this.dateTo,
    };

    const now = new Date();
    const tempRow: StatusRow = {
      orderId:     0,
      name:        this.pendingReport!.nameRus,
      date:        this._formatDateTime(now),
      statusLabel: 'Формируется...',
      statusType:  'pending',
      number:      String(++this.reportCounter),
      dateFrom:    this._formatDate(this.dateFrom),
      dateTo:      this._formatDate(this.dateTo),
      generatedAt: this._formatDateTime(now),
    };
    this.statusRows.unshift(tempRow);
    this.closeDateModal();

    // POST /api/reports/order
    this.reportService.createOrder(req).subscribe({
      next: (order) => {
        this.ngZone.run(() => {
          tempRow.orderId = order.id;

          if (order.status === 1) {
            // Готов сразу (мок или быстрый бэк)
            this._applyOrderResult(tempRow, order);
          } else {
            // Статус 0 — запускаем поллинг
            this._startPolling(tempRow);
          }

          this.isGenerating = false;
          this.saveToStorage();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          tempRow.statusLabel = 'Ошибка формирования';
          tempRow.statusType  = 'error';
          this.isGenerating   = false;
          this.saveToStorage();
          this.showToast('Ошибка при формировании отчёта', 'error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ─── Поллинг статуса ─────────────────────────────────
  private _startPolling(row: StatusRow) {
    const timer = setInterval(() => {
      this.reportService.getOrder(row.orderId).subscribe({
        next: (order) => {
          if (order.status === 1 || order.status === 2) {
            clearInterval(timer);
            this.ngZone.run(() => {
              this._applyOrderResult(row, order);
              this.saveToStorage();
              this.cdr.detectChanges();
            });
          }
        }
      });
    }, 2000);
    this.pollingTimers.push(timer);
  }

  // ─── Применить результат заказа ──────────────────────
  private _applyOrderResult(row: StatusRow, order: any) {
    const completedAt = new Date();
    row.completedAt = this._formatDateTime(completedAt);
    row.duration    = '2 секунды';

    if (order.status === 2 || order.err) {
      row.statusLabel = 'Ошибка формирования';
      row.statusType  = 'error';
      this.showToast(`Ошибка формирования отчёта "${row.name}"`, 'error');
      return;
    }

    // Парсим JSON с данными отчёта
    // Формат: { columns: string[], rows: string[][] }
    try {
      if (order.report) {
        const parsed = JSON.parse(order.report);
        row.columns = parsed.columns ?? [];
        row.rows    = parsed.rows    ?? [];
      }
    } catch {
      row.columns = [];
      row.rows    = [];
    }

    const hasData = (row.rows?.length ?? 0) > 0;
    row.statusLabel = hasData ? 'Отчет сформирован' : 'Отчет не сформирован';
    row.statusType  = hasData ? 'ok' : 'error';

    this.showToast(
      hasData
        ? `Отчет "${row.name}" успешно сформирован`
        : `За выбранный период данных не найдено`,
      hasData ? 'success' : 'error'
    );
  }

  // ─── Открыть модал с результатом ─────────────────────
  openReportModal(row: StatusRow) {
    if (!row.columns || !row.rows) return;
    this.activeReport    = row;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.activeReport    = null;
  }

  deleteRow(event: Event, index: number) {
    event.stopPropagation();
    this.statusRows.splice(index, 1);
    this.saveToStorage();
  }

  // ─── Экспорт в Excel ─────────────────────────────────
  async exportReport() {
    if (!this.activeReport) return;
    const report  = this.activeReport;
    const columns = report.columns ?? [];
    const rows    = report.rows    ?? [];

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Отчет');

    const titleRow = worksheet.addRow([report.name]);
    titleRow.getCell(1).font = { bold: true, size: 13 };
    worksheet.addRow([`Период: с ${report.dateFrom} по ${report.dateTo}`]);
    worksheet.addRow([`Дата формирования: ${report.generatedAt}`]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(columns);
    headerRow.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3AAA73' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border    = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 40;

    rows.forEach((rowData, i) => {
      const row = worksheet.addRow(rowData);
      row.eachCell(cell => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' } };
        cell.alignment = { vertical: 'middle' };
        cell.border    = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      row.height = 22;
    });
    worksheet.columns.forEach(col => { col.width = 24; });

    const buffer   = await workbook.xlsx.writeBuffer();
    const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `${report.name}_${report.dateFrom}_${report.dateTo}.xlsx`.replace(/[/\\:*?"<>|]/g, '_');
    saveAs(blob, fileName);
  }

  // ─── Печать ──────────────────────────────────────────
  printReport() {
    if (!this.activeReport) return;
    const report  = this.activeReport;
    const columns = report.columns ?? [];
    const rows    = report.rows    ?? [];
    const tableRows = rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    const html = `<html><head><title>${report.name}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
      h2{font-size:15px;margin-bottom:4px}p{margin:2px 0;color:#555;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:14px}
      th{background:#3aaa73;color:#fff;padding:7px 8px;text-align:left;font-size:11px}
      td{padding:6px 8px;border-bottom:1px solid #e5e8ec;font-size:11px}
      tr:nth-child(even) td{background:#f9fafb}</style></head><body>
      <h2>${report.name}</h2>
      <p>Период: с ${report.dateFrom} по ${report.dateTo}</p>
      <p>Дата формирования: ${report.generatedAt}</p>
      <table><thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody></table></body></html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 300); }
  }

  // ─── Прикрепить файл ─────────────────────────────────
  attachFile(event: Event) {
    if (!this.activeReport) return;
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    if (!this.activeReport.attachments) this.activeReport.attachments = [];
    Array.from(input.files).forEach((file: File) => {
      const size = file.size < 1024 ? `${file.size} Б`
        : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} КБ`
        : `${(file.size / 1024 / 1024).toFixed(1)} МБ`;
      this.activeReport!.attachments!.push({ name: file.name, size });
    });
    this.saveToStorage();
    this.showToast('Файл прикреплён', 'success');
    input.value = '';
  }

  removeAttachment(fileName: string) {
    if (!this.activeReport?.attachments) return;
    this.activeReport.attachments = this.activeReport.attachments.filter(f => f.name !== fileName);
    this.saveToStorage();
  }

  // ─── Toast ───────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    setTimeout(() => { this.toast = null; this.cdr.detectChanges(); }, 3500);
  }

  // ─── LocalStorage ────────────────────────────────────
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) this.statusRows = JSON.parse(saved);
    } catch { this.statusRows = []; }
  }

  saveToStorage() {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.statusRows)); } catch {}
  }

  // ─── Helpers ─────────────────────────────────────────
  private _formatDateTime(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  private _formatDate(iso: string): string {
    const [y, m, day] = iso.split('-');
    return `${day}.${m}.${y}`;
  }
}