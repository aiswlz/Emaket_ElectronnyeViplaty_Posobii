import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ElectronicAppRecord } from './journal-electronic-applications';

@Injectable({ providedIn: 'root' })
export class JournalElectronicApplicationsService {

private apiUrl = 'http://localhost:8080/api/zayavki';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ElectronicAppRecord[]> {
    return this.http.get<ElectronicAppRecord[]>(this.apiUrl);
  }
}