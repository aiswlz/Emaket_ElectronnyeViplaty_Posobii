import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmdDetail {
  summa: string;
  viplata: string;
  dateObr: string;
  dateNazn: string;
  nomerDela: string;
  status: string;
}

export interface EmdMaket {
  id: number;
  osnova: string;
  dateReg: string;
  tip: string;
  recordId: string;
  fio: string;
  nomerZayavleniya: string;
  otdelenie: string;
  expanded: boolean;
  detail: EmdDetail;
}

export interface EmdClient {
  id: number;
  iin: string;
  fio: string;
  dob: string;
  address: string;
  udostoverenie: string;
  pensionAge2025: string;
  pensionAge2026: string;
  makets: EmdMaket[];
  history: any[];
  requests: any[];
  scan: any[];
}

@Injectable({ providedIn: 'root' })
export class JournalEmdService {

  private apiUrl = 'http://localhost:8080/api/emd';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EmdClient[]> {
    return this.http.get<EmdClient[]>(this.apiUrl);
  }
}