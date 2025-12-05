import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'visa' | 'bank_transfer' | 'other';

export interface PaymentInfo {
  id: number;
  roomId: number;
  studentId: number;
  roomStudentId: number;
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string | null;
}

export interface RoomStudent {
  id: number;
  roomId: number;
  studentId: number;
  checkInDate: string;
  checkOutDate: string | null;
  isActive: boolean;
  payments?: PaymentInfo[];
  payment?: PaymentInfo | null;
  student?: {
    id: number;
    name: string;
    email: string;
    year?: number;
    college?: {
      id: number;
      name: string;
    };
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
  building: string | null; // Old field for backward compatibility
  buildingId?: number | null;
  buildingInfo?: {
    id: number;
    name: string;
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
    floors?: number;
  } | null;
  totalBeds: number;
  availableBeds: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  roomType?: 'single' | 'shared';
  roomPrice?: number | string;
  bedPrice?: number | string;
  description: string | null;
  images?: string[];
  occupiedBeds?: number;
  hasPendingRequest?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'rejected' | null;
  pendingRequestsCount?: number;
  createdAt: string;
  updatedAt: string;
  roomStudents?: RoomStudent[];
  services?: Array<{
    id: number;
    name: string;
    description?: string;
    icon?: string;
  }>;
  requests?: Array<{
    id: number;
    roomId: number;
    studentId: number;
    status: 'pending' | 'accepted' | 'rejected';
    notes?: string | null;
    createdAt: string;
    student?: {
      id: number;
      name: string;
      email: string;
      user?: {
        id: number;
        name: string;
        email: string;
      };
      college?: {
        id: number;
        name: string;
      };
    };
  }>;
}

export interface CreateRoomRequest {
  roomNumber: string;
  floor?: number;
  buildingId?: number;
  totalBeds: number;
  roomType?: 'single' | 'shared';
  roomPrice?: number;
  bedPrice?: number;
  description?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
  serviceIds?: number[];
  images?: string[];
}

export interface UpdateRoomRequest {
  roomNumber?: string;
  floor?: number;
  buildingId?: number;
  totalBeds?: number;
  roomType?: 'single' | 'shared';
  roomPrice?: number;
  bedPrice?: number;
  description?: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved';
  serviceIds?: number[];
  images?: string[];
}

export interface AssignStudentRequest {
  roomId: number;
  studentId: number;
  checkInDate?: string;
  payment?: {
    amountDue?: number | null;
    amountPaid?: number | null;
    paymentMethod?: PaymentMethod;
    paymentDate?: string;
    notes?: string | null;
  };
  forceCheckout?: boolean;
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

  getMyRoom(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-room`);
  }

  getRoomStudents(roomId: number, includeInactive: boolean = false): Observable<RoomStudentsResponse> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<RoomStudentsResponse>(`${this.apiUrl}/${roomId}/students`, { params });
  }
}

