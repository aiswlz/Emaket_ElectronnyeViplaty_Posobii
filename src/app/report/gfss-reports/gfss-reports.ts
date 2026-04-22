import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GfssReportsService, DAction, OrderRequest } from './gfss-reports.service';

export interface StatusRow {
  orderId: number;
  name: string;
  date: string;
  statusLabel: string;
  statusType: 'pending' | 'ok' | 'error';
  number: string;
  generatedAt?: string;
  completedAt?: string;
  duration?: string;
  // ← теперь храним HTML вместо columns/rows
  htmlReport?: string;
  attachments?: { name: string; size: string }[];
}

@Component({
  selector: 'app-gfss-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gfss-reports.html',
  styleUrl: './gfss-reports.scss',
  encapsulation: ViewEncapsulation.None
})
export class GfssReportsComponent implements OnInit, OnDestroy {
  searchQuery = '';
  selectedReport: DAction | null = null;

  treeNodes: DAction[] = [];
  isLoadingTree = true;

  showDateModal = false;
  pendingReport: DAction | null = null;
  dateError = '';
  isGenerating = false;

  toast: { message: string; type: 'success' | 'error' } | null = null;

  showReportModal = false;
  activeReport: StatusRow | null = null;
  activeReportHtml: SafeHtml | null = null;

  statusRows: StatusRow[] = [];

  private reportCounter = 100;
  private pollingTimers: ReturnType<typeof setInterval>[] = [];
  private readonly STORAGE_KEY = 'gfss_reports_status_rows';

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private reportService: GfssReportsService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadFromStorage();
    this.loadTree();
  }

  ngOnDestroy(): void {
    this.pollingTimers.forEach(t => clearInterval(t));
  }

  // ─── Дерево ───────────────────────────────────────────────────────────────

  loadTree(): void {
    this.isLoadingTree = true;
    this.reportService.getActions().subscribe({
      next: (actions: any[]) => {
        const mapped: DAction[] = actions.map(a => ({
          id:         a.id,
          actionType: a.actionType ?? a.action_type ?? 3,
          nameRus:    a.nameRus    ?? a.name_rus    ?? '',
          nameKaz:    a.nameKaz    ?? a.name_kaz    ?? '',
          parentId:   a.parentId   ?? a.parent_id   ?? null,
          typeRep:    a.typeRep    ?? a.type_rep     ?? null,
          repId:      a.repId      ?? a.rep_id       ?? null,
          cmd:        a.cmd        ?? null,
          async:      a.async      ?? null,
          maskId:     a.maskId     ?? a.mask_id      ?? null,
          lev1:       a.lev1       ?? null,
          lev1Kz:     a.lev1Kz    ?? a.lev1_kz      ?? null,
          ord:        a.ord        ?? 0,
        }));
        this.treeNodes = this._buildTree(mapped, null);
        this.isLoadingTree = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingTree = false;
        this.cdr.detectChanges();
      }
    });
  }

  private _buildTree(all: DAction[], parentId: number | null): DAction[] {
    return all
      .filter(a => a.parentId === parentId)
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
      .map(a => ({
        ...a,
        expanded: false,
        children: this._buildTree(all, a.id),
      }));
  }

  get filteredTree(): DAction[] {
    if (!this.searchQuery.trim()) return this.treeNodes;
    return this._filterTree(this.treeNodes, this.searchQuery.toLowerCase());
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

  onNodeClick(node: DAction): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
    } else {
      this.openDateModal(node);
    }
  }

  // ─── Модал с параметрами ──────────────────────────────────────────────────

  openDateModal(item: DAction): void {
    this.pendingReport = item;
    this.selectedReport = item;
    this.dateError = '';
    this.showDateModal = true;

    setTimeout(() => {
      const container = document.getElementById('lev1-container');
      if (!container) return;

      if (item.lev1) {
        // Рендерим lev1 маску из БД (select, input и т.д.)
        container.innerHTML = item.lev1;
      } else {
        // Нет маски — показываем стандартный диапазон дат
        container.innerHTML = `
          <table>
            <tr>
              <td style="padding-right:12px">Дата с</td>
              <td><input name="bdat" type="date" style="border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:13px"></td>
            </tr>
            <tr style="margin-top:8px">
              <td style="padding-right:12px">Дата по</td>
              <td><input name="edat" type="date" style="border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:13px"></td>
            </tr>
          </table>`;
      }
    }, 50);
  }

  /** Собирает все input/select из lev1 формы в строку "key=val&key2=val2" */
  private collectParams(): string {
    const container = document.getElementById('lev1-container');
    if (!container) return '';
    const params: string[] = [];
    container.querySelectorAll('input, select').forEach((el: any) => {
      if (el.name && el.value) {
        params.push(`${el.name}=${el.value}`);
      }
    });
    return params.join('&');
  }

  closeDateModal(): void {
    this.showDateModal = false;
    this.pendingReport = null;
  }

  // ─── Формирование отчёта ──────────────────────────────────────────────────

  generateReport(): void {
    this.dateError    = '';
    this.isGenerating = true;

    const params = this.collectParams();

    const req: OrderRequest = {
      idReport: this.pendingReport!.id,
      empId:    1,
      params,
      begDate:  '',
      endDate:  '',
    };

    const now = new Date();
    const tempRow: StatusRow = {
      orderId:     0,
      name:        this.pendingReport!.nameRus,
      date:        this._formatDateTime(now),
      statusLabel: 'Формируется...',
      statusType:  'pending',
      number:      String(++this.reportCounter),
      generatedAt: this._formatDateTime(now),
    };
    this.statusRows.unshift(tempRow);
    this.closeDateModal();

    this.reportService.createOrder(req).subscribe({
      next: (order) => {
        this.ngZone.run(() => {
          tempRow.orderId = order.id;
          if (order.status === 1 || order.status === 2) {
            this._applyOrderResult(tempRow, order);
          } else {
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

  private _startPolling(row: StatusRow): void {
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

  /**
   * Применяет результат заказа к строке статуса.
   *
   * Бэк возвращает report в виде: {"result":1,"html":"<table>..."}
   * Мы извлекаем html и сохраняем в row.htmlReport
   */
  private _applyOrderResult(row: StatusRow, order: any): void {
    row.completedAt = this._formatDateTime(new Date());
    row.duration    = '2 секунды';

    // Статус 2 — нет данных или ошибка
    if (order.status === 2) {
      const noData = order.err?.includes('отсутствуют');
      row.statusLabel = noData ? 'Отчет не сформирован' : 'Ошибка формирования';
      row.statusType  = 'error';
      this.showToast(
        noData
          ? 'Данные за выбранный период отсутствуют'
          : `Ошибка формирования отчёта "${row.name}"`,
        'error'
      );
      return;
    }

    // Статус успех — извлекаем HTML из поля report
    if (order.report) {
      try {
        const parsed = JSON.parse(order.report);

        if (parsed.html) {
          // Наш формат: {"result":1,"html":"..."}
          row.htmlReport  = parsed.html;
          row.statusLabel = 'Отчет сформирован';
          row.statusType  = 'ok';
          this.showToast(`Отчёт "${row.name}" успешно сформирован`, 'success');
          return;
        }

        if (parsed.columns && parsed.rows) {
          // Старый формат с массивами — конвертируем в HTML таблицу
          row.htmlReport  = this._buildHtmlTable(parsed.columns, parsed.rows, row.name);
          row.statusLabel = parsed.rows.length > 0 ? 'Отчет сформирован' : 'Данные не найдены';
          row.statusType  = parsed.rows.length > 0 ? 'ok' : 'error';
          this.showToast(
            parsed.rows.length > 0 ? `Отчёт "${row.name}" сформирован` : 'Данные не найдены',
            parsed.rows.length > 0 ? 'success' : 'error'
          );
          return;
        }
      } catch {
        // Если парсинг не удался — показываем как есть
        row.htmlReport  = `<pre>${order.report}</pre>`;
        row.statusLabel = 'Отчет сформирован';
        row.statusType  = 'ok';
        return;
      }
    }

    // Нет данных
    row.statusLabel = 'Данные не найдены';
    row.statusType  = 'error';
    this.showToast('За выбранный период данных не найдено', 'error');
  }

  // ─── Просмотр отчёта ──────────────────────────────────────────────────────

  openReportModal(row: StatusRow): void {
    if (!row.htmlReport) return;
    this.activeReport     = row;
    this.activeReportHtml = this.sanitizer.bypassSecurityTrustHtml(row.htmlReport);
    this.showReportModal  = true;
  }

  closeReportModal(): void {
    this.showReportModal  = false;
    this.activeReport     = null;
    this.activeReportHtml = null;
  }

  deleteRow(event: Event, index: number): void {
    event.stopPropagation();
    this.statusRows.splice(index, 1);
    this.saveToStorage();
  }

  // ─── Печать ───────────────────────────────────────────────────────────────

  printReport(): void {
    if (!this.activeReport?.htmlReport) return;
    const html = `
      <html><head><title>${this.activeReport.name}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        h2   { font-size: 15px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { background: #3aaa73; color: #fff; padding: 7px 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #e5e8ec; }
        tr:nth-child(even) td { background: #f9fafb; }
      </style></head>
      <body>
        <h2>${this.activeReport.name}</h2>
        <p>Дата формирования: ${this.activeReport.generatedAt}</p>
        ${this.activeReport.htmlReport}
      </body></html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    }
  }

  // ─── Экспорт в Excel (из HTML таблицы) ───────────────────────────────────

  exportReport(): void {
    if (!this.activeReport?.htmlReport) return;

    // Парсим HTML таблицу в массивы
    const parser = new DOMParser();
    const doc    = parser.parseFromString(this.activeReport.htmlReport, 'text/html');
    const table  = doc.querySelector('table');
    if (!table) { this.showToast('Нет данных для экспорта', 'error'); return; }

    const headers: string[] = [];
    const rows: string[][]  = [];

    table.querySelectorAll('thead tr th').forEach(th => headers.push(th.textContent?.trim() ?? ''));
    table.querySelectorAll('tbody tr').forEach(tr => {
      const row: string[] = [];
      tr.querySelectorAll('td').forEach(td => row.push(td.textContent?.trim() ?? ''));
      if (row.length > 0) rows.push(row);
    });

    // Генерируем CSV (простой экспорт без ExcelJS зависимости)
    const sep  = ';';
    const bom  = '\uFEFF';
    const csv  = bom + [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(sep)).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${this.activeReport.name}_${this.activeReport.generatedAt?.replace(/[: ]/g, '_') ?? 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.showToast('Экспорт выполнен', 'success');
  }

  // ─── Прикрепить файл ─────────────────────────────────────────────────────

  attachFile(event: Event): void {
    if (!this.activeReport) return;
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    if (!this.activeReport.attachments) this.activeReport.attachments = [];
    Array.from(input.files).forEach((file: File) => {
      const size = file.size < 1024 ? `${file.size} Б`
        : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} КБ`
        : `${(file.size / 1048576).toFixed(1)} МБ`;
      this.activeReport!.attachments!.push({ name: file.name, size });
    });
    this.saveToStorage();
    this.showToast('Файл прикреплён', 'success');
    input.value = '';
  }

  removeAttachment(fileName: string): void {
    if (!this.activeReport?.attachments) return;
    this.activeReport.attachments = this.activeReport.attachments.filter(f => f.name !== fileName);
    this.saveToStorage();
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => { this.toast = null; this.cdr.detectChanges(); }, 3500);
  }

  // ─── LocalStorage ─────────────────────────────────────────────────────────

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) this.statusRows = JSON.parse(saved);
    } catch { this.statusRows = []; }
  }

  saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.statusRows));
    } catch {}
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _buildHtmlTable(columns: string[], rows: string[][], title: string): string {
    const ths  = columns.map(c => `<th>${c}</th>`).join('');
    const trs  = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<p><b>${title}</b></p>
      <table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;width:100%">
        <thead><tr style="background:#d0e4f7">${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>`;
  }

  private _formatDateTime(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
}