import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Meal {
  id: number;
  name: 'breakfast' | 'lunch' | 'dinner';
  startTime: string;
  endTime: string;
  isActive: boolean;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KitchenStatus {
  isOpen: boolean;
  currentMeal: Meal | null;
  nextMeal: Meal | null;
  timeUntilNextMeal: {
    hours: number;
    minutes: number;
    totalMinutes: number;
  } | null;
  currentTime: string;
}

export interface MealsResponse {
  success: boolean;
  message: string;
  data: Meal[];
}

export interface MealResponse {
  success: boolean;
  message: string;
  data: Meal;
}

export interface KitchenStatusResponse {
  success: boolean;
  message: string;
  data: KitchenStatus;
}

@Injectable({
  providedIn: 'root'
})
export class MealService {
  private apiUrl = `${environment.apiUrl}/api/meals`;

  constructor(private http: HttpClient) {}

  getAllMeals(): Observable<MealsResponse> {
    return this.http.get<MealsResponse>(this.apiUrl);
  }

  getMealById(id: number): Observable<MealResponse> {
    return this.http.get<MealResponse>(`${this.apiUrl}/${id}`);
  }

  createMeal(meal: { name: 'breakfast' | 'lunch' | 'dinner'; startTime: string; endTime: string; isActive?: boolean; category?: string }): Observable<MealResponse> {
    return this.http.post<MealResponse>(this.apiUrl, meal);
  }

  updateMeal(id: number, meal: { name?: 'breakfast' | 'lunch' | 'dinner'; startTime?: string; endTime?: string; isActive?: boolean; category?: string }): Observable<MealResponse> {
    return this.http.put<MealResponse>(`${this.apiUrl}/${id}`, meal);
  }

  deleteMeal(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getKitchenStatus(): Observable<KitchenStatusResponse> {
    return this.http.get<KitchenStatusResponse>(`${this.apiUrl}/status`);
  }
}

