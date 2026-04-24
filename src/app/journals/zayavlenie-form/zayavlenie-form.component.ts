import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ZayavlenieFormService } from './zayavlenie-form.component.service';

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
  id: string;
  iin: string;
  status: MaketStatus;
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

function loadMakets(): EmdMaketRecord[] {
  return JSON.parse(localStorage.getItem('emd-makets') || '[]');
}
function saveMakets(makets: EmdMaketRecord[]) {
  localStorage.setItem('emd-makets', JSON.stringify(makets));
}

@Component({
  selector: 'app-zayavlenie-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zayavlenie-form.component.html',
  styleUrl: './zayavlenie-form.component.scss'
})
export class ZayavlenieFormComponent implements OnInit {

  activeTab: string = 'zayavlenie';
  clientId: string = '';
  maketId: string | null = null;
  isNewMode: boolean = true;
  isBlankMode: boolean = false;
  currentMaket: EmdMaketRecord | null = null;
  status: MaketStatus = 'Новое';
  isPereschet: boolean = false;
  peraschetStep: 'idle' | 'editing' | 'saved' | 'signed' = 'idle';
  reshenieNeedsSign = false;
  private _maketSnapshot: Partial<ZayavlenieFormComponent> | null = null;
  private _recRows: KartaRazmerovRow[] = [];
  private _zdocId: number | null = null;

  isSearchingClient = false;
  clientFound = false;
  clientSearchError = '';

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

  reshenieLang          = 'ru';
  reshenieEcp           = '';
  reshenieOtkazPrichina = '';
  reshenieKomment       = '';

  kartaRows: KartaRazmerovRow[] = [];
  historyRows: HistoryRow[] = [];
  historyUnread = false;
  kgdRows: KgdRow[] = [];

  submitted = false;
  savedMessage = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private formaService: ZayavlenieFormService
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────

  private _toIsoDate(dateStr: string): string | null {
    if (!dateStr) return null;
    if (dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('.');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return null;
  }

  private readonly OSNOVA_CODE_MAP: Record<string, number> = {
    'Соц. выплаты из ГФСС - по беременности и родам': 103,
    'Пенсия: базовая':                                 104,
    'Пенсия: солидарная':                              105,
    'Пособие по инвалидности':                         106,
    'Пособие по потере кормильца':                     107,
    'Дети - многодетные':                              108,
  };

  private _osnovaToCode(osnova: string): number | null {
    const num = Number(osnova);
    if (!isNaN(num) && num > 0) return num;
    return this.OSNOVA_CODE_MAP[osnova] ?? null;
  }

  private _generateNomer(): string {
    return String(Math.floor(800000000 + Math.random() * 100000000));
  }

  // Форматирование даты из бэкенда (ISO → дд.мм.гггг чч:мм:сс)
  private _formatBackendDate(val: any): string {
    if (!val) return '-';
    const s = String(val);
    if (s.includes('T')) {
      const [datePart, timePart] = s.split('T');
      const parts = datePart.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]} ${timePart?.substring(0, 8) || ''}`;
      }
    }
    if (s.includes('-')) {
      const parts = s.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return s;
  }

  // ─── ngOnInit ─────────────────────────────────────────────────

  ngOnInit() {
    const id      = this.route.snapshot.paramMap.get('id') || '';
    const maketId = this.route.snapshot.paramMap.get('maketId');

    this.clientId  = id;
    this.maketId   = maketId;
    this.isNewMode = !maketId;
    this.isBlankMode = !id && !maketId;

    if (this.isNewMode && !this.isBlankMode) {
      this.nomerZayavleniya = this._generateNomer();
    } else if (this.isBlankMode) {
      this.nomerZayavleniya = this._generateNomer();
      const today = new Date().toLocaleDateString('ru-RU');
      this.dateObr       = today;
      this.maketDateObr  = today;
      this.maketDateNazn = today;
    }

    if (id && this.isNewMode) {
      // Новое заявление — только грузим данные клиента
      this.formaService.getClientByIin(id).subscribe({
        next: (client: any) => {
          if (client) {
            this.iin       = client.iin?.toString() || '';
            this.fio       = client.fio             || '';
            this.dateBirth = client.dateBirth       || '';
            this.mobTel    = client.mobTel          || '';
            this.clientFound = true;
          }
          this._generateKgdRows();
          const today = new Date().toLocaleDateString('ru-RU');
          if (!this.dateObr)      this.dateObr      = today;
          if (!this.maketDateObr) this.maketDateObr = today;
          if (!this.maketDateNazn) this.maketDateNazn = today;
          this.cdr.detectChanges();
        },
        error: () => {
          this._generateKgdRows();
          this.cdr.detectChanges();
        }
      });

    } else if (id && !this.isNewMode) {
      // Существующее заявление — грузим по zdocId
      const zdocId = Number(maketId);
      if (!isNaN(zdocId) && zdocId > 0) {
        this.formaService.getById(zdocId).subscribe({
          next: (data: any) => {
            if (data) {
              this._zdocId          = data.id || null;
              this.iin              = data.iin?.toString()    || '';
              this.fio              = data.fio                || '';
              this.dateBirth        = data.dateBirth          || '';
              this.dateObr          = data.dateObr            || '';
              this.datePriem        = data.datePrivem         || '';
              this.yazykZayavl      = data.yazykZayavl        || 'Русский';
              this.domTel           = data.domTel             || '';
              this.mobTel           = data.mobTel             || '';
              this.istochnik        = data.istochnik          || 'Цон';
              this.osnova           = data.osnova?.toString() || '';
              this.vidZayavleniya   = data.vidZayavleniya === 'REC' ? 'Перерасчёт'
                                    : data.vidZayavleniya === 'NEW' ? 'Новое назначение'
                                    : (data.vidZayavleniya || 'Новое назначение');
              this.pribyl           = data.pribyl             || false;
              this.stranaPrib       = data.stranaPrib         || '';
              this.sposobViplaty    = data.sposobViplaty      || '';
              this.maketDateNazn    = data.maketDateNazn      || '';
              this.maketDateOkon    = data.maketDateOkon      || '';
              this.maketNaznSumma   = data.maketNaznSumma     || 0;
              this.nomerZayavleniya = data.nomerZayavleniya   || this._generateNomer();

              // ── Карта размеров из бэкенда ──────────────────────
              if (data.maketNaznSumma) {
                this.kartaRows = [{
                  num:             1,
                  nomerResheniya:  data.nResh || data.nomerZayavleniya || '-',
                  viplata:         data.sposobViplaty || '-',
                  dateNachala:     data.maketDateNazn || '-',
                  dateOkon:        data.maketDateOkon || '-',
                  tipNaznacheniya: data.vidZayavleniya === 'REC'
                                      ? 'REC - перерасчет'
                                      : 'NEW - новое назначение',
                  summa:           Number(data.maketNaznSumma),
                  fio:             data.fio || '',
                  sid:             String(data.solId  || '-'),
                  payId:           String(data.payId  || '-'),
                  pnptId:          String(data.maketId || '-'),
                  isRec:           data.vidZayavleniya === 'REC',
                }];
              }

              // ── История из бэкенда ──────────────────────────────
              if (data.id) {
                this.http.get<any[]>(
                  `http://localhost:8080/api/history/by-zdoc/${data.id}`
                ).subscribe({
                  next: (rows: any[]) => {
                    if (rows && rows.length > 0) {
                      this.historyRows = rows.map(r => ({
                        otd:          '-',
                        date:         r.dat ? this._formatBackendDate(r.dat) : '-',
                        izmenyaemaya: r.fieldName || '-',
                        deystvie:     r.deystvie  || '-',
                        izmOld:       r.oldValue  || '-',
                        izmNew:       r.newValue  || '-',
                        polzovatel:   r.usr       || '-',
                        ipAdres:      '-',
                        host:         '-',
                        imyaUchetnoy: '-',
                        inspektor:    '-',
                      }));
                      this.historyUnread = true;
                      this.cdr.detectChanges();
                    }
                  },
                  error: () => {}
                });
              }
            }

            this._generateKgdRows();
            this._loadExistingMaket(maketId!, id);
            this.cdr.detectChanges();
          },
          error: () => {
            this._loadByIinFallback(id, maketId!);
          }
        });
      } else {
        this._loadByIinFallback(id, maketId!);
      }
    }
  }

  // ─── Поиск клиента по ИИН (blank режим) ───────────────────────

  searchClientByIin() {
    const iin = this.iin.trim();
    this.clientSearchError = '';

    if (!iin || iin.length !== 12 || !/^\d+$/.test(iin)) {
      this.clientSearchError = 'Введите корректный ИИН (12 цифр)';
      return;
    }

    this.isSearchingClient = true;
    this.formaService.getClientByIin(iin).subscribe({
      next: (client: any) => {
        this.isSearchingClient = false;
        if (client) {
          this.fio       = client.fio       || '';
          this.dateBirth = client.dateBirth || '';
          this.mobTel    = client.mobTel    || '';
          this.clientId  = iin;
          this.clientFound = true;
          this._generateKgdRows();
        } else {
          this.clientSearchError = 'Клиент не найден';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSearchingClient = false;
        this.clientSearchError = 'Клиент с данным ИИН не найден в системе';
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Fallback загрузка по IIN ─────────────────────────────────

  private _loadByIinFallback(id: string, maketId: string) {
    this.formaService.getByIin(id).subscribe({
      next: (data: any) => {
        if (data) {
          this._zdocId          = data.id || null;
          this.iin              = data.iin?.toString()    || '';
          this.fio              = data.fio                || '';
          this.dateBirth        = data.dateBirth          || '';
          this.dateObr          = data.dateObr            || '';
          this.datePriem        = data.datePrivem         || '';
          this.yazykZayavl      = data.yazykZayavl        || 'Русский';
          this.domTel           = data.domTel             || '';
          this.mobTel           = data.mobTel             || '';
          this.istochnik        = data.istochnik          || 'Цон';
          this.osnova           = data.osnova?.toString() || '';
          this.vidZayavleniya   = data.vidZayavleniya === 'REC' ? 'Перерасчёт'
                                : data.vidZayavleniya === 'NEW' ? 'Новое назначение'
                                : (data.vidZayavleniya || 'Новое назначение');
          this.pribyl           = data.pribyl             || false;
          this.stranaPrib       = data.stranaPrib         || '';
          this.sposobViplaty    = data.sposobViplaty      || '';
          this.maketDateNazn    = data.maketDateNazn      || '';
          this.maketDateOkon    = data.maketDateOkon      || '';
          this.maketNaznSumma   = data.maketNaznSumma     || 0;
          this.nomerZayavleniya = data.nomerZayavleniya   || this._generateNomer();

          // Карта размеров
          if (data.maketNaznSumma) {
            this.kartaRows = [{
              num:             1,
              nomerResheniya:  data.nResh || data.nomerZayavleniya || '-',
              viplata:         data.sposobViplaty || '-',
              dateNachala:     data.maketDateNazn || '-',
              dateOkon:        data.maketDateOkon || '-',
              tipNaznacheniya: data.vidZayavleniya === 'REC'
                                  ? 'REC - перерасчет'
                                  : 'NEW - новое назначение',
              summa:           Number(data.maketNaznSumma),
              fio:             data.fio || '',
              sid:             String(data.solId  || '-'),
              payId:           String(data.payId  || '-'),
              pnptId:          String(data.maketId || '-'),
              isRec:           data.vidZayavleniya === 'REC',
            }];
          }

          // История
          if (data.id) {
            this.http.get<any[]>(
              `http://localhost:8080/api/history/by-zdoc/${data.id}`
            ).subscribe({
              next: (rows: any[]) => {
                if (rows && rows.length > 0) {
                  this.historyRows = rows.map(r => ({
                    otd:          '-',
                    date:         r.dat ? this._formatBackendDate(r.dat) : '-',
                    izmenyaemaya: r.fieldName || '-',
                    deystvie:     r.deystvie  || '-',
                    izmOld:       r.oldValue  || '-',
                    izmNew:       r.newValue  || '-',
                    polzovatel:   r.usr       || '-',
                    ipAdres:      '-',
                    host:         '-',
                    imyaUchetnoy: '-',
                    inspektor:    '-',
                  }));
                  this.historyUnread = true;
                  this.cdr.detectChanges();
                }
              },
              error: () => {}
            });
          }
        }
        this._generateKgdRows();
        this._loadExistingMaket(maketId, id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.formaService.getClientByIin(id).subscribe({
          next: (client: any) => {
            if (client) {
              this.iin       = client.iin?.toString() || '';
              this.fio       = client.fio             || '';
              this.dateBirth = client.dateBirth       || '';
              this.mobTel    = client.mobTel          || '';
            }
            this._generateKgdRows();
            this._loadExistingMaket(maketId, id);
            const today = new Date().toLocaleDateString('ru-RU');
            if (!this.dateObr)       this.dateObr       = today;
            if (!this.maketDateObr)  this.maketDateObr  = today;
            if (!this.maketDateNazn) this.maketDateNazn = today;
            this.cdr.detectChanges();
          },
          error: () => {
            this._generateKgdRows();
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  // ─── KGD rows ─────────────────────────────────────────────────

  private _generateKgdRows() {
    if (!this.iin) return;
    const today = new Date().toLocaleDateString('ru-RU');
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
        periodS:        `01.${String(q * 3 - 2).padStart(2, '0')}.${year}`,
        periodPo:       `01.${String(q * 3).padStart(2, '0')}.${year}`,
      }))
    );
  }

  // ─── LocalStorage maket ───────────────────────────────────────

  private _loadExistingMaket(maketId: string, iin: string) {
    const makets = loadMakets();
    const maket = makets.find(m => m.id === maketId && m.iin === iin);
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
    this.maketNomerSpravki       = m.maketNomerSpravki;
    this.maketStranaInvalidnosti = m.maketStranaInvalidnosti;
    this.maketDateUstanov      = m.maketDateUstanov;
    this.maketDateOkonDo       = m.maketDateOkonDo;
    this.maketGruppaInvalid    = m.maketGruppaInvalid;
    this.maketPrichinaInvalid  = m.maketPrichinaInvalid;
    this.maketNaznSumma        = m.maketNaznSumma;
    this.maketIdCbd            = m.maketIdCbd;
    this.maketIdEmaket         = m.maketIdEmaket;
    this._buildKartaRows(m);
    this._buildHistoryRows(m);
  }

  private _buildKartaRows(m: EmdMaketRecord) {
    this.kartaRows = [];
    if (m.maketNaznSumma) {
      this.kartaRows.push({
        num: 1, nomerResheniya: m.id, viplata: m.maketIdCbd || '-',
        dateNachala: m.maketDateNazn, dateOkon: m.maketDateOkon || '-',
        tipNaznacheniya: 'NEW - новое назначение', summa: m.maketNaznSumma,
        fio: this.fio, sid: '1234567', payId: '87434123', pnptId: '987654', isRec: false,
      });
    }
    m.peraschetHistory.forEach((p, i) => {
      this.kartaRows.push({
        num: this.kartaRows.length + 1,
        nomerResheniya: m.id + '-REC' + (i + 1),
        viplata: m.maketIdCbd || '-',
        dateNachala: m.maketDateNazn,
        dateOkon: p.dateOkon,
        tipNaznacheniya: 'REC - перерасчет',
        summa: p.summaAfter,
        fio: this.fio,
        sid: '1234567', payId: '87434123', pnptId: '987654',
        isRec: true,
      });
    });
  }

  private _buildHistoryRows(m: EmdMaketRecord) {
    this.historyRows = m.peraschetHistory.map(p => ({
      otd: '1202', date: p.date, izmenyaemaya: 'SUMMA', deystvie: 'Перерасчёт',
      izmOld: String(p.summaBefore), izmNew: String(p.summaAfter),
      polzovatel: 'USER', ipAdres: '10.61.157.41', host: 'emaket-local',
      imyaUchetnoy: 'oracle', inspektor: 'Пользователь системы',
    }));
  }

  private _currentToMaketRecord(): EmdMaketRecord {
    const now = new Date().toLocaleString('ru-RU');
    return {
      id: this.maketId || this._generateNomer(), iin: this.iin, status: this.status,
      nomerZayavleniya: this.nomerZayavleniya, istochnik: this.istochnik, osnova: this.osnova,
      vidZayavleniya: this.vidZayavleniya, dateObr: this.dateObr, datePriem: this.datePriem,
      yazykZayavl: this.yazykZayavl, domTel: this.domTel, email: this.email,
      mobTel: this.mobTel, istMobTel: this.istMobTel, pribyl: this.pribyl,
      stranaPrib: this.stranaPrib, sposobViplaty: this.sposobViplaty, mestoProj: this.mestoProj,
      tipScheta: this.tipScheta, iban: this.iban, bank: this.bank,
      mnogodetMat: this.mnogodetMat, pensionerSIYAP: this.pensionerSIYAP,
      izhdivency: [...this.izhdivency], maketNazvaniePolya: this.maketNazvaniePolya,
      maketDateObr: this.maketDateObr, maketDatePostupleniya: this.maketDatePostupleniya,
      maketDateNazn: this.maketDateNazn, maketDateOkon: this.maketDateOkon,
      maketVedomstvo: this.maketVedomstvo, maketKanikulyarnie: this.maketKanikulyarnie,
      maketNomerSpravki: this.maketNomerSpravki,
      maketStranaInvalidnosti: this.maketStranaInvalidnosti,
      maketDateUstanov: this.maketDateUstanov, maketDateOkonDo: this.maketDateOkonDo,
      maketGruppaInvalid: this.maketGruppaInvalid,
      maketPrichinaInvalid: this.maketPrichinaInvalid,
      maketNaznSumma: this.maketNaznSumma,
      maketIdCbd: this.maketIdCbd, maketIdEmaket: this.maketIdEmaket,
      peraschetHistory: this.currentMaket?.peraschetHistory || [],
      createdAt: this.currentMaket?.createdAt || now, updatedAt: now,
    };
  }

  // ─── Save заявление ───────────────────────────────────────────

  save() {
    this.submitted = true;
    if (!this.iin.trim())                                     { alert('Заполните ИИН'); return; }
    if (this.iin.length !== 12)                               { alert('ИИН — 12 цифр'); return; }
    if (!this.fio.trim())                                     { alert('Заполните ФИО'); return; }
    if (!this.dateBirth.trim() || this.dateBirth.length < 8) { alert('Заполните дату рождения дд.мм.гггг'); return; }
    if (!this.nomerDoc.trim())                                { alert('Заполните № документа'); return; }
    if (!this.kemVidano.trim())                               { alert('Заполните Кем выдано'); return; }

    const today = new Date().toLocaleDateString('ru-RU');
    if (!this.dateObr)      this.dateObr      = today;
    if (!this.maketDateObr) this.maketDateObr = today;

    const payload = {
      iin:              Number(this.iin),
      nomerZayavleniya: this.nomerZayavleniya,
      brid:             '001',
      dateObr:          this._toIsoDate(this.dateObr),
      datePrivem:       this._toIsoDate(this.datePriem),
      yazykZayavl:      this.yazykZayavl || null,
      domTel:           this.domTel      || null,
      mobTel:           this.mobTel      || null,
      istochnik:        this.istochnik   || null,
      vidZayavleniya:   'NEW',
      idOsn:            this._osnovaToCode(this.osnova),
    };

    this.formaService.create(payload).subscribe({
      next: (savedData: any) => {
        if (savedData?.id) this._zdocId = savedData.id;
        this.isNewMode   = false;
        this.isBlankMode = false;
        this.clientId    = this.iin;
        this.activeTab   = 'maket';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Ошибка:', err);
        const msg = err?.error || err?.message || '';
        if (msg.includes('не найден')) {
          alert('Клиент с данным ИИН не найден в базе данных. Сначала найдите клиента через кнопку "Найти клиента".');
        } else {
          alert('Ошибка сохранения: ' + msg);
        }
      }
    });
  }

  // ─── Перерасчёт ───────────────────────────────────────────────

  togglePereschet() {
    if (this.isPereschet) { this._cancelPereschet(); } else { this._startPereschet(); }
  }

  private _startPereschet() {
    this._maketSnapshot = {
      maketNazvaniePolya: this.maketNazvaniePolya, maketDateObr: this.maketDateObr,
      maketDatePostupleniya: this.maketDatePostupleniya, maketDateNazn: this.maketDateNazn,
      maketDateOkon: this.maketDateOkon, maketVedomstvo: this.maketVedomstvo,
      maketKanikulyarnie: this.maketKanikulyarnie, maketNomerSpravki: this.maketNomerSpravki,
      maketStranaInvalidnosti: this.maketStranaInvalidnosti, maketDateUstanov: this.maketDateUstanov,
      maketDateOkonDo: this.maketDateOkonDo, maketGruppaInvalid: this.maketGruppaInvalid,
      maketPrichinaInvalid: this.maketPrichinaInvalid, maketNaznSumma: this.maketNaznSumma,
      vidZayavleniya: this.vidZayavleniya,
    } as any;
    this.vidZayavleniya  = 'Перерасчёт';
    this.isPereschet     = true;
    this.peraschetStep   = 'editing';
    this.activeTab       = 'maket';
    this.cdr.detectChanges();
  }

  private _cancelPereschet() {
    if (!confirm('Отменить перерасчёт? Все изменения будут потеряны.')) return;
    if (this._maketSnapshot) Object.assign(this, this._maketSnapshot);
    this.kartaRows     = this.kartaRows.filter(r => !this._recRows.includes(r));
    this._recRows      = [];
    this._maketSnapshot = null;
    this.isPereschet   = false;
    this.peraschetStep = 'idle';
    this.reshenieNeedsSign = false;
    this.activeTab     = 'zayavlenie';
    this.cdr.detectChanges();
  }

  // ─── Save макет ───────────────────────────────────────────────

  saveMaket() {
    if (!this.isPereschet) {
      const now = new Date().toLocaleString('ru-RU');
      if (this.kartaRows.length === 0 && this.maketNaznSumma) {
        this.kartaRows = [{
          num: 1,
          nomerResheniya: this.maketId || this.nomerZayavleniya || 'NEW',
          viplata: this.maketIdCbd || '-',
          dateNachala: this.maketDateNazn,
          dateOkon: this.maketDateOkon || '-',
          tipNaznacheniya: 'NEW - новое назначение',
          summa: Number(this.maketNaznSumma),
          fio: this.fio,
          sid: '1234567', payId: '87434123', pnptId: '987654',
          isRec: false,
        }];
      }
      if (this.historyRows.length === 0) {
        this.historyRows = [{
          otd: '1202', date: now, izmenyaemaya: 'Z_DOC',
          deystvie: 'Сохранение макета',
          izmOld: '-', izmNew: String(this.maketNaznSumma),
          polzovatel: 'USER', ipAdres: '10.61.157.41',
          host: 'emaket-local', imyaUchetnoy: 'oracle',
          inspektor: 'Пользователь системы',
        }];
        this.historyUnread = true;
      }

      const maketPayload = {
        zdocId:           this._zdocId || null,
        nomerZayavleniya: this.nomerZayavleniya || null,
        brid:             '001',
        sicid:            null,
        idOsn:            this._osnovaToCode(this.osnova),
        naznSumma:        this.maketNaznSumma ? Number(this.maketNaznSumma) : null,
        sposobViplaty:    this.sposobViplaty || null,
        dateNazn:         this._toIsoDate(this.maketDateNazn),
        dateOkon:         this._toIsoDate(this.maketDateOkon),
        iin:              Number(this.iin) || null,
        isPereschet:      false,
      };

      this.formaService.saveMaketToDB(maketPayload).subscribe({
        next: () => {
          this.savedMessage = 'Макет сохранён!';
          setTimeout(() => {
            this.savedMessage = '';
            this.router.navigate(['/journals/emd', this.clientId || this.iin]);
          }, 1500);
        },
        error: () => {
          this.savedMessage = 'Сохранено локально';
          setTimeout(() => {
            this.savedMessage = '';
            this.router.navigate(['/journals/emd', this.clientId || this.iin]);
          }, 1500);
        }
      });
      this.cdr.detectChanges();
      return;
    }

    // Перерасчёт
    if (!this.maketDateOkon) { alert('Укажите дату окончания для перерасчёта'); return; }
    const summaBefore = (this._maketSnapshot as any)?.maketNaznSumma ?? 0;
    const recRow: KartaRazmerovRow = {
      num: this.kartaRows.length + 1,
      nomerResheniya: (this.maketId || 'NEW') + '-REC' + (this._recRows.length + 1),
      viplata: this.maketIdCbd || '-',
      dateNachala: this.maketDateNazn,
      dateOkon: this.maketDateOkon,
      tipNaznacheniya: 'REC - перерасчет',
      summa: Number(this.maketNaznSumma),
      fio: this.fio,
      sid: '1234567', payId: '87434123', pnptId: '987654',
      isRec: true,
    };
    this.kartaRows = [...this.kartaRows, recRow];
    this._recRows.push(recRow);
    const now = new Date().toLocaleString('ru-RU');
    this.historyRows = [{
      otd: '1202', date: now, izmenyaemaya: 'SUMMA', deystvie: 'Перерасчёт',
      izmOld: String(summaBefore), izmNew: String(this.maketNaznSumma),
      polzovatel: 'USER', ipAdres: '10.61.157.41', host: 'emaket-local',
      imyaUchetnoy: 'oracle', inspektor: 'Пользователь системы',
    }, ...this.historyRows];
    this.historyUnread     = true;
    this.peraschetStep     = 'saved';
    this.reshenieNeedsSign = true;
    this.activeTab         = 'reshenie';
    this.cdr.detectChanges();
  }

  // ─── Sign решение ─────────────────────────────────────────────

  signReshenie() {
    const now         = new Date().toLocaleString('ru-RU');
    const summaBefore = Number((this._maketSnapshot as any)?.maketNaznSumma ?? 0);
    const summaAfter  = Number(this.maketNaznSumma);
    if (this.currentMaket) {
      this.currentMaket.peraschetHistory.push({
        date: now, summaBefore, summaAfter,
        dateOkon: this.maketDateOkon, podpisano: true,
      });
      this.currentMaket.maketNaznSumma = summaAfter;
      this.currentMaket.maketDateOkon  = this.maketDateOkon;
      this.currentMaket.updatedAt      = now;
      this._saveMaketToStorage();
    }
    const maketPayload = {
      zdocId: this._zdocId || null,
      nomerZayavleniya: this.nomerZayavleniya || null,
      brid: '001', sicid: null,
      idOsn: this._osnovaToCode(this.osnova),
      naznSumma: summaAfter,
      sposobViplaty: this.sposobViplaty || null,
      dateNazn: this._toIsoDate(this.maketDateNazn),
      dateOkon: this._toIsoDate(this.maketDateOkon),
      iin: Number(this.iin) || null,
      isPereschet: true,
    };
    this.formaService.saveMaketToDB(maketPayload).subscribe({ next: () => {}, error: () => {} });
    this.maketNaznSumma    = summaAfter;
    this.isPereschet       = false;
    this.peraschetStep     = 'idle';
    this.reshenieNeedsSign = false;
    this._maketSnapshot    = null;
    this._recRows          = [];
    alert('Решение подписано! Перерасчёт завершён.');
    setTimeout(() => {
      this.router.navigate(['/journals/emd', this.clientId || this.iin]);
    }, 500);
    this.cdr.detectChanges();
  }

  private _saveMaketToStorage() {
    const makets = loadMakets();
    const record = this._currentToMaketRecord();
    if (this.currentMaket) record.peraschetHistory = this.currentMaket.peraschetHistory;
    const idx = makets.findIndex(m => m.id === record.id);
    if (idx !== -1) { makets[idx] = record; } else { makets.unshift(record); }
    saveMakets(makets);
    this.currentMaket = record;
  }

  // ─── Иждивенцы ────────────────────────────────────────────────

  addIzhdivents() {
    this.izhdivency.push({ otnoshenie: 'Сын/дочь', iin: '', fio: '', dateBirth: '' });
  }
  removeIzhdivents(i: number) { this.izhdivency.splice(i, 1); }

  // ─── Форматирование ───────────────────────────────────────────

  formatDate(event: Event, field: 'dateBirth' | 'dateObr' | 'datePriem') {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 3 && value.length <= 4) value = value.slice(0, 2) + '.' + value.slice(2);
    else if (value.length >= 5) value = value.slice(0, 2) + '.' + value.slice(2, 4) + '.' + value.slice(4, 8);
    input.value = value;
    this[field]  = value;
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

  // ─── Файлы ────────────────────────────────────────────────────

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
  isUploaded(docName: string) { return this.uploadedFiles.some(f => f.name === docName); }
  getFile(docName: string) { return this.uploadedFiles.find(f => f.name === docName) || { url: '', type: '' }; }
  deleteFile(key: string) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== key);
    this.cdr.detectChanges();
  }

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

  // ─── Навигация ────────────────────────────────────────────────

  cancel() {
    if (this.isBlankMode || !this.clientId) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/journals/emd', this.clientId]);
    }
  }

  goToList() { this.router.navigate(['/journals/emd']); }

  delete() {
    if (!confirm('Удалить заявление?')) return;
    if (this.maketId) {
      const makets = loadMakets().filter(m => m.id !== this.maketId);
      saveMakets(makets);
    }
    if (this.clientId) {
      this.router.navigate(['/journals/emd', this.clientId]);
    } else {
      this.router.navigate(['/home']);
    }
  }

  get showAllTabs(): boolean { return !this.isNewMode && !this.isBlankMode; }
}