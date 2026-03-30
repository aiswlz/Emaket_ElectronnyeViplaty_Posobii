import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ZayavlenieRecord } from './journal-zayavleniy.component';

@Injectable({ providedIn: 'root' })
export class JournalZayavleniyService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/zayavleniya';
  private apiUrl = '/data/zayavleniya.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ZayavlenieRecord[]> {
    return this.http.get<ZayavlenieRecord[]>(this.apiUrl);
  }
}