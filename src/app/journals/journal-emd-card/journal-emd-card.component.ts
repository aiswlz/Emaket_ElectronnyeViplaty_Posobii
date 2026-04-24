import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EmdClient } from './journal-emd.component.service';

export interface CardMaket {
  id: string;
  osnova: string;
  dateReg: string;
  tip: string;
  recordId: string;
  fio: string;
  nomerZayavleniya: string;
  otdelenie: string;
  expanded: boolean;
  status: string;
  detail: {
    summa: string;
    viplata: string;
    dateObr: string;
    dateNazn: string;
    nomerDela: string;
    status: string;
  };
}

export interface CardHistoryRow {
  date: string;
  action: string;
  details: string;
  user: string;
}

@Component({
  selector: 'app-journal-emd-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './journal-emd-card.component.html',
  styleUrl: './journal-emd-card.component.scss'
})
export class JournalEmdCardComponent implements OnInit {
  activeTab = 'makety';
  isLoading = true;
  client: EmdClient | null = null;
  makets: CardMaket[] = [];
  historyRows: CardHistoryRow[] = [];
  historyUnread = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  private readonly OSNOVA_MAP: Record<number, string> = {
    103: 'Соц. выплаты из ГФСС - по беременности и родам',
    104: 'Пенсия: базовая',
    105: 'Пенсия: солидарная',
    106: 'Пособие по инвалидности',
    107: 'Пособие по потере кормильца',
    108: 'Дети - многодетные',
  };

  ngOnInit() {
    const iin = this.route.snapshot.paramMap.get('id');
    if (!iin) return;

    this.makets = [];
    this.historyRows = [];
    this.historyUnread = false;
    this.isLoading = true;

    this.http.get<any>(`http://localhost:8080/api/forma/client/${iin}`).subscribe({
      next: (data: any) => {
        this.client = {
          id:             data.id || 0,
          iin:            data.iin?.toString() || iin,
          fio:            data.fio || '',
          dob:            this._formatDate(data.dateBirth),
          address:        data.address || '',
          udostoverenie:  data.udostoverenie || '',
          pensionAge2025: data.pensionAge2025 || '-',
          pensionAge2026: data.pensionAge2026 || '-',
          makets:         [],
          history:        [],
          requests:       [],
          scan:           []
        };
        this._loadMaketsForClient(iin);
        this._loadHistory(this.client.id);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private _loadMaketsForClient(iin: string) {
    this.http.get<any[]>(`http://localhost:8080/api/forma/all-by-iin/${iin}`)
      .subscribe({
        next: (dataList: any[]) => {
          this.makets = dataList.map(data => ({
            id:               String(data.id || Date.now()),
            osnova:           this.OSNOVA_MAP[data.osnova] || 'Не указано',
            dateReg:          this._formatDate(data.dateObr),
            tip:              data.vidZayavleniya === 'REC' ? 'Перерасчёт'
                            : data.vidZayavleniya === 'NEW' ? 'Новое назначение'
                            : (data.vidZayavleniya || 'Новое назначение'),
            recordId:         data.maketId ? String(data.maketId) : String(data.id || '-'),
            fio:              this.client?.fio || '-',
            nomerZayavleniya: data.nomerZayavleniya || '-',
            otdelenie:        data.brid || '001',
            expanded:         false,
            status:           String(data.status || 'Новое'),
            detail: {
              summa:     data.maketNaznSumma ? String(data.maketNaznSumma) : '-',
              viplata:   data.sposobViplaty || '-',
              dateObr:   this._formatDate(data.dateObr),
              dateNazn:  this._formatDate(data.maketDateNazn),
              nomerDela: data.nomerDela || '-',
              status:    String(data.status || '-'),
            }
          }));
          this.cdr.detectChanges();
        },
        error: () => {
          this.makets = [];
          this.cdr.detectChanges();
        }
      });
  }

  private _loadHistory(zdocId: number) {
    if (!zdocId) return;
    this.http.get<any[]>(`http://localhost:8080/api/history/by-zdoc/${zdocId}`)
      .subscribe({
        next: (rows: any[]) => {
          this.historyRows = rows.map(r => ({
            date:    r.dat ? this._formatDate(r.dat) : '-',
            action:  r.deystvie || '-',
            details: (r.fieldName || '') + ': ' + (r.oldValue || '-') + ' → ' + (r.newValue || '-'),
            user:    r.usr || '-',
          }));
          if (this.historyRows.length > 0) this.historyUnread = true;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
  }

  private _formatDate(val: any): string {
    if (!val) return '-';
    if (typeof val === 'string' && val.includes('.')) return val;
    if (typeof val === 'string' && val.includes('-')) {
      const parts = val.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return String(val);
  }

  // ── Редактирование клиента ─────────────────────────────────────
  isEditing       = false;
  editFio         = '';
  editDob         = '';
  editAddress     = '';
  editUdost       = '';
  editPension2025 = '';
  editPension2026 = '';

  startEdit() {
    this.isEditing       = true;
    this.editFio         = this.client?.fio            || '';
    this.editDob         = this.client?.dob            || '';
    this.editAddress     = this.client?.address        || '';
    this.editUdost       = this.client?.udostoverenie  || '';
    this.editPension2025 = this.client?.pensionAge2025 || '';
    this.editPension2026 = this.client?.pensionAge2026 || '';
  }

  saveEdit() {
    if (!this.client) return;
    this.client.fio            = this.editFio;
    this.client.dob            = this.editDob;
    this.client.address        = this.editAddress;
    this.client.udostoverenie  = this.editUdost;
    this.client.pensionAge2025 = this.editPension2025;
    this.client.pensionAge2026 = this.editPension2026;
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  cancelEdit() { this.isEditing = false; }

  // ── Макеты ─────────────────────────────────────────────────────
  toggleMaket(maket: CardMaket) {
    maket.expanded = !maket.expanded;
  }

  // Удаление макета — DELETE в БД
  deleteMaket(maket: CardMaket) {
    if (!confirm('Удалить заявление? Данные будут удалены из базы данных.')) return;

    const zdocId = Number(maket.id);

    if (!zdocId || isNaN(zdocId)) {
        this.makets = this.makets.filter(m => m !== maket);
        this.cdr.detectChanges();
        return;
    }

    this.http.delete(`http://localhost:8080/api/forma/${zdocId}`, 
        { responseType: 'text' }  // ← важно! backend возвращает text
    ).subscribe({
        next: () => {
            this.makets = this.makets.filter(m => m !== maket);
            this.cdr.detectChanges();
        },
        error: (err) => {
            console.error('Ошибка удаления:', err);
            // Правильное извлечение текста ошибки
            const msg = typeof err?.error === 'string' 
                ? err.error 
                : err?.message 
                ?? 'Неизвестная ошибка';
            alert('Не удалось удалить заявление: ' + msg);
        }
    });
}

  openZayavlenie() {
    const iin = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/journals/emd', iin, 'zayavlenie']);
  }

  openMaket(maket: CardMaket) {
    const iin = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/journals/emd', iin, 'zayavlenie', maket.id]);
  }

  cancel() { this.router.navigate(['/journals/emd/']); }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Новое':           'badge-new',
      'На рассмотрении': 'badge-review',
      'Назначено':       'badge-ok',
      'Перерасчитано':   'badge-rec',
      'Отказано':        'badge-deny',
    };
    return map[status] || 'badge-new';
  }
}