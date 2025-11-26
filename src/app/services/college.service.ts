import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface College {
  id: number;
  name: string;
  description?: string;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollegesResponse {
  success: boolean;
  message: string;
  data: {
    colleges: College[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface CollegeResponse {
  success: boolean;
  message: string;
  data: College;
}

@Injectable({
  providedIn: 'root'
})
export class CollegeService {
  private apiUrl = `${environment.apiUrl}/api/colleges`;

  constructor(private http: HttpClient) {}

  getAllColleges(page: number = 1, limit: number = 10): Observable<CollegesResponse> {
    return this.http.get<CollegesResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getCollegeById(id: number): Observable<CollegeResponse> {
    return this.http.get<CollegeResponse>(`${this.apiUrl}/${id}`);
  }

  createCollege(college: { name: string; description?: string }): Observable<CollegeResponse> {
    return this.http.post<CollegeResponse>(this.apiUrl, college);
  }

  updateCollege(id: number, college: { name?: string; description?: string }): Observable<CollegeResponse> {
    return this.http.put<CollegeResponse>(`${this.apiUrl}/${id}`, college);
  }

  deleteCollege(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

