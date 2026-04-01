import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ReportItem {
  id: number;
  name: string;
  iconType: 'file' | 'folder';
  hasPlus?: boolean;
}

export interface StatusRow {
  name: string;
  date: string;
  statusLabel: string;
  statusType: 'error' | 'ok';
  number: string;
  // Extended for full report view
  dateFrom?: string;
  dateTo?: string;
  generatedAt?: string;
  completedAt?: string;
  duration?: string;
  columns?: string[];
  rows?: string[][];
  attachments?: { name: string; size: string }[];
}

// ─── Mock JSON that would come from backend ───────────────
// Колонки остаются фиксированными — их определяет тип отчета
const MOCK_COLUMNS = [
  '№ п/п',
  'Дата действия',
  'Специалист',
  'Вид основания',
  'Код отд.',
  'Дата назначения',
  'Дата утверждения',
  'Тип заявления',
  'ИИН',
  'ФИО',
  'Кол-во строк стажа',
  'Кол-во стажа при перев. назначении',
  'Кол-во стажа после пересмотра/нового назначения',
];

// Все строки из "базы" — при реальном API сервер сам фильтрует по дате
const MOCK_ALL_ROWS: { date: Date; row: string[] }[] = [
  { date: new Date('2024-01-10'), row: ['', '10.01.2024 09:00:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '10.01.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '21 г. 8 м. 5 д.',  '7 г. 7 м. 2 д.'] },
  { date: new Date('2024-02-14'), row: ['', '14.02.2024 11:20:00', 'Балмагамбет С.Р.',  '180 000.00',    '1801', '14.02.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '63 г. 0 м. 0 д.',  '63 г. 0 м. 0 д.'] },
  { date: new Date('2024-03-05'), row: ['', '05.03.2024 14:15:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '05.03.2024', '', 'NEW - Назначение',  '123456789012', 'Петров Сергей Иванович',   '2', '15 г. 3 м. 0 д.',  '15 г. 3 м. 0 д.'] },
  { date: new Date('2024-04-22'), row: ['', '22.04.2024 10:05:00', 'Сейткали А.Б.',     '180 000.00',    '1502', '22.04.2024', '', 'REC - Перерасчет',  '987654321098', 'Ахметова Гульнара',        '4', '30 г. 1 м. 10 д.', '30 г. 1 м. 10 д.'] },
  { date: new Date('2024-05-18'), row: ['', '18.05.2024 08:45:00', 'Балмагамбет С.Р.',  '12 - базовая',  '1801', '18.05.2024', '', 'NEW - Назначение',  '112233445566', 'Джаксыбеков Нурлан',       '1', '5 г. 0 м. 0 д.',   '5 г. 0 м. 0 д.'] },
  { date: new Date('2024-06-30'), row: ['', '30.06.2024 16:00:00', 'Кальбергенов Н.Г.', '180 000.00',    '1507', '30.06.2024', '', 'REC - Перерасчет',  '223344556677', 'Байжанова Айгерим',        '3', '22 г. 5 м. 3 д.',  '22 г. 5 м. 3 д.'] },
  { date: new Date('2024-07-25'), row: ['', '25.07.2024 16:43:24', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '25.07.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '21 г. 8 м. 5 д.',  '7 г. 7 м. 2 д.'] },
  { date: new Date('2024-07-26'), row: ['', '26.07.2024 09:36:04', 'Балмагамбет С.Р.',  '180 000.00',    '1801', '26.07.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '63 г. 0 м. 0 д.',  '63 г. 0 м. 0 д.'] },
  { date: new Date('2024-08-12'), row: ['', '12.08.2024 13:10:00', 'Сейткали А.Б.',     '12 - базовая',  '1502', '12.08.2024', '', 'NEW - Назначение',  '334455667788', 'Омаров Бауыржан',          '2', '10 г. 2 м. 15 д.', '10 г. 2 м. 15 д.'] },
  { date: new Date('2024-09-03'), row: ['', '03.09.2024 09:00:00', 'Кальбергенов Н.Г.', '180 000.00',    '1507', '03.09.2024', '', 'REC - Перерасчет',  '445566778899', 'Нурмаганбетова Салтанат',  '5', '40 г. 0 м. 0 д.',  '40 г. 0 м. 0 д.'] },
  { date: new Date('2024-10-17'), row: ['', '17.10.2024 15:30:00', 'Балмагамбет С.Р.',  '12 - базовая',  '1801', '17.10.2024', '', 'NEW - Назначение',  '556677889900', 'Сатпаев Ержан',            '1', '3 г. 6 м. 0 д.',   '3 г. 6 м. 0 д.'] },
  { date: new Date('2024-11-28'), row: ['', '28.11.2024 11:00:00', 'Сейткали А.Б.',     '180 000.00',    '1502', '28.11.2024', '', 'REC - Перерасчет',  '667788990011', 'Касымова Динара',          '4', '28 г. 9 м. 20 д.', '28 г. 9 м. 20 д.'] },
  { date: new Date('2024-12-20'), row: ['', '20.12.2024 14:00:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '20.12.2024', '', 'NEW - Назначение',  '778899001122', 'Абенов Марат',             '2', '12 г. 0 м. 5 д.',  '12 г. 0 м. 5 д.'] },
  { date: new Date('2025-01-15'), row: ['', '15.01.2025 10:20:00', 'Балмагамбет С.Р.',  '180 000.00',    '1801', '15.01.2025', '', 'REC - Перерасчет',  '889900112233', 'Жумабаева Меруерт',        '3', '18 г. 4 м. 0 д.',  '18 г. 4 м. 0 д.'] },
  { date: new Date('2025-02-08'), row: ['', '08.02.2025 09:45:00', 'Сейткали А.Б.',     '12 - базовая',  '1502', '08.02.2025', '', 'NEW - Назначение',  '990011223344', 'Турсынов Ансар',           '1', '7 г. 11 м. 3 д.',  '7 г. 11 м. 3 д.'] },
  { date: new Date('2025-03-20'), row: ['', '20.03.2025 16:15:00', 'Кальбергенов Н.Г.', '180 000.00',    '1507', '20.03.2025', '', 'REC - Перерасчет',  '001122334455', 'Бекова Алия',              '4', '35 г. 2 м. 18 д.', '35 г. 2 м. 18 д.'] },
  { date: new Date('2026-01-10'), row: ['', '10.01.2026 08:30:00', 'Балмагамбет С.Р.',  '12 - базовая',  '1801', '10.01.2026', '', 'NEW - Назначение',  '111222333444', 'Исаев Тимур',              '2', '9 г. 5 м. 0 д.',   '9 г. 5 м. 0 д.'] },
  { date: new Date('2026-02-14'), row: ['', '14.02.2026 12:00:00', 'Сейткали А.Б.',     '180 000.00',    '1502', '14.02.2026', '', 'REC - Перерасчет',  '222333444555', 'Данияров Алишер',          '3', '25 г. 0 м. 12 д.', '25 г. 0 м. 12 д.'] },
  { date: new Date('2026-03-05'), row: ['', '05.03.2026 10:10:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '05.03.2026', '', 'NEW - Назначение',  '333444555666', 'Мусина Зарина',            '1', '4 г. 8 м. 25 д.',  '4 г. 8 м. 25 д.'] },
  { date: new Date('2026-03-18'), row: ['', '18.03.2026 14:50:00', 'Балмагамбет С.Р.',  '180 000.00',    '1801', '18.03.2026', '', 'REC - Перерасчет',  '444555666777', 'Рахимов Санжар',           '5', '50 г. 0 м. 0 д.',  '50 г. 0 м. 0 д.'] },
  { date: new Date('2026-03-25'), row: ['', '25.03.2026 09:00:00', 'Сейткали А.Б.',     '12 - базовая',  '1502', '25.03.2026', '', 'NEW - Назначение',  '555666777888', 'Смагулова Камила',         '2', '16 г. 3 м. 7 д.',  '16 г. 3 м. 7 д.'] },
  { date: new Date('2026-03-28'), row: ['', '28.03.2026 11:30:00', 'Кальбергенов Н.Г.', '180 000.00',    '1507', '28.03.2026', '', 'REC - Перерасчет',  '666777888999', 'Токтаров Нурбол',          '3', '33 г. 7 м. 0 д.',  '33 г. 7 м. 0 д.'] },
  { date: new Date('2026-03-31'), row: ['', '31.03.2026 08:00:00', 'Балмагамбет С.Р.',  '12 - базовая',  '1801', '31.03.2026', '', 'NEW - Назначение',  '777888999000', 'Алиева Назгуль',           '1', '2 г. 1 м. 14 д.',  '2 г. 1 м. 14 д.'] },
];

// Фильтрует mock-строки по выбранному диапазону дат
function getMockRows(dateFrom: string, dateTo: string): string[][] {
  const from = new Date(dateFrom);
  const to   = new Date(dateTo);
  to.setHours(23, 59, 59); // включаем последний день полностью

  const filtered = MOCK_ALL_ROWS.filter(r => r.date >= from && r.date <= to);
  // Перенумеровываем строки
  return filtered.map((r, i) => {
    const row = [...r.row];
    row[0] = String(i + 1);
    return row;
  });
}

@Component({
  selector: 'app-internal-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './internal-reports.component.html',
  styleUrl: './internal-reports.component.scss',
})
export class InternalReportsComponent implements OnInit {
  searchQuery = '';
  selectedReport: ReportItem | null = null;

  // ─── Date modal state ─────────────────────────────────
  showDateModal = false;
  pendingReport: ReportItem | null = null;
  dateFrom = '';
  dateTo = '';
  dateError = '';
  isGenerating = false;

  // ─── Toast notification ───────────────────────────
  toast: { message: string; type: 'success' | 'error' } | null = null;

  // ─── Full report modal state ──────────────────────────
  showReportModal = false;
  activeReport: StatusRow | null = null;

  // ─── Report list ──────────────────────────────────────
  allReports: ReportItem[] = [
    // ── Конкретные отчеты (файлы) ──────────────────────────
    { id: 1,  name: 'Мониторинговые списки',                                 iconType: 'file' },
    { id: 2,  name: 'Список ЭМД с просроченными сроками в отделении',        iconType: 'file' },
    { id: 3,  name: '10 - Электронные уведомления',                          iconType: 'file' },
    { id: 4,  name: '11 - Движение по электронным уведомлениям',             iconType: 'file' },
    { id: 5,  name: 'Реестр назначенных пенсионных выплат',                  iconType: 'file' },
    { id: 6,  name: 'Список получателей базовой пенсии',                     iconType: 'file' },
    { id: 7,  name: 'Список получателей по инвалидности',                    iconType: 'file' },
    { id: 8,  name: 'Отчет по перерасчету выплат',                           iconType: 'file' },
    { id: 9,  name: 'Реестр приостановленных выплат',                        iconType: 'file' },
    { id: 10, name: 'Список заявлений на назначение пособий',                iconType: 'file' },
    // ── Группы отчетов (папки) ─────────────────────────────
    { id: 11, name: '110 - Отчеты для центрального офиса',                   iconType: 'folder', hasPlus: true },
    { id: 12, name: 'Ежемесячные сводные отчеты',                            iconType: 'folder', hasPlus: true },
    { id: 13, name: 'Квартальные отчеты',                                    iconType: 'folder', hasPlus: true },
    { id: 14, name: 'Архивные отчеты',                                       iconType: 'folder', hasPlus: true },
  ];

  filteredReports: ReportItem[] = [];

  // ─── Status table rows ────────────────────────────────
  statusRows: StatusRow[] = [];

  // ─── Counter for № ───────────────────────────────────
  private reportCounter = 100;

  private readonly STORAGE_KEY = 'internal_reports_status_rows';

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {
    this.filteredReports = [...this.allReports];
    this.loadFromStorage();
  }

  // ─── LocalStorage ─────────────────────────────────────
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.statusRows = JSON.parse(saved);
      }
    } catch {
      this.statusRows = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.statusRows));
    } catch {
      console.error('Не удалось сохранить в localStorage');
    }
  }

  // ─── Filtered list ────────────────────────────────────
  get filteredReportsList(): ReportItem[] {
    if (!this.searchQuery.trim()) return this.allReports;
    return this.allReports.filter(r =>
      r.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  ngDoCheck() {
    this.filteredReports = this.filteredReportsList;
  }

  // ─── Open date-picker modal ───────────────────────────
  openDateModal(item: ReportItem) {
    this.pendingReport = item;
    this.selectedReport = item;
    this.dateFrom = '';
    this.dateTo = '';
    this.dateError = '';
    this.showDateModal = true;
  }

  closeDateModal() {
    this.showDateModal = false;
    this.pendingReport = null;
  }

  // ─── Generate report → add row to table ──────────────
  generateReport() {
    // Validation
    if (!this.dateFrom || !this.dateTo) {
      this.dateError = 'Пожалуйста, укажите обе даты.';
      return;
    }
    if (new Date(this.dateFrom) > new Date(this.dateTo)) {
      this.dateError = 'Дата «с» не может быть позже даты «по».';
      return;
    }

    this.dateError = '';
    this.isGenerating = true;

    // Simulate API call delay (replace with real HTTP call)
    setTimeout(() => {
      this.ngZone.run(() => {
      this.isGenerating = false;

      const now = new Date();
      const dateStr = this.formatDateTime(now);
      const completedNow = new Date(now.getTime() + 2000);

      // Parse mock JSON (would be response.data from HTTP)
      // Фильтруем mock данные по выбранному периоду.
      // При реальном API замени на:
      // const json = await this.http.get('/api/reports/generate', {
      //   params: { reportId: this.pendingReport!.id, dateFrom: this.dateFrom, dateTo: this.dateTo }
      // }).toPromise();
      const filteredRows = getMockRows(this.dateFrom, this.dateTo);
      const statusType = filteredRows.length > 0 ? 'ok' : 'error';
      const statusLabel = filteredRows.length > 0 ? 'Отчет сформирован' : 'Отчет не сформирован';

      const newRow: StatusRow = {
        name: this.pendingReport!.name,
        date: dateStr,
        statusLabel,
        statusType,
        number: String(++this.reportCounter),
        dateFrom: this.formatDate(this.dateFrom),
        dateTo: this.formatDate(this.dateTo),
        generatedAt: dateStr,
        completedAt: this.formatDateTime(completedNow),
        duration: '2 секунды',
        columns: MOCK_COLUMNS,
        rows: filteredRows,
      };

      this.statusRows.unshift(newRow);
      this.saveToStorage();
      this.closeDateModal();
      this.showToast(
        filteredRows.length > 0
          ? `Отчет "${newRow.name}" успешно сформирован`
          : `За выбранный период данных не найдено`,
        filteredRows.length > 0 ? 'success' : 'error'
      );
      this.cdr.detectChanges();
      }); // end ngZone.run
    }, 1200);
  }

  // ─── Open full report modal ───────────────────────────
  openReportModal(row: StatusRow) {
    if (!row.columns || !row.rows) return;
    this.activeReport = row;
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
    this.activeReport = null;
  }

  // ─── Delete row ───────────────────────────────────────
  deleteRow(event: Event, index: number) {
    event.stopPropagation();
    this.statusRows.splice(index, 1);
    this.saveToStorage();
  }

  // ─── Export to Excel (ExcelJS) ───────────────────────
  async exportReport() {
    if (!this.activeReport) return;

    const report  = this.activeReport;
    const columns = report.columns ?? [];
    const rows    = report.rows    ?? [];

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Отчет');

    // Мета-информация
    const titleRow = worksheet.addRow([report.name]);
    titleRow.getCell(1).font = { bold: true, size: 13 };
    worksheet.addRow([`Период: с ${report.dateFrom} по ${report.dateTo}`]);
    worksheet.addRow([`Дата формирования: ${report.generatedAt}`]);
    worksheet.addRow([]);

    // Заголовки колонок
    const headerRow = worksheet.addRow(columns);
    headerRow.eachCell(cell => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3AAA73' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border    = {
        top:    { style: 'thin', color: { argb: 'FFD0D5DD' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D5DD' } },
        left:   { style: 'thin', color: { argb: 'FFD0D5DD' } },
        right:  { style: 'thin', color: { argb: 'FFD0D5DD' } },
      };
    });
    headerRow.height = 40;

    // Строки данных
    rows.forEach((rowData, i) => {
      const row = worksheet.addRow(rowData);
      const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB';
      row.eachCell(cell => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle' };
        cell.border    = {
          top:    { style: 'thin', color: { argb: 'FFE5E8EC' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E8EC' } },
          left:   { style: 'thin', color: { argb: 'FFE5E8EC' } },
          right:  { style: 'thin', color: { argb: 'FFE5E8EC' } },
        };
      });
      row.height = 22;
    });

    // Ширина колонок
    worksheet.columns.forEach(col => { col.width = 24; });

    // Скачиваем файл
    const buffer   = await workbook.xlsx.writeBuffer();
    const blob     = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `${report.name}_${report.dateFrom}_${report.dateTo}.xlsx`
      .replace(/[/\\:*?"<>|]/g, '_');

    saveAs(blob, fileName);
  }

  // ─── Печать отчёта ───────────────────────────────────
  printReport() {
    if (!this.activeReport) return;
    const report  = this.activeReport;
    const columns = report.columns ?? [];
    const rows    = report.rows    ?? [];

    const tableRows = rows.map(row =>
      `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');

    const html = `
      <html><head><title>${report.name}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
        h2   { font-size: 15px; margin-bottom: 4px; }
        p    { margin: 2px 0; color: #555; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th { background: #3aaa73; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e5e8ec; font-size: 11px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .meta { margin-bottom: 14px; }
      </style></head><body>
      <h2>${report.name}</h2>
      <div class="meta">
        <p>Период: с ${report.dateFrom} по ${report.dateTo}</p>
        <p>Дата формирования: ${report.generatedAt}</p>
      </div>
      <table>
        <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      </body></html>
    `;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
    }
  }

  // ─── Прикрепить файл ──────────────────────────────────
  attachFile(event: Event) {
    if (!this.activeReport) return;
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    if (!this.activeReport.attachments) {
      this.activeReport.attachments = [];
    }

    Array.from(input.files).forEach((file: File) => {
      const size = file.size < 1024
        ? `${file.size} Б`
        : file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(1)} КБ`
          : `${(file.size / 1024 / 1024).toFixed(1)} МБ`;

      this.activeReport!.attachments!.push({ name: file.name, size });
    });

    this.saveToStorage();
    this.showToast(`Файл прикреплён`, 'success');
    input.value = ''; // сброс input для повторного выбора того же файла
  }

  // ─── Удалить прикреплённый файл ───────────────────────
  removeAttachment(fileName: string) {
    if (!this.activeReport?.attachments) return;
    this.activeReport.attachments = this.activeReport.attachments.filter(f => f.name !== fileName);
    this.saveToStorage();
  }

  // ─── Toast ───────────────────────────────────────────
  showToast(message: string, type: 'success' | 'error') {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  // ─── Helpers ─────────────────────────────────────────
  private formatDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private formatDate(iso: string): string {
    const [y, m, day] = iso.split('-');
    return `${day}.${m}.${y}`;
  }
}