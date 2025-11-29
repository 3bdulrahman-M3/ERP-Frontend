import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentInfo } from './room.service';

export interface Student {
  id: number;
  name: string;
  email: string;
  collegeId?: number;
  year?: number;
  age: number;
  phoneNumber: string;
  qrCode: string;
  userId: number;
  profileImage?: string;
  governorate?: string;
  address?: string;
  guardianPhone?: string;
  idCardImage?: string;
  createdAt: string;
  updatedAt: string;
  college?: {
    id: number;
    name: string;
  };
  roomAssignments?: Array<{
    id: number;
    roomId: number;
    studentId: number;
    checkInDate: string;
    checkOutDate?: string;
    isActive: boolean;
    payments?: PaymentInfo[];
    payment?: PaymentInfo | null;
    room?: {
      id: number;
      roomNumber: string;
      building?: string;
      buildingId?: number;
      buildingInfo?: {
        id: number;
        name: string;
        address?: string;
      };
    };
  }>;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    profileImage?: string;
  };
}

export interface CreateStudentRequest {
  name: string;
  email: string;
  password: string;
  collegeId?: number;
  year?: number;
  age: number;
  phoneNumber: string;
  profileImage?: string;
  governorate?: string;
  address?: string;
  guardianPhone?: string;
  idCardImage?: string;
}

export interface UpdateStudentRequest {
  name?: string;
  email?: string;
  password?: string;
  collegeId?: number;
  year?: number;
  age?: number;
  phoneNumber?: string;
  profileImage?: string;
  governorate?: string;
  address?: string;
  guardianPhone?: string;
  idCardImage?: string;
}

export interface StudentsResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface StudentResponse {
  success: boolean;
  message: string;
  data: Student;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = `${environment.apiUrl}/api/students`;

  constructor(private http: HttpClient) {}

  createStudent(student: CreateStudentRequest): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(this.apiUrl, student);
  }

  getAllStudents(page: number = 1, limit: number = 10, excludeAssigned: boolean = false): Observable<StudentsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (excludeAssigned) {
      params = params.set('excludeAssigned', 'true');
    }
    
    return this.http.get<StudentsResponse>(this.apiUrl, { params });
  }

  getStudentById(id: number): Observable<StudentResponse> {
    return this.http.get<StudentResponse>(`${this.apiUrl}/${id}`);
  }

  updateStudent(id: number, student: UpdateStudentRequest): Observable<StudentResponse> {
    return this.http.put<StudentResponse>(`${this.apiUrl}/${id}`, student);
  }

  deleteStudent(id: number): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }

  getStudentsByCollegeAndYear(collegeId?: number, year?: number, page: number = 1, limit: number = 10): Observable<StudentsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (collegeId) {
      params = params.set('collegeId', collegeId.toString());
    }
    if (year) {
      params = params.set('year', year.toString());
    }
    
    return this.http.get<StudentsResponse>(`${this.apiUrl}/filter`, { params });
  }

  completeProfile(data: {
    collegeId: number;
    year: string;
    age?: number | null;
    phoneNumber?: string | null;
  }): Observable<StudentResponse> {
    return this.http.post<StudentResponse>(`${this.apiUrl}/complete-profile`, data);
  }
}

