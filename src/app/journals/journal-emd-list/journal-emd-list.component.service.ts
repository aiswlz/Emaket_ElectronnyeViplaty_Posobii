import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmdListRecord } from './journal-emd-list.component';

@Injectable({ providedIn: 'root' })
export class JournalEmdListService {

  private apiUrl = 'http://localhost:8080/api/emd';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EmdListRecord[]> {
    return this.http.get<EmdListRecord[]>(this.apiUrl);
  }
}