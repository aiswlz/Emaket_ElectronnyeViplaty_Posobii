import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ZayavlenieFormService {

  private apiUrl     = 'http://localhost:8080/api/forma';
  private maketUrl   = 'http://localhost:8080/api/maket';

  constructor(private http: HttpClient) {}

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  getByIin(iin: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/by-iin/${iin}`);
  }
  getClientByIin(iin: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/client/${iin}`);
  }
  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  // Сохраняет макет → создаёт/обновляет m_sol + m_pay в БД
  saveMaketToDB(data: any): Observable<any> {
    return this.http.post<any>(this.maketUrl, data);
  }
}