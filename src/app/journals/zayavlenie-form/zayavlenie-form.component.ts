import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// ── Единая структура данных в localStorage ──────────────────────
// emd-clients: EmdClientRecord[]
// emd-makets:  EmdMaketRecord[]   (все заявления/макеты)

export interface EmdClientRecord {
  iin: string;
  fio: string;
  dob: string;
  address: string;
  udostoverenie: string;
  kemVidano: string;
}

export type MaketStatus = 'Новое' | 'На рассмотрении' | 'Назначено' | 'Перерасчитано' | 'Отказано';

export interface EmdMaketRecord {
  id: string;           // уникальный id макета
  iin: string;          // связь с клиентом
  status: MaketStatus;

  // Вкладка Заявление
  nomerZayavleniya: string;
  istochnik: string;
  osnova: string;
  vidZayavleniya: string;
  dateObr: string;
  datePriem: string;
  yazykZayavl: string;
  domTel: string;
  email: string;
  mobTel: string;
  istMobTel: string;
  pribyl: boolean;
  stranaPrib: string;
  sposobViplaty: string;
  mestoProj: string;
  tipScheta: string;
  iban: string;
  bank: string;
  mnogodetMat: boolean;
  pensionerSIYAP: boolean;
  izhdivency: { otnoshenie: string; iin: string; fio: string; dateBirth: string }[];

  // Вкладка Макет
  maketNazvaniePolya: string;
  maketDateObr: string;
  maketDatePostupleniya: string;
  maketDateNazn: string;
  maketDateOkon: string;
  maketVedomstvo: string;
  maketKanikulyarnie: boolean;
  maketNomerSpravki: string;
  maketStranaInvalidnosti: string;
  maketDateUstanov: string;
  maketDateOkonDo: string;
  maketGruppaInvalid: string;
  maketPrichinaInvalid: string;
  maketNaznSumma: number;
  maketIdCbd: string;
  maketIdEmaket: string;

  // История перерасчётов
  peraschetHistory: PeraschetRecord[];

  createdAt: string;
  updatedAt: string;
}

export interface PeraschetRecord {
  date: string;
  summaBefore: number;
  summaAfter: number;
  dateOkon: string;
  podpisano: boolean;
}

export interface KartaRazmerovRow {
  num: number;
  nomerResheniya: string;
  viplata: string;
  dateNachala: string;
  dateOkon: string;
  tipNaznacheniya: string;
  summa: number;
  fio: string;
  sid: string;
  payId: string;
  pnptId: string;
  isRec?: boolean;
}

export interface HistoryRow {
  otd: string;
  date: string;
  izmenyaemaya: string;
  deystvie: string;
  izmOld: string;
  izmNew: string;
  polzovatel: string;
  ipAdres: string;
  host: string;
  imyaUchetnoy: string;
  inspektor: string;
}

export interface KgdRow {
  idZaprosa: string;
  polzovatel: string;
  dataZaprosa: string;
  dataOtveta: string;
  binOrganizacii: string;
  vidPersony: string;
  iin: string;
  fio: string;
  periodS: string;
  periodPo: string;
}

// ── localStorage helpers ─────────────────────────────────────────
function loadMakets(): EmdMaketRecord[] {
  return JSON.parse(localStorage.getItem('emd-makets') || '[]');
}
function saveMakets(makets: EmdMaketRecord[]) {
  localStorage.setItem('emd-makets', JSON.stringify(makets));
}
function loadClients(): EmdClientRecord[] {
  return JSON.parse(localStorage.getItem('emd-clients') || '[]');
}
function saveClients(clients: EmdClientRecord[]) {
  localStorage.setItem('emd-clients', JSON.stringify(clients));
}

@Component({
  selector: 'app-zayavlenie-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zayavlenie-form.component.html',
  styleUrl: './zayavlenie-form.component.scss'
})
export class ZayavlenieFormComponent implements OnInit {

  // ── Режим ─────────────────────────────────────────────────────
  activeTab: string = 'zayavlenie';
  clientId: string = '';
  maketId: string | null = null;
  isNewMode: boolean = true;
  currentMaket: EmdMaketRecord | null = null;

  // ── Статус ────────────────────────────────────────────────────
  status: MaketStatus = 'Новое';

  // ── Перерасчёт ────────────────────────────────────────────────
  isPereschet: boolean = false;
  peraschetStep: 'idle' | 'editing' | 'saved' | 'signed' = 'idle';
  reshenieNeedsSign = false;
  private _maketSnapshot: Partial<ZayavlenieFormComponent> | null = null;
  private _recRows: KartaRazmerovRow[] = [];

  // ── Вкладка: Заявление ────────────────────────────────────────
  nomerZayavleniya = '';
  istochnik        = 'Цон';
  osnova           = 'Соц. выплаты из ГФСС - по беременности и родам';
  vidZayavleniya   = 'Новое назначение';
  iin          = '';
  fio          = '';
  dateBirth    = '';
  nomerDoc     = '';
  kemVidano    = '';
  dateObr      = '';
  datePriem    = '';
  yazykZayavl  = 'Русский';
  domTel       = '';
  email        = '';
  address      = '';
  mobTel       = '';
  istMobTel    = '';
  pribyl       = false;
  stranaPrib   = '';
  sposobViplaty = '';
  mestoProj     = '01-Собственное жильё';
  tipScheta     = 'kart';
  iban          = '';
  bank          = '';
  mnogodetMat    = false;
  pensionerSIYAP = false;
  izhdivency: { otnoshenie: string; iin: string; fio: string; dateBirth: string }[] = [];

  // ── Вкладка: Макет ────────────────────────────────────────────
  maketNazvaniePolya    = '090101 Пособие матери/отцу';
  maketDateObr          = '';
  maketDatePostupleniya = '';
  maketDateNazn         = '';
  maketDateOkon         = '';
  maketVedomstvo        = 'МТСЗН';
  maketKanikulyarnie    = true;
  maketNomerSpravki       = '';
  maketStranaInvalidnosti = '';
  maketDateUstanov        = '';
  maketDateOkonDo         = '';
  maketGruppaInvalid      = '';
  maketPrichinaInvalid    = '';
  maketNaznSumma          = 0;
  maketIdCbd    = '';
  maketIdEmaket = '';

  // ── Вкладка: Решение ──────────────────────────────────────────
  reshenieLang          = 'ru';
  reshenieEcp           = '';
  reshenieOtkazPrichina = '';
  reshenieKomment       = '';

  // ── Вкладка: Карта размеров ───────────────────────────────────
  kartaRows: KartaRazmerovRow[] = [];

  // ── Вкладка: История изменений ────────────────────────────────
  historyRows: HistoryRow[] = [];
  historyUnread = false;

  // ── Вкладка: КГД ─────────────────────────────────────────────
  kgdRows: KgdRow[] = [];

  private _generateKgdRows() {
    if (!this.iin) return;
    const today = new Date().toLocaleDateString('ru-RU');
    // Имитация запросов к КГД за последние 3 года
    this.kgdRows = [2023, 2022, 2021].flatMap(year =>
      [1, 2, 3, 4].map(q => ({
        idZaprosa:      String(800000 + Math.floor(Math.random() * 99999)),
        polzovatel:     'USER',
        dataZaprosa:    today,
        dataOtveta:     today,
        binOrganizacii: '1900304004',
        vidPersony:     'Наемный работник',
        iin:            this.iin,
        fio:            this.fio,
        periodS:        `01.${String(q * 3 - 2).padStart(2,'0')}.${year}`,
        periodPo:       `01.${String(q * 3).padStart(2,'0')}.${year}`,
      }))
    );
  }

  submitted = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id      = this.route.snapshot.paramMap.get('id') || '';
    const maketId = this.route.snapshot.paramMap.get('maketId');
    this.clientId = id;
    this.maketId  = maketId;
    this.isNewMode = !maketId;

    // Генерируем номер заявления для нового
    if (this.isNewMode) {
      this.nomerZayavleniya = this._generateNomer();
    }

    // Загружаем данные клиента из JSON или localStorage
    this.http.get<any[]>('/data/emd.json').subscribe({
      next: (data) => {
        let client = data.find(c => c.iin === id);
        if (!client) {
          const savedClients = loadClients();
          client = savedClients.find(c => c.iin === id);
          // fallback: старый формат
          if (!client) {
            const oldClients = JSON.parse(localStorage.getItem('emd-new-clients') || '[]');
            client = oldClients.find((c: any) => c.iin === id);
          }
        }
        if (client) {
          this.iin       = client.iin           || '';
          this.fio       = client.fio           || '';
          this.dateBirth = client.dob           || '';
          this.address   = client.address       || '';
          this.nomerDoc  = client.udostoverenie || '';
          this.kemVidano = client.kemVidano     || '';
        }

        // Генерируем данные КГД на основе ИИН клиента
        this._generateKgdRows();

        // Открываем существующий макет
        if (maketId) {
          this._loadExistingMaket(maketId, id);
        }

        // Синхронизируем dateObr с maketDateObr
        if (this.isNewMode) {
          const today = new Date().toLocaleDateString('ru-RU');
          this.dateObr = today;
          this.maketDateObr = today;
          this.maketDateNazn = today;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        if (maketId) this._loadExistingMaket(maketId, id);
        this.cdr.detectChanges();
      }
    });
  }

  private _generateNomer(): string {
    return String(Math.floor(800000000 + Math.random() * 100000000));
  }

  private _loadExistingMaket(maketId: string, iin: string) {
    const makets = loadMakets();
    let maket = makets.find(m => m.id === maketId && m.iin === iin);

    // Fallback: старый формат emd-new-records
    if (!maket) {
      const old = JSON.parse(localStorage.getItem('emd-new-records') || '[]');
      const rec = old.find((r: any) => r.iin === iin);
      if (rec) {
        this._fillFromOldRecord(rec);
        return;
      }
    }

    if (!maket) return;
    this.currentMaket = maket;
    this._fillFromMaket(maket);
  }

  private _fillFromMaket(m: EmdMaketRecord) {
    this.status            = m.status;
    this.nomerZayavleniya  = m.nomerZayavleniya;
    this.istochnik         = m.istochnik;
    this.osnova            = m.osnova;
    this.vidZayavleniya    = m.vidZayavleniya;
    this.dateObr           = m.dateObr;
    this.datePriem         = m.datePriem;
    this.yazykZayavl       = m.yazykZayavl;
    this.domTel            = m.domTel;
    this.email             = m.email;
    this.mobTel            = m.mobTel;
    this.istMobTel         = m.istMobTel;
    this.pribyl            = m.pribyl;
    this.stranaPrib        = m.stranaPrib;
    this.sposobViplaty     = m.sposobViplaty;
    this.mestoProj         = m.mestoProj;
    this.tipScheta         = m.tipScheta;
    this.iban              = m.iban;
    this.bank              = m.bank;
    this.mnogodetMat       = m.mnogodetMat;
    this.pensionerSIYAP    = m.pensionerSIYAP;
    this.izhdivency        = [...(m.izhdivency || [])];
    this.maketNazvaniePolya    = m.maketNazvaniePolya;
    this.maketDateObr          = m.maketDateObr;
    this.maketDatePostupleniya = m.maketDatePostupleniya;
    this.maketDateNazn         = m.maketDateNazn;
    this.maketDateOkon         = m.maketDateOkon;
    this.maketVedomstvo        = m.maketVedomstvo;
    this.maketKanikulyarnie    = m.maketKanikulyarnie;
    this.maketNomerSpravki     = m.maketNomerSpravki;
    this.maketStranaInvalidnosti = m.maketStranaInvalidnosti;
    this.maketDateUstanov      = m.maketDateUstanov;
    this.maketDateOkonDo       = m.maketDateOkonDo;
    this.maketGruppaInvalid    = m.maketGruppaInvalid;
    this.maketPrichinaInvalid  = m.maketPrichinaInvalid;
    this.maketNaznSumma        = m.maketNaznSumma;
    this.maketIdCbd            = m.maketIdCbd;
    this.maketIdEmaket         = m.maketIdEmaket;

    // Строим Карту размеров из истории перерасчётов
    this._buildKartaRows(m);

    // Строим историю изменений из перерасчётов
    this._buildHistoryRows(m);
  }

  private _fillFromOldRecord(rec: any) {
    this.nomerZayavleniya = rec.nomerZayavleniya || '';
    this.istochnik        = rec.istochnik        || 'Цон';
    this.osnova           = rec.osnova           || '';
    this.vidZayavleniya   = rec.vidZayavleniya   || 'Новое назначение';
    this.dateObr          = rec.dateObr          || '';
    this.status           = rec.status           || 'Новое';
  }

  private _buildKartaRows(m: EmdMaketRecord) {
    this.kartaRows = [];
    // Базовая строка NEW
    if (m.maketNaznSumma) {
      this.kartaRows.push({
        num: 1,
        nomerResheniya:  m.id,
        viplata:         m.maketIdCbd || '-',
        dateNachala:     m.maketDateNazn,
        dateOkon:        m.maketDateOkon || '-',
        tipNaznacheniya: 'NEW - новое назначение',
        summa:           m.maketNaznSumma,
        fio:             this.fio,
        sid:             '1234567',
        payId:           '87434123',
        pnptId:          '987654',
        isRec:           false,
      });
    }
    // REC строки из истории перерасчётов
    m.peraschetHistory.forEach((p, i) => {
      this.kartaRows.push({
        num:             this.kartaRows.length + 1,
        nomerResheniya:  m.id + '-REC' + (i + 1),
        viplata:         m.maketIdCbd || '-',
        dateNachala:     m.maketDateNazn,
        dateOkon:        p.dateOkon,
        tipNaznacheniya: 'REC - перерасчет',
        summa:           p.summaAfter,
        fio:             this.fio,
        sid:             '1234567',
        payId:           '87434123',
        pnptId:          '987654',
        isRec:           true,
      });
    });
  }

  private _buildHistoryRows(m: EmdMaketRecord) {
    this.historyRows = m.peraschetHistory.map(p => ({
      otd:          '1202',
      date:         p.date,
      izmenyaemaya: 'SUMMA',
      deystvie:     'Перерасчёт',
      izmOld:       String(p.summaBefore),
      izmNew:       String(p.summaAfter),
      polzovatel:   'USER',
      ipAdres:      '10.61.157.41',
      host:         'emaket-local',
      imyaUchetnoy: 'oracle',
      inspektor:    'Пользователь системы',
    }));
  }

  private _currentToMaketRecord(): EmdMaketRecord {
    const now = new Date().toLocaleString('ru-RU');
    return {
      id:                    this.maketId || this._generateNomer(),
      iin:                   this.iin,
      status:                this.status,
      nomerZayavleniya:      this.nomerZayavleniya,
      istochnik:             this.istochnik,
      osnova:                this.osnova,
      vidZayavleniya:        this.vidZayavleniya,
      dateObr:               this.dateObr,
      datePriem:             this.datePriem,
      yazykZayavl:           this.yazykZayavl,
      domTel:                this.domTel,
      email:                 this.email,
      mobTel:                this.mobTel,
      istMobTel:             this.istMobTel,
      pribyl:                this.pribyl,
      stranaPrib:            this.stranaPrib,
      sposobViplaty:         this.sposobViplaty,
      mestoProj:             this.mestoProj,
      tipScheta:             this.tipScheta,
      iban:                  this.iban,
      bank:                  this.bank,
      mnogodetMat:           this.mnogodetMat,
      pensionerSIYAP:        this.pensionerSIYAP,
      izhdivency:            [...this.izhdivency],
      maketNazvaniePolya:    this.maketNazvaniePolya,
      maketDateObr:          this.maketDateObr,
      maketDatePostupleniya: this.maketDatePostupleniya,
      maketDateNazn:         this.maketDateNazn,
      maketDateOkon:         this.maketDateOkon,
      maketVedomstvo:        this.maketVedomstvo,
      maketKanikulyarnie:    this.maketKanikulyarnie,
      maketNomerSpravki:     this.maketNomerSpravki,
      maketStranaInvalidnosti: this.maketStranaInvalidnosti,
      maketDateUstanov:      this.maketDateUstanov,
      maketDateOkonDo:       this.maketDateOkonDo,
      maketGruppaInvalid:    this.maketGruppaInvalid,
      maketPrichinaInvalid:  this.maketPrichinaInvalid,
      maketNaznSumma:        this.maketNaznSumma,
      maketIdCbd:            this.maketIdCbd,
      maketIdEmaket:         this.maketIdEmaket,
      peraschetHistory:      this.currentMaket?.peraschetHistory || [],
      createdAt:             this.currentMaket?.createdAt || now,
      updatedAt:             now,
    };
  }

  // ── СОХРАНЕНИЕ нового заявления ────────────────────────────────
  save() {
    this.submitted = true;
    if (!this.iin.trim())                                    { alert('Заполните ИИН'); return; }
    if (this.iin.length !== 12)                              { alert('ИИН — 12 цифр'); return; }
    if (!this.fio.trim())                                    { alert('Заполните ФИО'); return; }
    if (!this.dateBirth.trim() || this.dateBirth.length < 8){ alert('Заполните дату рождения дд.мм.гггг'); return; }
    if (!this.nomerDoc.trim())                               { alert('Заполните № документа'); return; }
    if (!this.kemVidano.trim())                              { alert('Заполните Кем выдано'); return; }

    const now = new Date().toLocaleString('ru-RU');
    const today = new Date().toLocaleDateString('ru-RU');
    const newId = this._generateNomer();

    // Автозаполняем dateObr если пустое
    if (!this.dateObr) this.dateObr = today;
    if (!this.maketDateObr) this.maketDateObr = today;

    // Сохраняем клиента
    const clients = loadClients();
    if (!clients.find(c => c.iin === this.iin)) {
      clients.push({
        iin: this.iin, fio: this.fio, dob: this.dateBirth,
        address: this.address, udostoverenie: this.nomerDoc, kemVidano: this.kemVidano,
      });
      saveClients(clients);
    }

    // Сохраняем макет
    const record = this._currentToMaketRecord();
    record.id        = newId;
    record.status    = 'На рассмотрении';
    record.createdAt = now;
    record.updatedAt = now;

    const makets = loadMakets();
    makets.unshift(record);
    saveMakets(makets);

    // Совместимость со старым форматом (для journal-emd-card)
    const oldRecords = JSON.parse(localStorage.getItem('emd-new-records') || '[]');
    oldRecords.unshift({
      id: newId, iin: this.iin, fio: this.fio, dateObr: this.dateObr,
      dateStatus: now, status: 'На рассмотрении', kodOtd: '001',
      istochnik: this.istochnik, osnova: this.osnova,
      vidZayavleniya: this.vidZayavleniya, nomerZayavleniya: this.nomerZayavleniya,
    });
    localStorage.setItem('emd-new-records', JSON.stringify(oldRecords));

    alert('Заявление зарегистрировано!');
    this.router.navigate(['/journals/emd', this.iin]);
  }

  // ── ПЕРЕРАСЧЁТ ─────────────────────────────────────────────────
  togglePereschet() {
    if (this.isPereschet) {
      this._cancelPereschet();
    } else {
      this._startPereschet();
    }
  }

  private _startPereschet() {
    // Сохраняем снапшот полей макета
    this._maketSnapshot = {
      maketNazvaniePolya:      this.maketNazvaniePolya,
      maketDateObr:            this.maketDateObr,
      maketDatePostupleniya:   this.maketDatePostupleniya,
      maketDateNazn:           this.maketDateNazn,
      maketDateOkon:           this.maketDateOkon,
      maketVedomstvo:          this.maketVedomstvo,
      maketKanikulyarnie:      this.maketKanikulyarnie,
      maketNomerSpravki:       this.maketNomerSpravki,
      maketStranaInvalidnosti: this.maketStranaInvalidnosti,
      maketDateUstanov:        this.maketDateUstanov,
      maketDateOkonDo:         this.maketDateOkonDo,
      maketGruppaInvalid:      this.maketGruppaInvalid,
      maketPrichinaInvalid:    this.maketPrichinaInvalid,
      maketNaznSumma:          this.maketNaznSumma,
    } as any;
    this.isPereschet    = true;
    this.peraschetStep  = 'editing';
    this.activeTab      = 'maket';
    this.cdr.detectChanges();
  }

  private _cancelPereschet() {
    if (!confirm('Отменить перерасчёт? Все изменения будут потеряны.')) return;
    if (this._maketSnapshot) Object.assign(this, this._maketSnapshot);
    // Убираем добавленные REC-строки
    this.kartaRows      = this.kartaRows.filter(r => !this._recRows.includes(r));
    this._recRows       = [];
    this._maketSnapshot = null;
    this.isPereschet    = false;
    this.peraschetStep  = 'idle';
    this.reshenieNeedsSign = false;
    this.activeTab      = 'zayavlenie';
    this.cdr.detectChanges();
  }

  saveMaket() {
    if (!this.isPereschet) {
      // Обычное сохранение макета (не перерасчёт)
      this._saveMaketToStorage();
      alert('Макет сохранён!');
      return;
    }

    if (!this.maketDateOkon) {
      alert('Укажите дату окончания для перерасчёта');
      return;
    }

    const summaBefore = (this._maketSnapshot as any)?.maketNaznSumma ?? 0;

    // Добавляем REC-строку в Карту размеров (только в UI, не в storage)
    const recRow: KartaRazmerovRow = {
      num:             this.kartaRows.length + 1,
      nomerResheniya:  (this.maketId || 'NEW') + '-REC' + (this._recRows.length + 1),
      viplata:         this.maketIdCbd || '-',
      dateNachala:     this.maketDateNazn,
      dateOkon:        this.maketDateOkon,
      tipNaznacheniya: 'REC - перерасчет',
      summa:           Number(this.maketNaznSumma),
      fio:             this.fio,
      sid:             '1234567',
      payId:           '87434123',
      pnptId:          '987654',
      isRec:           true,
    };
    this.kartaRows = [...this.kartaRows, recRow];
    this._recRows.push(recRow);

    // Добавляем запись в историю (только в UI)
    const now = new Date().toLocaleString('ru-RU');
    this.historyRows = [{
      otd: '1202', date: now, izmenyaemaya: 'SUMMA',
      deystvie: 'Перерасчёт',
      izmOld: String(summaBefore), izmNew: String(this.maketNaznSumma),
      polzovatel: 'USER', ipAdres: '10.61.157.41',
      host: 'emaket-local', imyaUchetnoy: 'oracle',
      inspektor: 'Пользователь системы',
    }, ...this.historyRows];

    this.historyUnread     = true;
    this.peraschetStep     = 'saved';
    this.reshenieNeedsSign = true;
    // НЕ сохраняем в storage — ждём подписания ЭЦП
    this.activeTab         = 'reshenie';
    this.cdr.detectChanges();
  }

  signReshenie() {
    const now = new Date().toLocaleString('ru-RU');
    const summaBefore = Number((this._maketSnapshot as any)?.maketNaznSumma ?? 0);
    const summaAfter  = Number(this.maketNaznSumma);

    // Только сейчас сохраняем в storage — после подписания ЭЦП
    if (this.currentMaket) {
      this.currentMaket.peraschetHistory.push({
        date:        now,
        summaBefore: summaBefore,
        summaAfter:  summaAfter,
        dateOkon:    this.maketDateOkon,
        podpisano:   true,
      });
      this.currentMaket.maketNaznSumma = summaAfter;
      this.currentMaket.maketDateOkon  = this.maketDateOkon;
      this.currentMaket.updatedAt      = now;
      this._saveMaketToStorage();
    }

    // Сбрасываем перерасчёт — он ЗАВЕРШЁН, кнопка снова доступна
    this.maketNaznSumma    = summaAfter;
    this.isPereschet       = false;
    this.peraschetStep     = 'idle';
    this.reshenieNeedsSign = false;
    this._maketSnapshot    = null;
    this._recRows          = [];

    alert('Решение подписано! Перерасчёт завершён.');
    this.cdr.detectChanges();
  }

  private _saveMaketToStorage() {
    const makets = loadMakets();
    const record = this._currentToMaketRecord();
    if (this.currentMaket) {
      record.peraschetHistory = this.currentMaket.peraschetHistory;
    }
    const idx = makets.findIndex(m => m.id === record.id);
    if (idx !== -1) {
      makets[idx] = record;
    } else {
      makets.unshift(record);
    }
    saveMakets(makets);
    this.currentMaket = record;
  }

  // ── Иждивенцы ─────────────────────────────────────────────────
  addIzhdivents() {
    this.izhdivency.push({ otnoshenie: 'Сын/дочь', iin: '', fio: '', dateBirth: '' });
  }
  removeIzhdivents(i: number) {
    this.izhdivency.splice(i, 1);
  }

  // ── Форматирование ────────────────────────────────────────────
  formatDate(event: Event, field: 'dateBirth' | 'dateObr' | 'datePriem') {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 3 && value.length <= 4) value = value.slice(0, 2) + '.' + value.slice(2);
    else if (value.length >= 5) value = value.slice(0, 2) + '.' + value.slice(2, 4) + '.' + value.slice(4, 8);
    input.value = value;
    this[field] = value;
  }

  formatPhone(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.startsWith('8') || value.startsWith('7')) value = value.slice(1);
    let f = '+7';
    if (value.length > 0) f += ' (' + value.slice(0, 3);
    if (value.length >= 3) f += ')';
    if (value.length >= 4) f += ' ' + value.slice(3, 6);
    if (value.length >= 7) f += '-' + value.slice(6, 8);
    if (value.length >= 9) f += '-' + value.slice(8, 10);
    input.value = f;
    this.mobTel = f;
  }

  // ── Документы ─────────────────────────────────────────────────
  uploadedFiles: { name: string; url: string; type: string }[] = [];
  onFileUpload(event: Event, docName: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const url  = URL.createObjectURL(file);
    const exists = this.uploadedFiles.find(f => f.name === docName);
    if (exists) { exists.url = url; } else { this.uploadedFiles.push({ name: docName, url, type: file.type }); }
    this.cdr.detectChanges();
  }
  openFile(url: string, _type: string) { window.open(url, '_blank'); }
  isUploaded(docName: string)          { return this.uploadedFiles.some(f => f.name === docName); }
  getFile(docName: string)             { return this.uploadedFiles.find(f => f.name === docName) || { url: '', type: '' }; }
  deleteFile(key: string)              { this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== key); this.cdr.detectChanges(); }

  allDocs = [
    { key: 'obrazovanie',  label: 'Документ об образовании' },
    { key: 'stazh',        label: 'Документы, подтверждающие стаж' },
    { key: 'voennaya',     label: 'Документы, подтверждающие прохождение воинской службы' },
    { key: 'lichnost',     label: 'Документ, удостоверяющий личность получателя' },
    { key: 'rozhdenie',    label: 'Документ о рождении' },
    { key: 'registraciya', label: 'Документ, подтверждающий место регистрации' },
    { key: 'akty',         label: 'Справка о регистрации актов гражданского состояния' },
    { key: 'bank',         label: 'Банковский счет' },
    { key: 'spravki',      label: 'Справки' },
  ];

  // ── Навигация ──────────────────────────────────────────────────
  cancel()  { this.router.navigate(['/journals/emd', this.clientId]); }
  goToList(){ this.router.navigate(['/journals/emd']); }
  delete()  {
    if (!confirm('Удалить заявление?')) return;
    if (this.maketId) {
      const makets = loadMakets().filter(m => m.id !== this.maketId);
      saveMakets(makets);
    }
    this.router.navigate(['/journals/emd', this.clientId]);
  }

  // ── Видимость вкладок ─────────────────────────────────────────
  get showAllTabs(): boolean {
    return !this.isNewMode; // существующее заявление — всегда все вкладки
  }
}