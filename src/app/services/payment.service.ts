import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentInfo, PaymentMethod, PaymentStatus } from './room.service';

export interface PaymentRecord extends PaymentInfo {
  student?: {
    id: number;
    name: string;
    email: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  room?: {
    id: number;
    roomNumber: string;
    roomType?: string;
  };
  assignment?: {
    id: number;
    checkInDate: string;
    checkOutDate?: string;
    isActive: boolean;
  };
}

export interface PaymentsResponse {
  success: boolean;
  message: string;
  data: PaymentRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FinancialReport {
  payments: PaymentRecord[];
  totals: {
    totalDue: number;
    totalPaid: number;
    totalRemaining: number;
    methods: {
      [key: string]: {
        totalPaid: number;
        count: number;
      };
    };
  };
}

export interface FinancialReportResponse {
  success: boolean;
  message: string;
  data: FinancialReport;
}

export interface PaymentPayload {
  roomStudentId: number;
  roomId?: number;
  studentId?: number;
  amountDue?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  notes?: string;
  status?: PaymentStatus;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/payments`;

  constructor(private http: HttpClient) {}

  savePayment(payload: PaymentPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  updatePayment(id: number, payload: Partial<PaymentPayload>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  addPayment(id: number, amount: number, paymentMethod: PaymentMethod, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/add`, {
      amount,
      paymentMethod,
      notes,
      paymentDate: new Date().toISOString()
    });
  }

  getPayments(filters: any = {}, page: number = 1, limit: number = 20): Observable<PaymentsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    Object.keys(filters || {}).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<PaymentsResponse>(this.apiUrl, { params });
  }

  getFinancialReport(filters: any = {}): Observable<FinancialReportResponse> {
    let params = new HttpParams();
    Object.keys(filters || {}).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get<FinancialReportResponse>(`${this.apiUrl}/report/financial`, { params });
  }
}

