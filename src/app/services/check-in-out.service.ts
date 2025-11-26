import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckInOutRecord {
  id: number;
  studentId: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  date: string;
  status: 'checked_in' | 'checked_out';
  notes?: string | null;
  student?: {
    id: number;
    name: string;
    email: string;
    year?: number;
    college?: {
      id: number;
      name: string;
    };
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CheckInOutResponse {
  success: boolean;
  message: string;
  data: CheckInOutRecord;
}

export interface CheckInOutListResponse {
  success: boolean;
  message: string;
  data: {
    records: CheckInOutRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CheckInOutRequest {
  studentId?: number;
  qrData?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckInOutService {
  private apiUrl = `${environment.apiUrl}/api/check-in-out`;

  constructor(private http: HttpClient) {}

  checkIn(studentId: number, notes?: string): Observable<CheckInOutResponse> {
    return this.http.post<CheckInOutResponse>(`${this.apiUrl}/check-in`, {
      studentId,
      notes
    });
  }

  checkOut(studentId: number, notes?: string): Observable<CheckInOutResponse> {
    return this.http.post<CheckInOutResponse>(`${this.apiUrl}/check-out`, {
      studentId,
      notes
    });
  }

  checkInOutByQR(qrData: string, notes?: string): Observable<CheckInOutResponse> {
    return this.http.post<CheckInOutResponse>(`${this.apiUrl}/qr-scan`, {
      qrData,
      notes
    });
  }

  getAllRecords(page: number = 1, limit: number = 10, filters?: {
    date?: string;
    status?: string;
    studentId?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<CheckInOutListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters) {
      if (filters.date) params = params.set('date', filters.date);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.studentId) params = params.set('studentId', filters.studentId.toString());
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http.get<CheckInOutListResponse>(this.apiUrl, { params });
  }

  getTodayCheckIns(): Observable<{ success: boolean; message: string; data: CheckInOutRecord[] }> {
    return this.http.get<{ success: boolean; message: string; data: CheckInOutRecord[] }>(`${this.apiUrl}/today`);
  }

  getStudentHistory(studentId: number, page: number = 1, limit: number = 10): Observable<CheckInOutListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CheckInOutListResponse>(`${this.apiUrl}/student/${studentId}`, { params });
  }

  getCurrentStatus(): Observable<{ success: boolean; message: string; data: { isCheckedIn: boolean; checkInTime: string | null; checkOutTime: string | null; status: string | null } }> {
    return this.http.get<{ success: boolean; message: string; data: { isCheckedIn: boolean; checkInTime: string | null; checkOutTime: string | null; status: string | null } }>(`${this.apiUrl}/current-status`);
  }

  getMyHistory(page: number = 1, limit: number = 10): Observable<CheckInOutListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<CheckInOutListResponse>(`${this.apiUrl}/my-history`, { params });
  }

  searchStudents(query: string, limit: number = 5): Observable<{ success: boolean; message: string; data: any[] }> {
    let params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<{ success: boolean; message: string; data: any[] }>(`${this.apiUrl}/search-students`, { params });
  }
}

