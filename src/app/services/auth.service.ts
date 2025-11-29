import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: 'admin' | 'student';
      isActive: boolean;
    };
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'student';
  isActive: boolean;
  profileImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string | null;
    college?: string | null;
    year?: string | null;
    age?: number | null;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.http.post(`${this.apiUrl}/refresh-token`, {
      refreshToken
    }).pipe(
      tap((response: any) => {
        if (response.success) {
          localStorage.setItem('accessToken', response.data.accessToken);
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
          }
        }
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.clearAuthData();
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }
    return this.http.post(`${this.apiUrl}/logout`, {
      refreshToken
    }).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'student';
  }

  getProfile(): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/profile`).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('user', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
        }
      })
    );
  }

  updateProfile(updateData: { name?: string; email?: string; password?: string; profileImage?: string }): Observable<{ success: boolean; message: string; data: User }> {
    return this.http.put<{ success: boolean; message: string; data: User }>(`${this.apiUrl}/profile`, updateData).pipe(
      tap(response => {
        if (response.success) {
          localStorage.setItem('user', JSON.stringify(response.data));
          this.currentUserSubject.next(response.data);
        }
      })
    );
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
}

