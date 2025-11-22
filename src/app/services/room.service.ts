import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RoomStudent {
  id: number;
  roomId: number;
  studentId: number;
  checkInDate: string;
  checkOutDate: string | null;
  isActive: boolean;
  student?: {
    id: number;
    name: string;
    email: string;
    college: string;
    phoneNumber?: string;
    user?: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
  room?: {
    id: number;
    roomNumber: string;
    totalBeds: number;
    availableBeds: number;
    status: string;
  };
}

export interface Room {
  id: number;
  roomNumber: string;
  floor: number | null;
  building: string | null;
  totalBeds: number;
  availableBeds: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  description: string | null;
  occupiedBeds?: number;
  createdAt: string;
  updatedAt: string;
  roomStudents?: RoomStudent[];
}

export interface CreateRoomRequest {
  roomNumber: string;
  floor?: number;
  building?: string;
  totalBeds: number;
  description?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

export interface UpdateRoomRequest {
  roomNumber?: string;
  floor?: number;
  building?: string;
  totalBeds?: number;
  description?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

export interface AssignStudentRequest {
  roomId: number;
  studentId: number;
  checkInDate?: string;
}

export interface CheckOutRequest {
  studentId: number;
  checkOutDate?: string;
}

export interface RoomsResponse {
  success: boolean;
  message: string;
  data: {
    rooms: Room[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface RoomResponse {
  success: boolean;
  message: string;
  data: Room;
}

export interface RoomStudentsResponse {
  success: boolean;
  message: string;
  data: RoomStudent[];
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = `${environment.apiUrl}/api/rooms`;

  constructor(private http: HttpClient) {}

  createRoom(room: CreateRoomRequest): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.apiUrl, room);
  }

  getAllRooms(
    page: number = 1,
    limit: number = 10,
    filters?: { status?: string; building?: string; floor?: number }
  ): Observable<RoomsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.building) {
      params = params.set('building', filters.building);
    }
    if (filters?.floor) {
      params = params.set('floor', filters.floor.toString());
    }

    return this.http.get<RoomsResponse>(this.apiUrl, { params });
  }

  getRoomById(id: number): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/${id}`);
  }

  updateRoom(id: number, room: UpdateRoomRequest): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.apiUrl}/${id}`, room);
  }

  deleteRoom(id: number): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }

  assignStudent(assignment: AssignStudentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign`, assignment);
  }

  checkOutStudent(checkout: CheckOutRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/checkout`, checkout);
  }

  getStudentRoom(studentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/student/${studentId}`);
  }

  getRoomStudents(roomId: number, includeInactive: boolean = false): Observable<RoomStudentsResponse> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<RoomStudentsResponse>(`${this.apiUrl}/${roomId}/students`, { params });
  }
}

