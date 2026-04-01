import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DigitizedCaseRecord } from './journal-digitized-cases.component';

@Injectable({ providedIn: 'root' })
export class JournalDigitizedCasesService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/digitized-cases';
  private apiUrl = '/data/digitized-cases.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DigitizedCaseRecord[]> {
    return this.http.get<DigitizedCaseRecord[]>(this.apiUrl);
  }
}