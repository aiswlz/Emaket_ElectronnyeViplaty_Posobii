import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GosGuaranteeRecord } from './journal-gos-guarantee';

@Injectable({ providedIn: 'root' })
export class JournalGosGuaranteeService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/gos-guarantee';
  private apiUrl = '/data/gos-guarantee.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<GosGuaranteeRecord[]> {
    return this.http.get<GosGuaranteeRecord[]>(this.apiUrl);
  }
}