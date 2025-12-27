import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReviewService, Review } from '../../services/review.service';
import { RoomService, Room } from '../../services/room.service';
import { LanguageService } from '../../services/language.service';
import { environment } from '../../../environments/environment';
import { filter } from 'rxjs/operators';

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

  randomRooms: Room[] = [];
  isLoadingRooms = false;
  
  private routerSubscription: any;

  // Social Media Links
  socialLinks = {
    facebook: 'https://www.facebook.com',
    whatsapp: 'https://wa.me/',
    instagram: 'https://www.instagram.com',
    linkedin: 'https://www.linkedin.com'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private reviewService: ReviewService,
    private roomService: RoomService,
    public languageService: LanguageService
  ) {}

  ngOnInit() {
    this.checkAuthentication();
    this.loadReviews();
    this.loadRandomRooms();
    
    // Reload rooms when navigating back to this page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        if (event.url === '/' || event.url === '/home') {
          this.loadRandomRooms();
        }
      });
  }

  checkAuthentication() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = !!this.currentUser;
  }

  loadRandomRooms() {
    this.isLoadingRooms = true;
    this.roomService.getAllRooms(1, 100).subscribe({
      next: (response) => {
        this.isLoadingRooms = false;
        if (response.success && response.data) {
          const rooms = Array.isArray(response.data.rooms) ? response.data.rooms : [];
          // Filter available rooms only
          const availableRooms = rooms.filter((room: Room) => 
            room.status === 'available' && room.availableBeds > 0
          );
          
          // Shuffle and take 3 random rooms
          const shuffled = availableRooms.sort(() => Math.random() - 0.5);
          this.randomRooms = shuffled.slice(0, 3);
        }
      },
      error: (error) => {
        this.isLoadingRooms = false;
        console.error('Error loading rooms:', error);
      }
    });
  }

  viewAllRooms() {
    if (this.isAuthenticated) {
      // Navigate to available rooms page for students
      this.router.navigate(['/dashboard/available-rooms']);
    } else {
      // Navigate to login page
      this.router.navigate(['/login']);
    }
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
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
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

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
      // Show placeholder div
      const placeholder = target.nextElementSibling as HTMLElement;
      if (placeholder && placeholder.classList.contains('image-placeholder')) {
        placeholder.style.display = 'flex';
      }
    }
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

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
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

