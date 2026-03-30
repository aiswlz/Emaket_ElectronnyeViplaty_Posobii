import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LgotRecord } from './lgot-ministry';

@Injectable({ providedIn: 'root' })
export class LgotMinistryService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/lgot-ministry';
  private apiUrl = '/data/lgot-ministry.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<LgotRecord[]> {
    return this.http.get<LgotRecord[]>(this.apiUrl);
  }
}