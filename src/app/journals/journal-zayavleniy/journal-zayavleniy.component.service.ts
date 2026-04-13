import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ZayavlenieRecord } from './journal-zayavleniy.component';

@Injectable({ providedIn: 'root' })
export class JournalZayavleniyService {
private apiUrl = 'http://localhost:8080/api/zayavleniya';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ZayavlenieRecord[]> {
    return this.http.get<ZayavlenieRecord[]>(this.apiUrl);
  }
}