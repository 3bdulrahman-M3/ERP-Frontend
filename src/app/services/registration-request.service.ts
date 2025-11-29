import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegistrationRequest {
  id?: number;
  name: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  college?: string | null;
  year?: string | null;
  age?: number | null;
  message?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistrationRequestResponse {
  success: boolean;
  message: string;
  data?: RegistrationRequest;
}

export interface RegistrationRequestsResponse {
  success: boolean;
  data: RegistrationRequest[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationRequestService {
  private apiUrl = `${environment.apiUrl}/registration-requests`;

  constructor(private http: HttpClient) {}

  createRequest(request: RegistrationRequest): Observable<RegistrationRequestResponse> {
    return this.http.post<RegistrationRequestResponse>(this.apiUrl, request);
  }

  getRequests(): Observable<RegistrationRequestsResponse> {
    return this.http.get<RegistrationRequestsResponse>(this.apiUrl);
  }

  approveRequest(id: number): Observable<RegistrationRequestResponse> {
    return this.http.post<RegistrationRequestResponse>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectRequest(id: number): Observable<RegistrationRequestResponse> {
    return this.http.post<RegistrationRequestResponse>(`${this.apiUrl}/${id}/reject`, {});
  }
}

