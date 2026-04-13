import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { JournalEmdService, EmdClient } from './journal-emd.component.service';

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
    private emdService: JournalEmdService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const iin = this.route.snapshot.paramMap.get('id');

    this.emdService.getAll().subscribe({
      next: (data: any[]) => {
        // Ищем клиента по ИИН из API
        const found = data.find((c: any) => c.iin?.toString() === iin);

        if (found) {
          this.client = {
            id:             found.id,
            iin:            found.iin?.toString() || '',
            fio:            found.fio || '',
            dob:            found.dateBirth || '',
            address:        '',
            udostoverenie:  '',
            pensionAge2025: '',
            pensionAge2026: '',
            makets:         [],
            history:        [],
            requests:       [],
            scan:           []
          };
        }

        // Если не нашли в API — ищем в localStorage
        if (!this.client) {
          const savedClients = JSON.parse(localStorage.getItem('emd-clients') || '[]');
          const lsFound = savedClients.find((c: any) => c.iin === iin);
          if (lsFound) {
            this.client = {
              id: 0, iin: lsFound.iin, fio: lsFound.fio,
              dob: lsFound.dob, address: lsFound.address,
              udostoverenie: lsFound.udostoverenie,
              pensionAge2025: '-', pensionAge2026: '-',
              makets: [], history: [], requests: [], scan: []
            };
          }
        }

        if (this.client) {
          this._loadMaketsForClient(iin!);
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
    this.http.get<any[]>(`http://localhost:8080/api/forma/all-by-iin/${iin}`)
      .subscribe({
        next: (dataList: any[]) => {
          this.makets = dataList.map(data => ({
            id:               String(data.id || Date.now()),
            osnova:           data.osnova || '-',
            dateReg:          data.dateObr || '-',
            tip:              data.vidZayavleniya || 'Новое назначение',
            recordId:         data.maketId || '-',
            fio:              this.client?.fio || '-',
            nomerZayavleniya: data.nomerZayavleniya || '-',
            otdelenie:        data.brid || '001',
            expanded:         false,
            status:           String(data.status || 'Новое'),
            detail: {
              summa:     data.maketNaznSumma ? String(data.maketNaznSumma) : '-',
              viplata:   data.sposobViplaty || '-',
              dateObr:   data.dateObr || '-',
              dateNazn:  data.maketDateNazn || '-',
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

  // ── Редактирование клиента ─────────────────────────────────────
  isEditing     = false;
  editFio       = '';
  editDob       = '';
  editAddress   = '';
  editUdost     = '';
  editPension2025 = '';
  editPension2026 = '';

  startEdit() {
    this.isEditing       = true;
    this.editFio         = this.client?.fio           || '';
    this.editDob         = this.client?.dob           || '';
    this.editAddress     = this.client?.address       || '';
    this.editUdost       = this.client?.udostoverenie || '';
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

    const clients = JSON.parse(localStorage.getItem('emd-clients') || '[]');
    const idx = clients.findIndex((c: any) => c.iin === this.client?.iin);
    const updated = {
      iin: this.client.iin, fio: this.editFio, dob: this.editDob,
      address: this.editAddress, udostoverenie: this.editUdost, kemVidano: ''
    };
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
    this.makets = this.makets.filter(m => m !== maket);
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