import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EaesRecord } from './eaes-journal';

@Injectable({ providedIn: 'root' })
export class EaesJournalService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/eaes-journal';
  private apiUrl = '/data/eaes-journal.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EaesRecord[]> {
    return this.http.get<EaesRecord[]>(this.apiUrl);
  }
}