import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { ReviewService, Review } from '../../../services/review.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './admin-reviews.component.html',
  styleUrl: './admin-reviews.component.css'
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  isLoading = false;
  errorMessage = '';
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  total = 0;

  constructor(
    private reviewService: ReviewService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading = true;
    this.errorMessage = '';

    this.reviewService.getAllReviews(this.currentPage, this.limit).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviews = Array.isArray(response.data) ? response.data : [];
          this.total = response.pagination?.total || 0;
          this.totalPages = response.pagination?.totalPages || 1;
          this.filteredReviews = this.reviews;
        } else {
          this.reviews = [];
          this.filteredReviews = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.errorMessage = error.error?.message || 'An error occurred while loading reviews';
        this.isLoading = false;
        this.reviews = [];
        this.filteredReviews = [];
      }
    });
  }

  deleteReview(review: Review) {
    if (!review.id) return;

    this.reviewService.deleteReview(review.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadReviews();
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while deleting the review';
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReviews();
    }
  }

  getStars(rating: number): string[] {
    return Array(rating).fill('⭐').concat(Array(5 - rating).fill('☆'));
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

