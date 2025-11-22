import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';
import { StudentService } from '../../services/student.service';
import { RoomService } from '../../services/room.service';
import { LayoutComponent } from '../shared/layout/layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
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
    
    // Update title when route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.currentRoute = this.router.url;
      this.updatePageTitle();
    });
  }

  loadStatistics() {
    this.isLoadingStats = true;

    // Load students count
    this.studentService.getAllStudents(1, 1).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalStudents = response.data.pagination.total;
        }
        this.checkStatsLoaded();
      },
      error: () => {
        this.checkStatsLoaded();
      }
    });

    // Load rooms statistics
    this.roomService.getAllRooms(1, 1).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalRooms = response.data.pagination.total;
        }
        this.loadRoomsDetails();
      },
      error: () => {
        this.isLoadingStats = false;
      }
    });
  }

  loadRoomsDetails() {
    // Load available rooms
    this.roomService.getAllRooms(1, 100, { status: 'available' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.availableRooms = response.data.pagination.total;
        }
        this.loadOccupiedRooms();
      },
      error: () => {
        this.isLoadingStats = false;
      }
    });
  }

  loadOccupiedRooms() {
    // Load occupied rooms
    this.roomService.getAllRooms(1, 100, { status: 'occupied' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.occupiedRooms = response.data.pagination.total;
        }
        this.isLoadingStats = false;
      },
      error: () => {
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
}

