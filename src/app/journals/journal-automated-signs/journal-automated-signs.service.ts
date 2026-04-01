import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AutoSigningRecord } from './journal-automated-signs.component';

@Injectable({ providedIn: 'root' })
export class JournalAutoSigningService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/auto-signing';
  private apiUrl = '/data/auto-signing.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<AutoSigningRecord[]> {
    return this.http.get<AutoSigningRecord[]>(this.apiUrl);
  }
}