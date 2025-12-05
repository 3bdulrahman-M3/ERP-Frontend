import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReviewService, Review } from '../../services/review.service';
import { RoomService } from '../../services/room.service';
import { BuildingService } from '../../services/building.service';
import { MealService } from '../../services/meal.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit, OnDestroy {
  showRegisterModal = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: any = null;
  isAuthenticated = false;

  registerData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  reviews: Review[] = [];
  isLoadingReviews = false;

  promotionalImages: Array<{ url: string; title: string; description?: string }> = [];
  currentSlideIndex = 0;
  slideInterval: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private reviewService: ReviewService,
    private roomService: RoomService,
    private buildingService: BuildingService,
    private mealService: MealService
  ) {}

  ngOnInit() {
    this.checkAuthentication();
    this.loadReviews();
    this.loadPromotionalImages();
    this.startSlideShow();
  }

  checkAuthentication() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = !!this.currentUser;
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.checkAuthentication();
        this.router.navigate(['/']);
      },
      error: () => {
        // Even if logout fails on server, clear local data and navigate
        this.checkAuthentication();
        this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  loadReviews() {
    this.isLoadingReviews = true;
    this.reviewService.getApprovedReviews(6).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviews = Array.isArray(response.data) ? response.data : [];
        }
        this.isLoadingReviews = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.isLoadingReviews = false;
      }
    });
  }

  getStars(rating: number): string[] {
    return Array(rating).fill('⭐').concat(Array(5 - rating).fill('☆'));
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  loadPromotionalImages() {
    const images: Array<{ url: string; title: string; description?: string }> = [];

    // Load rooms with images (load more to get all images)
    this.roomService.getAllRooms(1, 100).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const rooms = Array.isArray(response.data) ? response.data : response.data.rooms || [];
          rooms.forEach((room: any) => {
            // Handle images - could be string, array, or JSON string
            let roomImages: string[] = [];
            if (room.images) {
              if (typeof room.images === 'string') {
                try {
                  const parsed = JSON.parse(room.images);
                  roomImages = Array.isArray(parsed) ? parsed : [room.images];
                } catch (e) {
                  roomImages = [room.images];
                }
              } else if (Array.isArray(room.images)) {
                roomImages = room.images;
              }
            }
            
            if (roomImages.length > 0) {
              roomImages.forEach((img: string) => {
                if (img && img.trim()) {
                  images.push({
                    url: img,
                    title: `Room ${room.roomNumber}`,
                    description: room.buildingInfo?.name || ''
                  });
                }
              });
            }
          });
        }

        // Load buildings with images
        this.buildingService.getBuildings().subscribe({
          next: (buildingResponse) => {
            if (buildingResponse.success && buildingResponse.data) {
              const buildings = Array.isArray(buildingResponse.data) ? buildingResponse.data : [];
              buildings.forEach((building: any) => {
                if (building.image) {
                  images.push({
                    url: building.image,
                    title: building.name,
                    description: building.address || ''
                  });
                }
              });
            }

            // Load meals with images
            this.mealService.getMeals().subscribe({
              next: (mealResponse) => {
                if (mealResponse.success && mealResponse.data) {
                  const meals = Array.isArray(mealResponse.data) ? mealResponse.data : [];
                  meals.forEach((meal: any) => {
                    if (meal.image) {
                      const mealNames: { [key: string]: string } = {
                        breakfast: 'Breakfast',
                        lunch: 'Lunch',
                        dinner: 'Dinner'
                      };
                      images.push({
                        url: meal.image,
                        title: mealNames[meal.name] || meal.name,
                        description: meal.category || ''
                      });
                    }
                  });
                }

                // Shuffle images for variety and use all available images
                this.promotionalImages = images.sort(() => Math.random() - 0.5);
              },
              error: (error) => {
                console.error('Error loading meals:', error);
                this.promotionalImages = images;
              }
            });
          },
          error: (error) => {
            console.error('Error loading buildings:', error);
            this.promotionalImages = images;
          }
        });
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
        this.promotionalImages = images;
      }
    });
  }

  startSlideShow() {
    this.slideInterval = setInterval(() => {
      if (this.promotionalImages.length > 0) {
        this.nextSlide();
      }
    }, 5000); // Change slide every 5 seconds
  }

  nextSlide() {
    if (this.promotionalImages.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.promotionalImages.length;
    }
  }

  previousSlide() {
    if (this.promotionalImages.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex - 1 + this.promotionalImages.length) % this.promotionalImages.length;
    }
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
    // Reset the interval when manually changing slides
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.startSlideShow();
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    // If it's already a full URL, return it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // If it starts with /uploads, add the API URL
    if (imagePath.startsWith('/uploads/')) {
      return `${environment.apiUrl}${imagePath}`;
    }
    // Otherwise, assume it's a filename and construct the URL
    return `${environment.apiUrl}/uploads/${imagePath}`;
  }

  openRegisterModal() {
    this.showRegisterModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.registerData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  submitRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.registerData.name || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;

    this.authService.register({
      name: this.registerData.name,
      email: this.registerData.email,
      password: this.registerData.password
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Save tokens and user
          if (response.data.accessToken && response.data.refreshToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            this.authService.setCurrentUser(response.data.user);
          }
          
          this.successMessage = 'Registration successful! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/complete-profile']);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'An error occurred during registration';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred during registration';
        this.isLoading = false;
      }
    });
  }
}

