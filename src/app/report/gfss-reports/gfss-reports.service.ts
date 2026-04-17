import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DAction {
  id: number;
  actionType: number;
  nameRus: string;
  nameKaz: string;
  parentId: number | null;
  typeRep: string | null;
  repId: number | null;
  cmd: string | null;
  async: string | null;
  ord: number;
  lev1: string | null;     
  lev1Kz: string | null;
  children?: DAction[];
  expanded?: boolean;
}

export interface OrderRequest {
  idReport: number;
  empId: number;
  params: string;
  begDate: string;
  endDate: string;
}

export interface OrderResponse {
  id: number;
  idReport: number;
  status: number;
  report: string | null;
  err: string | null;
  dat: string;
}

@Injectable({ providedIn: 'root' })
export class GfssReportsService {

  private readonly API = 'http://localhost:8080/api/reports';

  constructor(private http: HttpClient) {}

  getActions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/gfss`);
  }

  createOrder(req: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.API}/order`, req);
  }

  getOrder(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.API}/order/${id}`);
  }
}