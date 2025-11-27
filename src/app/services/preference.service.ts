import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Preference {
  id?: number;
  userId: number;
  roomType: 'single' | 'shared' | null;
  preferredServices: number[];
}

export interface PreferenceResponse {
  success: boolean;
  message?: string;
  data: Preference;
}

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private apiUrl = `${environment.apiUrl}/api/preferences`;

  constructor(private http: HttpClient) {}

  getPreferences(): Observable<PreferenceResponse> {
    return this.http.get<PreferenceResponse>(this.apiUrl);
  }

  updatePreferences(preferences: Partial<Preference>): Observable<PreferenceResponse> {
    return this.http.put<PreferenceResponse>(this.apiUrl, preferences);
  }
}

