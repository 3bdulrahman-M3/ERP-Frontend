import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Building {
  id: number;
  name: string;
  address?: string;
  mapUrl?: string;
  floors?: number;
  roomCount?: number;
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuildingsResponse {
  success: boolean;
  message: string;
  data: {
    buildings: Building[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface BuildingResponse {
  success: boolean;
  message: string;
  data: {
    building: Building;
  };
}

export interface CreateBuildingRequest {
  name: string;
  address?: string;
  mapUrl?: string;
  floors?: number;
}

export interface UpdateBuildingRequest {
  name?: string;
  address?: string;
  mapUrl?: string;
  floors?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuildingService {
  private apiUrl = `${environment.apiUrl}/api/buildings`;

  constructor(private http: HttpClient) {}

  getAllBuildings(page: number = 1, limit: number = 10): Observable<BuildingsResponse> {
    return this.http.get<BuildingsResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getBuildingById(id: number): Observable<BuildingResponse> {
    return this.http.get<BuildingResponse>(`${this.apiUrl}/${id}`);
  }

  createBuilding(building: CreateBuildingRequest): Observable<BuildingResponse> {
    return this.http.post<BuildingResponse>(this.apiUrl, building);
  }

  updateBuilding(id: number, building: UpdateBuildingRequest): Observable<BuildingResponse> {
    return this.http.put<BuildingResponse>(`${this.apiUrl}/${id}`, building);
  }

  deleteBuilding(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
