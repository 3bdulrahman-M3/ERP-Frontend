import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, interval, Subscription } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { RoomService } from '../../services/room.service';
import { MealService, KitchenStatus } from '../../services/meal.service';
import { CheckInOutService } from '../../services/check-in-out.service';
import { LayoutComponent } from '../shared/layout/layout.component';
import { ChatWidgetComponent } from '../chat/chat-widget.component';
import { formatTime12Hour, getCurrentTime12HourShort } from '../../utils/time.util';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, ChatWidgetComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentPageTitle = 'لوحة التحكم';
  isSidebarOpen = true;
  currentRoute = '/dashboard';

  // Statistics
  totalStudents = 0;
  totalRooms = 0;
  availableRooms = 0;
  occupiedRooms = 0;
  isLoadingStats = false;

  // Kitchen data for students (brief)
  kitchenStatus: KitchenStatus | null = null;
  currentTime = '';
  nextMealTime = '';
  isLoadingKitchen = false;
  countdownTimer: { hours: number; minutes: number; seconds: number } | null = null;
  private timeSubscription?: Subscription;
  private kitchenUpdateSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  // Check-in/out status for students
  checkInOutStatus: { isCheckedIn: boolean; checkInTime: string | null; checkOutTime: string | null; status: string | null } | null = null;
  isLoadingStatus = false;
  
  mealNames: { [key: string]: string } = {
    breakfast: 'الإفطار',
    lunch: 'الغداء',
    dinner: 'العشاء'
  };


  menuItems = [
    { icon: '📊', label: 'لوحة التحكم', route: '/dashboard', active: true },
    { icon: '🎓', label: 'الطلاب', route: '/dashboard/students', active: false },
    { icon: '👥', label: 'المستخدمين', route: '/dashboard/users', active: false },
    { icon: '📚', label: 'الدورات', route: '/dashboard/courses', active: false },
    { icon: '📝', label: 'التقارير', route: '/dashboard/reports', active: false },
    { icon: '⚙️', label: 'الإعدادات', route: '/dashboard/settings', active: false },
  ];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private roomService: RoomService,
    private mealService: MealService,
    private checkInOutService: CheckInOutService,
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.currentRoute = this.router.url;
    this.updatePageTitle();
    
    // Load statistics if admin
    if (this.currentUser?.role === 'admin') {
      this.loadStatistics();
    }
    
    // Load kitchen data if student
    if (this.currentUser?.role === 'student') {
      this.loadKitchenData();
      this.loadCheckInOutStatus();
      this.startTimeUpdate();
      // Start countdown timer immediately
      this.countdownSubscription = interval(1000).subscribe(() => {
        this.updateCountdown();
      });
    }
    
    // Update title when route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentRoute = this.router.url;
      this.updatePageTitle();
    });
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
    if (this.kitchenUpdateSubscription) {
      this.kitchenUpdateSubscription.unsubscribe();
    }
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  loadStatistics() {
    this.isLoadingStats = true;

    // Load admin statistics from dedicated endpoint
    this.http.get(`${environment.apiUrl}/api/dashboard/admin/statistics`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalStudents = response.data.totalStudents || 0;
          this.totalRooms = response.data.totalRooms || 0;
          this.availableRooms = response.data.availableRooms || 0;
          this.occupiedRooms = response.data.occupiedRooms || 0;
        }
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoadingStats = false;
      }
    });
  }

  checkStatsLoaded() {
    // Helper method to check if all stats are loaded
  }

  updatePageTitle() {
    const currentRoute = this.router.url;
    
    // Check for exact match first
    let menuItem = this.menuItems.find(item => item.route === currentRoute);
    
    // If no exact match, check if route starts with menu item route
    if (!menuItem) {
      menuItem = this.menuItems.find(item => currentRoute.startsWith(item.route));
    }
    
    if (menuItem) {
      this.currentPageTitle = menuItem.label;
      this.menuItems.forEach(item => {
        item.active = currentRoute.startsWith(item.route);
      });
    } else {
      // Handle nested routes
      if (currentRoute.includes('/students')) {
        if (currentRoute.includes('/new')) {
          this.currentPageTitle = 'إضافة طالب جديد';
        } else if (currentRoute.includes('/edit')) {
          this.currentPageTitle = 'تعديل طالب';
        } else if (currentRoute.match(/\/students\/\d+$/)) {
          this.currentPageTitle = 'تفاصيل الطالب';
        } else {
          this.currentPageTitle = 'الطلاب';
        }
        this.menuItems.forEach(item => {
          item.active = item.route === '/dashboard/students';
        });
      }
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    setTimeout(() => this.updatePageTitle(), 100);
  }

  loadKitchenData() {
    this.isLoadingKitchen = true;
    
    this.mealService.getKitchenStatus().subscribe({
      next: (response) => {
        if (response.success) {
          this.kitchenStatus = response.data;
          this.updateNextMealTime();
          this.updateCountdown();
        }
        this.isLoadingKitchen = false;
      },
      error: (error) => {
        console.error('Error loading kitchen status:', error);
        this.isLoadingKitchen = false;
      }
    });
  }

  startTimeUpdate() {
    // Update current time every second
    this.updateCurrentTime();
    this.timeSubscription = interval(1000).subscribe(() => {
      this.updateCurrentTime();
    });

    // Refresh kitchen status and check-in/out status every 30 seconds
    this.kitchenUpdateSubscription = interval(30000).subscribe(() => {
      this.loadKitchenData();
      this.loadCheckInOutStatus();
    });
  }

  updateCurrentTime() {
    this.currentTime = getCurrentTime12HourShort();
  }

  loadCheckInOutStatus() {
    this.isLoadingStatus = true;
    this.checkInOutService.getCurrentStatus().subscribe({
      next: (response) => {
        if (response.success) {
          this.checkInOutStatus = response.data;
        }
        this.isLoadingStatus = false;
      },
      error: (error) => {
        console.error('Error loading check-in/out status:', error);
        this.isLoadingStatus = false;
      }
    });
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  padNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  formatTime12Hour(time: string): string {
    return formatTime12Hour(time);
  }

  updateNextMealTime() {
    if (this.kitchenStatus?.isOpen && this.kitchenStatus?.currentMeal) {
      // If kitchen is open, show when it closes
      this.nextMealTime = formatTime12Hour(this.kitchenStatus.currentMeal.endTime);
    } else if (this.kitchenStatus?.nextMeal) {
      // If kitchen is closed, show next meal time
      this.nextMealTime = formatTime12Hour(this.kitchenStatus.nextMeal.startTime);
    } else {
      this.nextMealTime = '';
    }
    this.updateCountdown();
  }

  updateCountdown() {
    if (!this.kitchenStatus) {
      this.countdownTimer = null;
      return;
    }

    const now = new Date();
    let targetTime: Date | null = null;

    // If kitchen is open, countdown to when it closes
    if (this.kitchenStatus.isOpen && this.kitchenStatus.currentMeal) {
      const endTimeStr = this.kitchenStatus.currentMeal.endTime;
      const [hours, minutes, seconds] = endTimeStr.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(hours || 0, minutes || 0, seconds || 0, 0);
      
      // If the target time is earlier today, it means it's tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    } else if (this.kitchenStatus.nextMeal) {
      // If kitchen is closed, countdown to next meal
      const startTimeStr = this.kitchenStatus.nextMeal.startTime;
      const [hours, minutes, seconds] = startTimeStr.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(hours || 0, minutes || 0, seconds || 0, 0);
      
      // If the target time is earlier today, it means it's tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }

    if (targetTime) {
      const diff = targetTime.getTime() - now.getTime();
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.countdownTimer = { hours, minutes, seconds };
      } else {
        this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
        // Reload kitchen status when countdown reaches zero
        this.loadKitchenData();
      }
    } else {
      this.countdownTimer = null;
    }
  }

}

