import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';  
import { Router, ActivatedRoute } from '@angular/router'
import { JournalEmdService, EmdClient, EmdMaket } from './journal-emd.service';


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
        // Сначала ищем в JSON
        this.client = data.find(c => c.iin === iin) || null;

        // Если не нашли — ищем в localStorage
        if (!this.client) {
          const savedClients = JSON.parse(localStorage.getItem('emd-new-clients') || '[]');
          this.client = savedClients.find((c: any) => c.iin === iin) || null;
        }

        // Добавляем заявления из localStorage в макеты
        if (this.client) {
          const saved = JSON.parse(localStorage.getItem('emd-new-records') || '[]');
          const clientZayavleniya = saved.filter((r: any) => r.iin === iin);

          const newMakets: EmdMaket[] = clientZayavleniya.map((z: any, i: number) => ({
            id:               Date.now() + i,
            osnova:           z.osnova || 'Новое заявление',
            dateReg:          z.dateObr,
            tip:              z.vidZayavleniya || 'Новое назначение',
            recordId:         '-',
            fio:              z.fio,
            nomerZayavleniya: z.nomerZayavleniya || '-',
            otdelenie:        z.kodOtd || '-',
            expanded:         false,
            detail: {
              summa:     '-',
              viplata:   '-',
              dateObr:   z.dateObr,
              dateNazn:  '-',
              nomerDela: '-',
              status:    'Новое'
            }
          }));

          this.client.makets = [...newMakets, ...this.client.makets];
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
  isEditing = false;
  editFio          = '';
  editDob          = '';
  editAddress      = '';
  editUdost        = '';
  editPension2025  = '';
  editPension2026  = '';

  startEdit() {
    this.isEditing       = true;
    this.editFio          = this.client?.fio           || '';
    this.editDob          = this.client?.dob           || '';
    this.editAddress      = this.client?.address       || '';
    this.editUdost        = this.client?.udostoverenie || '';
    this.editPension2025  = this.client?.pensionAge2025 || '';
    this.editPension2026  = this.client?.pensionAge2026 || '';
  }

  saveEdit() {
    if (!this.client) return;

    this.client.fio            = this.editFio;
    this.client.dob            = this.editDob;
    this.client.address        = this.editAddress;
    this.client.udostoverenie  = this.editUdost;
    this.client.pensionAge2025 = this.editPension2025;
    this.client.pensionAge2026 = this.editPension2026;

    // Сохраняем в localStorage
    const saved = JSON.parse(localStorage.getItem('emd-new-clients') || '[]');
    const idx = saved.findIndex((c: any) => c.iin === this.client?.iin);
    if (idx !== -1) {
      saved[idx] = { ...saved[idx], ...this.client };
      localStorage.setItem('emd-new-clients', JSON.stringify(saved));
    }

    this.isEditing = false;
    this.cdr.detectChanges();
  }

  cancelEdit() {
    this.isEditing = false;
  }

  deleteMaket(maket: EmdMaket) {
    if (!confirm('Удалить заявление?')) return;

    // Удаляем из localStorage
    const saved = JSON.parse(localStorage.getItem('emd-new-records') || '[]');
    const updated = saved.filter((r: any) => 
      !(r.iin === this.client?.iin && r.dateObr === maket.detail.dateObr)
    );
    localStorage.setItem('emd-new-records', JSON.stringify(updated));

    // Удаляем из текущего списка макетов
    if (this.client) {
      this.client.makets = this.client.makets.filter(m => m !== maket);
      this.cdr.detectChanges();
    }
  }
  
  toggleMaket(maket: EmdMaket) {
    maket.expanded = !maket.expanded;
  }

  openZayavlenie() {
    const iin = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/journals/emd', iin, 'zayavlenie']);
  }

  cancel() {
    this.router.navigate(['/journals/emd/']);
  }
}