import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { JournalEmdService, EmdClient } from './journal-emd.service';
import { EmdMaketRecord } from '../zayavlenie-form/zayavlenie-form.component';

// Единый тип макета для карточки
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

// История карточки клиента
export interface CardHistoryRow {
  date: string;
  action: string;
  details: string;
  user: string;
}

function loadMakets(): EmdMaketRecord[] {
  return JSON.parse(localStorage.getItem('emd-makets') || '[]');
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
    private emdService: JournalEmdService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const iin = this.route.snapshot.paramMap.get('id');
    this.emdService.getAll().subscribe({
      next: (data) => {
        // Ищем клиента в JSON
        this.client = data.find(c => c.iin === iin) || null;

        // Если не нашли — ищем в localStorage (emd-clients — новый формат)
        if (!this.client) {
          const savedClients = JSON.parse(localStorage.getItem('emd-clients') || '[]');
          const found = savedClients.find((c: any) => c.iin === iin);
          if (found) {
            this.client = {
              id: 0, iin: found.iin, fio: found.fio, dob: found.dob,
              address: found.address, udostoverenie: found.udostoverenie,
              pensionAge2025: '-', pensionAge2026: '-',
              makets: [], history: [], requests: [], scan: []
            };
          }
        }

        // Fallback: старый формат emd-new-clients
        if (!this.client) {
          const oldClients = JSON.parse(localStorage.getItem('emd-new-clients') || '[]');
          const found = oldClients.find((c: any) => c.iin === iin);
          if (found) {
            this.client = {
              id: 0, iin: found.iin, fio: found.fio, dob: found.dob,
              address: found.address, udostoverenie: found.udostoverenie,
              pensionAge2025: '-', pensionAge2026: '-',
              makets: [], history: [], requests: [], scan: []
            };
          }
        }

        if (this.client) {
          this._loadMaketsForClient(iin!);
          this._buildHistory(iin!);
        }

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
    const result: CardMaket[] = [];

    // 1. Из нового формата emd-makets
    const newMakets = loadMakets().filter(m => m.iin === iin);
    for (const m of newMakets) {
      result.push({
        id:               m.id,
        osnova:           m.osnova,
        dateReg:          m.dateObr || m.createdAt?.split(',')[0] || '-',
        tip:              m.vidZayavleniya || 'Новое назначение',
        recordId:         m.maketIdEmaket || '-',
        fio:              m.maketNazvaniePolya ? this.client?.fio || '-' : '-',
        nomerZayavleniya: m.nomerZayavleniya,
        otdelenie:        '001',
        expanded:         false,
        status:           m.status,
        detail: {
          summa:     m.maketNaznSumma ? String(m.maketNaznSumma) : '-',
          viplata:   m.maketIdCbd || '-',
          dateObr:   m.dateObr || '-',
          dateNazn:  m.maketDateNazn || '-',
          nomerDela: m.maketIdEmaket || '-',
          status:    m.status,
        }
      });
    }

    // 2. Fallback: старый формат emd-new-records
    const oldRecords = JSON.parse(localStorage.getItem('emd-new-records') || '[]')
      .filter((r: any) => r.iin === iin);

    for (const z of oldRecords) {
      // Не дублируем если уже есть в новом формате
      const already = result.find(r => r.nomerZayavleniya === z.nomerZayavleniya);
      if (!already) {
        result.push({
          id:               String(z.id || Date.now()),
          osnova:           z.osnova || '-',
          dateReg:          z.dateObr || '-',
          tip:              z.vidZayavleniya || 'Новое назначение',
          recordId:         '-',
          fio:              z.fio || '-',
          nomerZayavleniya: z.nomerZayavleniya || '-',
          otdelenie:        z.kodOtd || '001',
          expanded:         false,
          status:           z.status || 'Новое',
          detail: {
            summa:     '-',
            viplata:   '-',
            dateObr:   z.dateObr || '-',
            dateNazn:  '-',
            nomerDela: '-',
            status:    z.status || 'Новое',
          }
        });
      }
    }

    // 3. Статичные данные из JSON (уже в this.client.makets)
    for (const m of (this.client?.makets || [])) {
      const already = result.find(r => r.nomerZayavleniya === m.nomerZayavleniya);
      if (!already) {
        result.push({
          id:               String(m.id),
          osnova:           m.osnova,
          dateReg:          m.dateReg,
          tip:              m.tip,
          recordId:         m.recordId,
          fio:              m.fio,
          nomerZayavleniya: m.nomerZayavleniya,
          otdelenie:        m.otdelenie,
          expanded:         false,
          status:           m.detail?.status || '-',
          detail: {
            summa:     m.detail?.summa || '-',
            viplata:   m.detail?.viplata || '-',
            dateObr:   m.detail?.dateObr || '-',
            dateNazn:  m.detail?.dateNazn || '-',
            nomerDela: m.detail?.nomerDela || '-',
            status:    m.detail?.status || '-',
          }
        });
      }
    }

    this.makets = result;
  }

  private _buildHistory(iin: string) {
    const rows: CardHistoryRow[] = [];

    // Из новых макетов — берём историю перерасчётов
    const newMakets = loadMakets().filter(m => m.iin === iin);
    for (const m of newMakets) {
      // Регистрация заявления
      rows.push({
        date:    m.createdAt || '-',
        action:  'Регистрация заявления',
        details: `Основание: ${m.osnova} | Сумма: ${m.maketNaznSumma ? m.maketNaznSumma + ' ₸' : '-'}`,
        user:    'USER',
      });
      // Перерасчёты
      for (const p of m.peraschetHistory || []) {
        rows.push({
          date:    p.date,
          action:  'Перерасчёт',
          details: `Сумма: ${p.summaBefore} ₸ → ${p.summaAfter} ₸ | До: ${p.dateOkon}`,
          user:    'USER',
        });
      }
      // Изменение статуса
      if (m.updatedAt !== m.createdAt) {
        rows.push({
          date:    m.updatedAt || '-',
          action:  'Изменение статуса',
          details: `Статус: ${m.status}`,
          user:    'USER',
        });
      }
    }

    // Сортируем по дате (новые сверху)
    this.historyRows = rows.sort((a, b) => b.date.localeCompare(a.date));
    // Показываем бейдж если есть записи
    if (this.historyRows.length > 0) {
      this.historyUnread = true;
    }
  }

  // ── Редактирование клиента ─────────────────────────────────────
  isEditing    = false;
  editFio      = '';
  editDob      = '';
  editAddress  = '';
  editUdost    = '';
  editPension2025 = '';
  editPension2026 = '';

  startEdit() {
    this.isEditing      = true;
    this.editFio        = this.client?.fio          || '';
    this.editDob        = this.client?.dob          || '';
    this.editAddress    = this.client?.address      || '';
    this.editUdost      = this.client?.udostoverenie|| '';
    this.editPension2025= this.client?.pensionAge2025|| '';
    this.editPension2026= this.client?.pensionAge2026|| '';
  }

  saveEdit() {
    if (!this.client) return;
    this.client.fio           = this.editFio;
    this.client.dob           = this.editDob;
    this.client.address       = this.editAddress;
    this.client.udostoverenie = this.editUdost;
    this.client.pensionAge2025= this.editPension2025;
    this.client.pensionAge2026= this.editPension2026;

    // Обновляем в emd-clients
    const clients = JSON.parse(localStorage.getItem('emd-clients') || '[]');
    const idx = clients.findIndex((c: any) => c.iin === this.client?.iin);
    const updated = { iin: this.client.iin, fio: this.editFio, dob: this.editDob,
      address: this.editAddress, udostoverenie: this.editUdost, kemVidano: '' };
    if (idx !== -1) { clients[idx] = updated; } else { clients.push(updated); }
    localStorage.setItem('emd-clients', JSON.stringify(clients));

    this.isEditing = false;
    this.cdr.detectChanges();
  }

  cancelEdit() { this.isEditing = false; }

  // ── Макеты ─────────────────────────────────────────────────────
  toggleMaket(maket: CardMaket) {
    maket.expanded = !maket.expanded;
  }

  deleteMaket(maket: CardMaket) {
    if (!confirm('Удалить заявление?')) return;
    // Удаляем из emd-makets
    const makets = loadMakets().filter(m => m.id !== maket.id);
    localStorage.setItem('emd-makets', JSON.stringify(makets));
    // Удаляем из старого формата
    const old = JSON.parse(localStorage.getItem('emd-new-records') || '[]')
      .filter((r: any) => !(r.iin === this.client?.iin && r.nomerZayavleniya === maket.nomerZayavleniya));
    localStorage.setItem('emd-new-records', JSON.stringify(old));
    this.makets = this.makets.filter(m => m !== maket);
    this._buildHistory(this.client?.iin || '');
    this.cdr.detectChanges();
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

  // Лейбл статуса
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