import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

export interface DAction {
  id: number;
  actionType: number;   // 1 = папка, 2 = отчёт
  nameRus: string;
  nameKaz: string;
  parentId: number | null;
  typeRep: string | null;
  ord: number;
  children?: DAction[]; // строится на фронте
  expanded?: boolean;   // состояние раскрытия папки
}

export interface OrderRequest {
  idReport: number;
  empId: number;
  params: string;
  begDate: string;  // yyyy-MM-dd
  endDate: string;  // yyyy-MM-dd
}

export interface OrderResponse {
  id: number;
  idReport: number;
  status: number;   // 0=в очереди, 1=готов, 2=ошибка
  report: string | null;  // JSON строка с данными
  err: string | null;
  dat: string;
}

// ─── Мок данные (заменить на реальный API когда бэк готов) ───────────────────
const MOCK_ACTIONS: DAction[] = [
  { id: 1,  actionType: 2, nameRus: 'Мониторинговые списки',                          nameKaz: '', parentId: null, typeRep: 'list', ord: 1 },
  { id: 2,  actionType: 2, nameRus: 'Список ЭМД с просроченными сроками в отделении', nameKaz: '', parentId: null, typeRep: 'list', ord: 2 },
  { id: 3,  actionType: 2, nameRus: '10 - Электронные уведомления',                   nameKaz: '', parentId: null, typeRep: 'list', ord: 3 },
  { id: 4,  actionType: 2, nameRus: '11 - Движение по электронным уведомлениям',      nameKaz: '', parentId: null, typeRep: 'list', ord: 4 },
  { id: 5,  actionType: 2, nameRus: 'Реестр назначенных пенсионных выплат',           nameKaz: '', parentId: null, typeRep: 'list', ord: 5 },
  { id: 6,  actionType: 2, nameRus: 'Список получателей базовой пенсии',              nameKaz: '', parentId: null, typeRep: 'list', ord: 6 },
  { id: 7,  actionType: 2, nameRus: 'Список получателей по инвалидности',             nameKaz: '', parentId: null, typeRep: 'list', ord: 7 },
  { id: 8,  actionType: 2, nameRus: 'Отчет по перерасчету выплат',                   nameKaz: '', parentId: null, typeRep: 'list', ord: 8 },
  { id: 9,  actionType: 2, nameRus: 'Реестр приостановленных выплат',                nameKaz: '', parentId: null, typeRep: 'list', ord: 9 },
  { id: 10, actionType: 2, nameRus: 'Список заявлений на назначение пособий',         nameKaz: '', parentId: null, typeRep: 'list', ord: 10 },
  // Папки
  { id: 11, actionType: 1, nameRus: '110 - Отчеты для центрального офиса', nameKaz: '', parentId: null, typeRep: null, ord: 11 },
  { id: 12, actionType: 1, nameRus: 'Ежемесячные сводные отчеты',          nameKaz: '', parentId: null, typeRep: null, ord: 12 },
  { id: 13, actionType: 1, nameRus: 'Квартальные отчеты',                  nameKaz: '', parentId: null, typeRep: null, ord: 13 },
  { id: 14, actionType: 1, nameRus: 'Архивные отчеты',                     nameKaz: '', parentId: null, typeRep: null, ord: 14 },
  // Дочерние отчёты внутри папок
  { id: 15, actionType: 2, nameRus: 'Сводный отчет за месяц',      nameKaz: '', parentId: 12, typeRep: 'list', ord: 1 },
  { id: 16, actionType: 2, nameRus: 'Динамика выплат по месяцам',  nameKaz: '', parentId: 12, typeRep: 'list', ord: 2 },
  { id: 17, actionType: 2, nameRus: 'Квартальный реестр пенсий',   nameKaz: '', parentId: 13, typeRep: 'list', ord: 1 },
  { id: 18, actionType: 2, nameRus: 'Архив 2023',                  nameKaz: '', parentId: 14, typeRep: 'list', ord: 1 },
  { id: 19, actionType: 2, nameRus: 'Архив 2024',                  nameKaz: '', parentId: 14, typeRep: 'list', ord: 2 },
];

const MOCK_COLUMNS = [
  '№ п/п', 'Дата действия', 'Специалист', 'Вид основания',
  'Код отд.', 'Дата назначения', 'Дата утверждения', 'Тип заявления',
  'ИИН', 'ФИО', 'Кол-во строк стажа',
  'Кол-во стажа при перев. назначении',
  'Кол-во стажа после пересмотра/нового назначения',
];

const MOCK_ALL_ROWS: { date: Date; row: string[] }[] = [
  { date: new Date('2024-01-10'), row: ['', '10.01.2024 09:00:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '10.01.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '21 г. 8 м. 5 д.',  '7 г. 7 м. 2 д.'] },
  { date: new Date('2024-02-14'), row: ['', '14.02.2024 11:20:00', 'Балмагамбет С.Р.',  '180 000.00',    '1801', '14.02.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '63 г. 0 м. 0 д.',  '63 г. 0 м. 0 д.'] },
  { date: new Date('2024-03-05'), row: ['', '05.03.2024 14:15:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '05.03.2024', '', 'NEW - Назначение',  '123456789012', 'Петров Сергей Иванович',   '2', '15 г. 3 м. 0 д.',  '15 г. 3 м. 0 д.'] },
  { date: new Date('2024-07-25'), row: ['', '25.07.2024 16:43:24', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '25.07.2024', '', 'REC - Перерасчет',  '590811300189', 'Фролов Игорь Юрьевич',    '3', '21 г. 8 м. 5 д.',  '7 г. 7 м. 2 д.'] },
  { date: new Date('2025-01-15'), row: ['', '15.01.2025 10:20:00', 'Балмагамбет С.Р.',  '180 000.00',    '1801', '15.01.2025', '', 'REC - Перерасчет',  '889900112233', 'Жумабаева Меруерт',        '3', '18 г. 4 м. 0 д.',  '18 г. 4 м. 0 д.'] },
  { date: new Date('2026-02-14'), row: ['', '14.02.2026 12:00:00', 'Сейткали А.Б.',     '180 000.00',    '1502', '14.02.2026', '', 'REC - Перерасчет',  '222333444555', 'Данияров Алишер',          '3', '25 г. 0 м. 12 д.', '25 г. 0 м. 12 д.'] },
  { date: new Date('2026-03-05'), row: ['', '05.03.2026 10:10:00', 'Кальбергенов Н.Г.', '12 - базовая',  '1507', '05.03.2026', '', 'NEW - Назначение',  '333444555666', 'Мусина Зарина',            '1', '4 г. 8 м. 25 д.',  '4 г. 8 м. 25 д.'] },
  { date: new Date('2026-03-31'), row: ['', '31.03.2026 08:00:00', 'Балмагамбет С.Р.',  '12 - базовая',  '1801', '31.03.2026', '', 'NEW - Назначение',  '777888999000', 'Алиева Назгуль',           '1', '2 г. 1 м. 14 д.',  '2 г. 1 м. 14 д.'] },
];

let mockOrderIdCounter = 1;

@Injectable({ providedIn: 'root' })
export class ReportService {

  private readonly API = 'http://localhost:8080/api/reports';
  private useMock = true; // ← false когда бэк готов

  constructor(private http: HttpClient) {}

  // GET /api/reports/actions → список отчётов из d_action
  getActions(): Observable<DAction[]> {
    if (this.useMock) {
      return of(MOCK_ACTIONS).pipe(delay(300));
    }
    return this.http.get<DAction[]>(`${this.API}/actions`);
  }

  // POST /api/reports/order → создать заказ в order_for_report
  createOrder(req: OrderRequest): Observable<OrderResponse> {
    if (this.useMock) {
      const id = mockOrderIdCounter++;
      const rows = this._getMockRows(req.begDate, req.endDate);
      const mockResponse: OrderResponse = {
        id,
        idReport: req.idReport,
        status: 1,
        report: JSON.stringify({ columns: MOCK_COLUMNS, rows }),
        err: null,
        dat: new Date().toISOString(),
      };
      return of(mockResponse).pipe(delay(1200));
    }
    return this.http.post<OrderResponse>(`${this.API}/order`, req);
  }

  // GET /api/reports/order/{id} → проверить статус заказа
  getOrder(id: number): Observable<OrderResponse> {
    if (this.useMock) {
      // Мок всегда возвращает статус 1 (готов)
      return of({ id, idReport: 0, status: 1, report: null, err: null, dat: '' }).pipe(delay(500));
    }
    return this.http.get<OrderResponse>(`${this.API}/order/${id}`);
  }

  // Вспомогательный метод для мока — фильтрует строки по дате
  private _getMockRows(dateFrom: string, dateTo: string): string[][] {
    const from = new Date(dateFrom);
    const to   = new Date(dateTo);
    to.setHours(23, 59, 59);
    const filtered = MOCK_ALL_ROWS.filter(r => r.date >= from && r.date <= to);
    return filtered.map((r, i) => {
      const row = [...r.row];
      row[0] = String(i + 1);
      return row;
    });
  }
}