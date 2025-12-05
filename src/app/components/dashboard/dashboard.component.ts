import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, NgZone } from '@angular/core';
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
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  currentPageTitle = 'Dashboard';
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
  private isReloadingKitchen = false; // Flag to prevent multiple simultaneous reloads
  private timeSubscription?: Subscription;
  private kitchenUpdateSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  // Check-in/out status for students
  checkInOutStatus: { isCheckedIn: boolean; checkInTime: string | null; checkOutTime: string | null; status: string | null } | null = null;
  isLoadingStatus = false;
  
  // Student room information
  studentRoomInfo: {
    roomNumber?: string;
    buildingName?: string;
    buildingId?: number;
    floor?: number;
  } | null = null;
  isLoadingRoomInfo = false;
  
  // Student profile information
  studentInfo: {
    college?: string;
    year?: number;
    age?: number;
    phoneNumber?: string;
  } | null = null;
  
  mealNames: { [key: string]: string } = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner'
  };


  menuItems = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard', active: true },
    { icon: '🎓', label: 'Students', route: '/dashboard/students', active: false },
    { icon: '👥', label: 'Users', route: '/dashboard/users', active: false },
    { icon: '📚', label: 'Courses', route: '/dashboard/courses', active: false },
    { icon: '📝', label: 'Reports', route: '/dashboard/reports', active: false },
    { icon: '⚙️', label: 'Settings', route: '/dashboard/settings', active: false },
  ];

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private roomService: RoomService,
    private mealService: MealService,
    private checkInOutService: CheckInOutService,
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.currentRoute = this.router.url;
    this.updatePageTitle();
    
    // Check if student has profile, if not redirect to complete profile
    if (this.currentUser?.role === 'student') {
      this.checkStudentProfile();
    }
    
    // Load statistics if admin
    if (this.currentUser?.role === 'admin') {
      this.loadStatistics();
    }
    
    // Update title when route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentRoute = this.router.url;
      this.updatePageTitle();
    });
  }

  checkStudentProfile() {
    this.http.get(`${environment.apiUrl}/api/dashboard/check-student-profile`).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (!response.hasProfile) {
            // Student doesn't have profile, redirect to complete profile
            this.router.navigate(['/complete-profile']);
          } else {
            // Student has profile, load dashboard data
            this.loadKitchenData();
            this.loadCheckInOutStatus();
            this.loadStudentRoomInfo();
            this.startTimeUpdate();
          }
        }
      },
      error: (error) => {
        console.error('Error checking student profile:', error);
        // On error, try to load dashboard anyway
        this.loadKitchenData();
        this.loadCheckInOutStatus();
        this.loadStudentRoomInfo();
        this.startTimeUpdate();
      }
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
        requestAnimationFrame(() => {
          this.cdr.markForCheck();
        });
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.isLoadingStats = false;
        requestAnimationFrame(() => {
          this.cdr.markForCheck();
        });
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
          this.currentPageTitle = 'Add New Student';
        } else if (currentRoute.includes('/edit')) {
          this.currentPageTitle = 'Edit Student';
        } else if (currentRoute.match(/\/students\/\d+$/)) {
          this.currentPageTitle = 'Student Details';
        } else {
          this.currentPageTitle = 'Students';
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
    if (this.isReloadingKitchen) {
      return; // Prevent multiple simultaneous reloads
    }
    
    this.isLoadingKitchen = true;
    
    this.mealService.getKitchenStatus().subscribe({
      next: (response) => {
        if (response.success) {
          const previousStatus = this.kitchenStatus?.isOpen;
          const previousCurrentMealId = this.kitchenStatus?.currentMeal?.id;
          const previousNextMealId = this.kitchenStatus?.nextMeal?.id;
          const previousCurrentMealEndTime = this.kitchenStatus?.currentMeal?.endTime;
          const previousNextMealStartTime = this.kitchenStatus?.nextMeal?.startTime;
          
          // Check if data actually changed before updating
          const newStatus = response.data;
          const statusChanged = previousStatus !== newStatus.isOpen;
          const currentMealChanged = previousCurrentMealId !== newStatus.currentMeal?.id;
          const nextMealChanged = previousNextMealId !== newStatus.nextMeal?.id;
          const currentMealTimeChanged = previousCurrentMealEndTime !== newStatus.currentMeal?.endTime;
          const nextMealTimeChanged = previousNextMealStartTime !== newStatus.nextMeal?.startTime;
          const hasChanges = statusChanged || currentMealChanged || nextMealChanged || currentMealTimeChanged || nextMealTimeChanged;
          
          if (hasChanges) {
            // Only update if something actually changed
            this.kitchenStatus = newStatus;
            
            // Update next meal time and countdown only if needed
            this.updateNextMealTime();
            this.updateCountdown();
            
            // Trigger change detection only if status or meal changed (not just time)
            if (statusChanged || currentMealChanged || nextMealChanged) {
              requestAnimationFrame(() => {
                this.cdr.markForCheck();
              });
            }
          }
          // If no changes, don't trigger change detection at all
        }
        this.isLoadingKitchen = false;
        this.isReloadingKitchen = false;
        // Don't trigger change detection here - only trigger if data actually changed
      },
      error: (error) => {
        console.error('Error loading kitchen status:', error);
        this.isLoadingKitchen = false;
        this.isReloadingKitchen = false;
        // Only trigger change detection on error if needed
      }
    });
  }

  startTimeUpdate() {
    // Update current time every second (only if needed for display)
    // Note: We removed this to reduce re-renders since currentTime is not displayed in the template
    
    // Refresh kitchen status and check-in/out status every 30 seconds to reduce API calls and re-renders
    // Run outside Angular zone to prevent automatic change detection
    this.ngZone.runOutsideAngular(() => {
      this.kitchenUpdateSubscription = interval(30000).subscribe(() => {
        if (!this.isReloadingKitchen) {
          this.loadKitchenData();
        }
        // Only reload check-in/out status if needed (less frequently)
        // this.loadCheckInOutStatus(); // Commented to reduce re-renders
      });
    });
    
    // Update countdown every second (but only trigger change detection when needed)
    // Run outside Angular zone to prevent automatic change detection
    this.ngZone.runOutsideAngular(() => {
      this.countdownSubscription = interval(1000).subscribe(() => {
        const previousTimer = this.countdownTimer ? { ...this.countdownTimer } : null;
        this.updateCountdown();
        
        // Only trigger change detection if countdown actually changed
        if (previousTimer && this.countdownTimer) {
          const changed = previousTimer.hours !== this.countdownTimer.hours ||
                         previousTimer.minutes !== this.countdownTimer.minutes ||
                         previousTimer.seconds !== this.countdownTimer.seconds;
          if (changed) {
            // Run change detection inside Angular zone only when needed
            this.ngZone.run(() => {
              this.cdr.markForCheck();
            });
          }
        } else if (previousTimer !== this.countdownTimer) {
          this.ngZone.run(() => {
            this.cdr.markForCheck();
          });
        }
      });
    });
  }

  updateCurrentTime() {
    // Only update if time actually changed (to reduce re-renders)
    const newTime = getCurrentTime12HourShort();
    if (newTime !== this.currentTime) {
      this.currentTime = newTime;
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        this.cdr.markForCheck();
      });
    }
  }

  loadCheckInOutStatus() {
    this.isLoadingStatus = true;
    this.checkInOutService.getCurrentStatus().subscribe({
      next: (response) => {
        if (response.success) {
          this.checkInOutStatus = response.data;
        }
        this.isLoadingStatus = false;
        requestAnimationFrame(() => {
          this.cdr.markForCheck();
        });
      },
      error: (error) => {
        console.error('Error loading check-in/out status:', error);
        this.isLoadingStatus = false;
        requestAnimationFrame(() => {
          this.cdr.markForCheck();
        });
      }
    });
  }

  loadStudentRoomInfo() {
    if (this.currentUser?.role !== 'student') {
      return;
    }
    
    this.isLoadingRoomInfo = true;
    
    // Load room info and student info in parallel
    this.roomService.getMyRoom().subscribe({
      next: (response: any) => {
        if (response.success) {
          // Extract room information
          if (response.data?.room) {
            const room = response.data.room;
            this.studentRoomInfo = {
              roomNumber: room.roomNumber,
              buildingName: room.buildingInfo?.name || room.building,
              buildingId: room.buildingInfo?.id || room.buildingId,
              floor: room.floor
            };
          } else {
            this.studentRoomInfo = null;
          }
          
          // Extract student information from multiple possible locations
          // Priority: roomStudents (has college info) > student > roommates
          let studentData = null;
          
          // First, try from roomStudents array (this usually has college info included)
          if (response.data?.room?.roomStudents && Array.isArray(response.data.room.roomStudents)) {
            // Find current student in roomStudents by matching userId
            for (const rs of response.data.room.roomStudents) {
              if (rs.student) {
                const studentUserId = rs.student.user?.id || rs.student.userId;
                if (studentUserId === this.currentUser?.id) {
                  studentData = rs.student;
                  break;
                }
              }
            }
          }
          
          // If not found, try from response.data.student
          if (!studentData && response.data?.student) {
            studentData = response.data.student;
          }
          
          // Also try from roommates array
          if (!studentData && response.data?.roommates && Array.isArray(response.data.roommates)) {
            for (const rm of response.data.roommates) {
              const studentUserId = rm.user?.id || rm.userId;
              if (studentUserId === this.currentUser?.id) {
                studentData = rm;
                break;
              }
            }
          }
          
          // Set student info if found
          if (studentData) {
            this.studentInfo = {
              college: studentData.college?.name || studentData.college || null,
              year: studentData.year || null,
              age: studentData.age || null,
              phoneNumber: studentData.phoneNumber || null
            };
          } else {
            // If student info not found in room data, try to load it separately
            this.loadStudentInfo();
          }
        } else {
          this.studentRoomInfo = null;
          this.loadStudentInfo(); // Try to load student info even if room is not found
        }
        this.isLoadingRoomInfo = false;
        requestAnimationFrame(() => {
          this.cdr.markForCheck();
        });
      },
      error: (error) => {
        console.error('Error loading student room info:', error);
        this.studentRoomInfo = null;
        this.loadStudentInfo(); // Try to load student info even on error
        this.isLoadingRoomInfo = false;
        requestAnimationFrame(() => {
          this.cdr.markForCheck();
        });
      }
    });
  }

  loadStudentInfo() {
    if (this.currentUser?.role !== 'student' || this.studentInfo) {
      return; // Don't reload if already loaded
    }
    
    // Try to get student info from student service
    // First, we need to get the student ID
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    // Use HTTP directly to get current student profile
    this.http.get(`${environment.apiUrl}/api/dashboard/check-student-profile`).subscribe({
      next: (response: any) => {
        if (response.success && response.studentId) {
          // Get student details
          this.studentService.getStudentById(response.studentId).subscribe({
            next: (studentResponse: any) => {
              if (studentResponse.success && studentResponse.data) {
                const student = studentResponse.data;
                this.studentInfo = {
                  college: student.college?.name || student.college,
                  year: student.year,
                  age: student.age,
                  phoneNumber: student.phoneNumber
                };
                requestAnimationFrame(() => {
                  this.cdr.markForCheck();
                });
              }
            },
            error: (err) => {
              console.error('Error loading student details:', err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error checking student profile:', err);
      }
    });
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
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
    let newNextMealTime = '';
    if (this.kitchenStatus?.isOpen && this.kitchenStatus?.currentMeal) {
      // If kitchen is open, show when it closes
      newNextMealTime = formatTime12Hour(this.kitchenStatus.currentMeal.endTime);
    } else if (this.kitchenStatus?.nextMeal) {
      // If kitchen is closed, show next meal time
      newNextMealTime = formatTime12Hour(this.kitchenStatus.nextMeal.startTime);
    }
    
    // Only update if value actually changed
    if (newNextMealTime !== this.nextMealTime) {
      this.nextMealTime = newNextMealTime;
    }
    
    // Update countdown (it will handle its own change detection)
    this.updateCountdown();
  }

  updateCountdown() {
    if (!this.kitchenStatus) {
      this.countdownTimer = null;
      return;
    }

    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    let targetTime: Date | null = null;
    let shouldReload = false;

    // Check if kitchen is open and has current meal
    if (this.kitchenStatus.isOpen && this.kitchenStatus.currentMeal) {
      // If kitchen is open, countdown to when it closes
      const [endHours, endMinutes] = this.kitchenStatus.currentMeal.endTime.split(':').map(Number);
      
      // Check if we've reached or passed the exact end time (compare hours and minutes)
      const endTimeToday = new Date();
      endTimeToday.setHours(endHours, endMinutes, 0, 0);
      const timeUntilEnd = endTimeToday.getTime() - now.getTime();
      
      // More precise check: if current time is at or past the end time
      // Check by comparing hours and minutes directly
      const isTimeReached = nowHours > endHours || (nowHours === endHours && nowMinutes >= endMinutes);
      
      if (isTimeReached || timeUntilEnd <= 0) {
        // Time has been reached (at or past the exact time), reload immediately
        shouldReload = true;
        this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
      } else {
        // Meal hasn't ended yet, countdown to end time
        targetTime = endTimeToday;
        
        if (timeUntilEnd > 0) {
          const totalSeconds = Math.floor(timeUntilEnd / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          this.countdownTimer = { hours, minutes, seconds };
        } else {
          this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
          shouldReload = true;
        }
      }
    } else if (this.kitchenStatus.nextMeal) {
      // If kitchen is closed, countdown to next meal
      const [hours, minutes] = this.kitchenStatus.nextMeal.startTime.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      // If the target time is earlier today, it means it's tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const diff = targetTime.getTime() - now.getTime();
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.countdownTimer = { hours, minutes, seconds };
      } else {
        // Countdown reached zero or negative
        this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
        shouldReload = true;
      }
    } else {
      this.countdownTimer = null;
    }

    // Reload kitchen status immediately when time is reached
    if (shouldReload && !this.isReloadingKitchen) {
      this.isReloadingKitchen = true;
      // Reload in background using requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        this.loadKitchenData();
      });
    }
  }

}

