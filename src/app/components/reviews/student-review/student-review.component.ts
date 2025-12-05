import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { ReviewService, Review } from '../../../services/review.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-student-review',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './student-review.component.html',
  styleUrl: './student-review.component.css'
})
export class StudentReviewComponent implements OnInit {
  review: Review | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  rating = 0;
  comment = '';

  constructor(
    private reviewService: ReviewService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.loadMyReview();
  }

  loadMyReview() {
    this.isLoading = true;
    this.reviewService.getMyReview().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.review = response.data as Review;
          this.rating = this.review.rating;
          this.comment = this.review.comment || '';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading review:', error);
        this.isLoading = false;
      }
    });
  }

  setRating(rating: number) {
    this.rating = rating;
  }

  submitReview() {
    if (this.rating === 0) {
      this.errorMessage = 'Please select a rating';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const submitAction = this.review
      ? this.reviewService.updateReview(this.rating, this.comment)
      : this.reviewService.createReview(this.rating, this.comment);

    submitAction.subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message || 'Review submitted successfully!';
          this.loadMyReview();
          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while submitting the review';
        this.isSubmitting = false;
      }
    });
  }

  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}

