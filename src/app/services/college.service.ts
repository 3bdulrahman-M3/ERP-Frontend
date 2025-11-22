import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface College {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollegesResponse {
  success: boolean;
  message: string;
  data: College[];
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

  getAllColleges(): Observable<CollegesResponse> {
    return this.http.get<CollegesResponse>(this.apiUrl);
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

