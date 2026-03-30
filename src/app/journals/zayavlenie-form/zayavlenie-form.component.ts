import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Izhdivents {
  otnoshenie: string;
  iin: string;
  fio: string;
  dateBirth: string;
}

@Component({
  selector: 'app-zayavlenie-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zayavlenie-form.component.html',
  styleUrl: './zayavlenie-form.component.scss'
})
export class ZayavlenieFormComponent implements OnInit {

  clientId: string = '';

  // Шапка
  nomerZayavleniya = '876545678';
  istochnik        = 'Цон';
  osnova           = 'Соц. выплаты из ГФСС - по беременности и родам';
  vidZayavleniya   = 'Новое назначение';

  // Информация о заявителе
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

  // Банковские реквизиты
  sposobViplaty = '';
  mestoProj     = '01-Собственное жильё';
  tipScheta     = 'kart';
  iban          = '';
  bank          = '';

  // Доп сведения
  mnogodetMat  = false;
  pensionerSIYAP = false;

  // Иждивенцы
  izhdivency: Izhdivents[] = [
    { otnoshenie: 'Сын/дочь', iin: '-', fio: '-', dateBirth: '-' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.clientId = id;

    // Если это новый клиент — поля пустые
    if (id === 'new') return;

    // Сначала ищем в JSON
    this.http.get<any[]>('/data/emd.json').subscribe({
      next: (data) => {
        let client = data.find(c => c.iin === id);

        // Если не нашли в JSON — ищем в localStorage
        if (!client) {
          const savedClients = JSON.parse(localStorage.getItem('emd-new-clients') || '[]');
          client = savedClients.find((c: any) => c.iin === id);
        }

        if (client) {
          this.iin       = client.iin           || '';
          this.fio       = client.fio           || '';
          this.dateBirth = client.dob           || '';
          this.address   = client.address       || '';
          this.nomerDoc  = client.udostoverenie || '';
        }

        this.cdr.detectChanges();
      }
    });
  }

  addIzhdivents() {
    this.izhdivency.push({ otnoshenie: 'Сын/дочь', iin: '', fio: '', dateBirth: '' });
  }

  removeIzhdivents(i: number) {
    this.izhdivency.splice(i, 1);
  }
  submitted = false;

  save() {
    const newRecord = {
      dateObr:          this.dateObr || new Date().toLocaleDateString('ru-RU'),
      dateStatus:       new Date().toLocaleDateString('ru-RU'),
      status:           'Новое',
      kodOtd:           '001',
      iin:              this.iin,
      fio:              this.fio,
      dateBirth:        this.dateBirth,
      istochnik:        this.istochnik,
      osnova:           this.osnova,
      vidZayavleniya:   this.vidZayavleniya,
      nomerZayavleniya: this.nomerZayavleniya,
      dateNazn:         '-',
      dateOkon:         '-',
      srokOkazaniya:    '-',
      viplata:          '-',
      naznRazmer:       '-',
      dateRiska:        '-',
      specialist:       '-',
      podpisant:        '-'
    };

    this.submitted = true;
    if (!this.iin.trim()) {
      alert('Заполните поле ИИН');
      return;
    }
    if (this.iin.length !== 12) {
      alert('ИИН должен содержать 12 цифр');
      return;
    }
    if (!this.fio.trim()) {
      alert('Заполните поле ФИО');
      return;
    }
    if (!this.dateBirth.trim() || this.dateBirth.length !== 10) {
      alert('Заполните дату рождения в формате дд.мм.гггг');
      return;
    }
    if (!this.nomerDoc.trim()) {
      alert('Заполните № документа, удост. личность');
      return;
    }
    if (!this.kemVidano.trim()) {
      alert('Заполните поле Кем выдано');
      return;
    }
    // Сохраняем заявление в список
    const existing = JSON.parse(localStorage.getItem('emd-new-records') || '[]');
    existing.unshift(newRecord);
    localStorage.setItem('emd-new-records', JSON.stringify(existing));

    // Сохраняем нового клиента если его нет в emd-clients
    const clients = JSON.parse(localStorage.getItem('emd-new-clients') || '[]');
    const alreadyExists = clients.find((c: any) => c.iin === this.iin);
    if (!alreadyExists) {
      const newClient = {
        id:            Date.now(),
        iin:           this.iin,
        fio:           this.fio,
        dob:           this.dateBirth,
        address:       this.address,
        udostoverenie: this.nomerDoc,
        pensionAge2025: '-',
        pensionAge2026: '-',
        makets:        [],
        history:       [],
        requests:      [],
        scan:          []
      };
      clients.push(newClient);
      localStorage.setItem('emd-new-clients', JSON.stringify(clients));
    }

    alert('Заявление зарегистрировано!');
    this.router.navigate(['/journals/emd', this.iin]);
  }

  formatDate(event: Event, field: 'dateBirth' | 'dateObr' | 'datePriem') {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // убираем всё кроме цифр

    if (value.length >= 3 && value.length <= 4) {
      value = value.slice(0, 2) + '.' + value.slice(2);
    } else if (value.length >= 5) {
      value = value.slice(0, 2) + '.' + value.slice(2, 4) + '.' + value.slice(4, 8);
    }

    input.value = value;
    this[field] = value;
  }

  formatPhone(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // только цифры

    // Убираем ведущие 7 или 8
    if (value.startsWith('8') || value.startsWith('7')) {
      value = value.slice(1);
    }

    let formatted = '+7';
    if (value.length > 0) formatted += ' (' + value.slice(0, 3);
    if (value.length >= 3) formatted += ')';
    if (value.length >= 4) formatted += ' ' + value.slice(3, 6);
    if (value.length >= 7) formatted += '-' + value.slice(6, 8);
    if (value.length >= 9) formatted += '-' + value.slice(8, 10);

    input.value = formatted;
    this.mobTel = formatted;
  }

  // Загруженные файлы
  uploadedFiles: { name: string; url: string; type: string }[] = [];
  showFiles = false;

  onFileUpload(event: Event, docName: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const url = URL.createObjectURL(file);
    
    // Проверяем не загружен ли уже
    const exists = this.uploadedFiles.find(f => f.name === docName);
    if (exists) {
      exists.url = url;
    } else {
      this.uploadedFiles.push({ name: docName, url, type: file.type });
    }
    this.cdr.detectChanges();
  }

  openFile(url: string, type: string) {
    window.open(url, '_blank');
  }

  isUploaded(docName: string): boolean {
    return this.uploadedFiles.some(f => f.name === docName);
  }

  allDocs = [
    { key: 'obrazovanie',  label: 'Документ об образовании' },
    { key: 'stazh',        label: 'Документы, подтверждающие стаж' },
    { key: 'voennaya',     label: 'Документы, подтверждающие прохождение воинской службы' },
    { key: 'lichnost',     label: 'Документ, удостоверяющий личность получателя' },
    { key: 'rozhdenie',    label: 'Документ о рождении' },
    { key: 'registraciya', label: 'Документ, подтверждающий место регистрации по постоянному месту жительства' },
    { key: 'akty',         label: 'Справка о регистрации актов гражданского состояния' },
    { key: 'bank',         label: 'Банковский счет' },
    { key: 'spravki',      label: 'Справки' },
  ];
  
  deleteFile(key: string) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== key);
    this.cdr.detectChanges();
  }

  getFile(key: string) {
    return this.uploadedFiles.find(f => f.name === key) || { url: '', type: '' };
  }

  cancel() {
    this.router.navigate(['/journals/emd', this.clientId]);
  }

  goToList() {
    this.router.navigate(['/journals/emd']);
  }

  delete() {
    if (confirm('Удалить заявление?')) {
      this.router.navigate(['/journals/emd', this.clientId]);
    }
  }
}