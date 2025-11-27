import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Room } from './room.service';

export interface RoomRequest {
  id: number;
  roomId: number;
  studentId: number;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  room?: Room;
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
}

export interface CreateRoomRequestRequest {
  roomId: number;
  notes?: string;
}

export interface MatchingRoomsResponse {
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

export interface RoomRequestsResponse {
  success: boolean;
  message: string;
  data: {
    requests: RoomRequest[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface RoomRequestResponse {
  success: boolean;
  message: string;
  data: RoomRequest;
}

@Injectable({
  providedIn: 'root'
})
export class RoomRequestService {
  private apiUrl = `${environment.apiUrl}/api/room-requests`;

  constructor(private http: HttpClient) {}

  // Get matching rooms for student
  getMatchingRooms(page: number = 1, limit: number = 10): Observable<MatchingRoomsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<MatchingRoomsResponse>(`${this.apiUrl}/matching-rooms`, { params });
  }

  // Get student's requests
  getStudentRequests(page: number = 1, limit: number = 10): Observable<RoomRequestsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<RoomRequestsResponse>(`${this.apiUrl}/my-requests`, { params });
  }

  // Create room request
  createRoomRequest(request: CreateRoomRequestRequest): Observable<RoomRequestResponse> {
    return this.http.post<RoomRequestResponse>(this.apiUrl, request);
  }

  // Get room requests for a specific room (admin)
  getRoomRequests(roomId: number, page: number = 1, limit: number = 10): Observable<RoomRequestsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<RoomRequestsResponse>(`${this.apiUrl}/room/${roomId}`, { params });
  }

  // Accept room request (admin)
  acceptRoomRequest(requestId: number): Observable<RoomRequestResponse> {
    return this.http.put<RoomRequestResponse>(`${this.apiUrl}/${requestId}/accept`, {});
  }

  // Reject room request (admin)
  rejectRoomRequest(requestId: number): Observable<RoomRequestResponse> {
    return this.http.put<RoomRequestResponse>(`${this.apiUrl}/${requestId}/reject`, {});
  }
}

