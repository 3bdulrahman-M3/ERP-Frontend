import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  @Input() pageTitle = 'لوحة التحكم';
  
  currentUser: User | null = null;
  isSidebarOpen = true;
  private userSubscription?: Subscription;

  menuItems: Array<{ icon: string; label: string; route: string; active: boolean; adminOnly?: boolean; studentOnly?: boolean }> = [];

  getMenuItems() {
    if (!this.currentUser) {
      return [];
    }
    
    const isAdmin = this.currentUser.role === 'admin';
    const isStudent = this.currentUser.role === 'student';
    
    const allItems = [
      { icon: '📊', label: 'لوحة التحكم', route: '/dashboard', active: false, adminOnly: false, studentOnly: false },
      { icon: '🎓', label: 'الطلاب', route: '/dashboard/students', active: false, adminOnly: true, studentOnly: false },
      { icon: '🏠', label: 'الغرف', route: '/dashboard/rooms', active: false, adminOnly: true, studentOnly: false },
      { icon: '🏛️', label: 'الكليات', route: '/dashboard/colleges', active: false, adminOnly: true, studentOnly: false },
      { icon: '🍽️', label: 'الوجبات', route: '/dashboard/meals', active: false, adminOnly: true, studentOnly: false },
      { icon: '🍴', label: 'المطعم', route: '/dashboard/kitchen', active: false, adminOnly: false, studentOnly: true },
      { icon: '📝', label: 'التقارير', route: '/dashboard/reports', active: false, adminOnly: true, studentOnly: false },
      { icon: '⚙️', label: 'الإعدادات', route: '/dashboard/settings', active: false, adminOnly: false, studentOnly: false },
    ];
    
    return allItems.filter(item => {
      // If item is admin only, show only to admins
      if (item.adminOnly) {
        return isAdmin;
      }
      // If item is student only, show only to students
      if (item.studentOnly) {
        return isStudent;
      }
      // If item is not restricted, show to everyone
      return true;
    });
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.menuItems = this.getMenuItems();
    this.updateActiveMenu();
    
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.menuItems = this.getMenuItems();
      this.updateActiveMenu();
    });
    
    // Update menu on route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveMenu();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  updateActiveMenu() {
    const currentRoute = this.router.url;
    this.menuItems.forEach(item => {
      item.active = currentRoute === item.route || 
                   (item.route !== '/dashboard' && currentRoute.startsWith(item.route));
    });
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
  }
}

