import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  id?: number;
  studentId: number;
  rating: number;
  comment?: string;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: number;
    name: string;
    email: string;
    user?: {
      id: number;
      name: string;
      email: string;
      profileImage?: string;
    };
  };
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data?: Review | Review[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewStats {
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/api/reviews`;

  constructor(private http: HttpClient) {}

  // Get approved reviews (public - for landing page)
  getApprovedReviews(limit: number = 10): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/public?limit=${limit}`);
  }

  // Get student's own review
  getMyReview(): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.apiUrl}/my-review`);
  }

  // Create review (student only)
  createReview(rating: number, comment?: string): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.apiUrl, {
      rating,
      comment: comment || null
    });
  }

  // Update review (student only)
  updateReview(rating: number, comment?: string): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.apiUrl}/my-review`, {
      rating,
      comment: comment || null
    });
  }

  // Get all reviews (admin only)
  getAllReviews(page: number = 1, limit: number = 10): Observable<ReviewResponse> {
    const url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    return this.http.get<ReviewResponse>(url);
  }

  // Approve review (admin only)
  approveReview(reviewId: number): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.apiUrl}/${reviewId}/approve`, {});
  }

  // Delete review (admin only)
  deleteReview(reviewId: number): Observable<ReviewResponse> {
    return this.http.delete<ReviewResponse>(`${this.apiUrl}/${reviewId}`);
  }

  // Get review statistics (admin only)
  getReviewStats(): Observable<{ success: boolean; data: ReviewStats }> {
    return this.http.get<{ success: boolean; data: ReviewStats }>(`${this.apiUrl}/stats`);
  }
}

