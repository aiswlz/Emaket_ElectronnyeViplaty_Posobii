import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ElectronicAppRecord } from './journal-electronic-applications';

@Injectable({ providedIn: 'root' })
export class JournalElectronicApplicationsService {

  // Заглушка — читаем локальный JSON
  // Когда появится API — меняем только эту строку:
  // private apiUrl = 'https://your-api.com/api/electronic-apps';
  private apiUrl = '/data/electronic-apps.json';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ElectronicAppRecord[]> {
    return this.http.get<ElectronicAppRecord[]>(this.apiUrl);
  }
}