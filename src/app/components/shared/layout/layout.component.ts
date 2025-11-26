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

  menuItems: Array<{ icon: string; label: string; route: string; active: boolean; adminOnly?: boolean; studentOnly?: boolean; hasSubmenu?: boolean; parentRoute?: string }> = [];
  submenuItems: Array<{ icon: string; label: string; route: string; active: boolean; parentRoute: string }> = [];
  expandedMenus: Set<string> = new Set();

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
      { icon: '🔧', label: 'الخدمات', route: '/dashboard/services', active: false, adminOnly: true, studentOnly: false },
      { icon: '🍴', label: 'المطعم', route: '/dashboard/kitchen', active: false, adminOnly: false, studentOnly: true },
      { icon: '📋', label: 'سجل الدخول والخروج', route: '/dashboard/student-check-in-out', active: false, adminOnly: false, studentOnly: true },
      { icon: '📝', label: 'التقارير', route: '/dashboard/reports', active: false, adminOnly: true, studentOnly: false, hasSubmenu: true },
      { icon: '📷', label: 'تسجيل الدخول/الخروج', route: '/dashboard/check-in-out', active: false, adminOnly: true, studentOnly: false, parentRoute: '/dashboard/reports' },
      { icon: '📊', label: 'سجل الدخول والخروج', route: '/dashboard/reports/check-in-out', active: false, adminOnly: true, studentOnly: false, parentRoute: '/dashboard/reports' },
      { icon: '👤', label: 'سجل الطالب', route: '/dashboard/reports/student-record', active: false, adminOnly: true, studentOnly: false, parentRoute: '/dashboard/reports' },
      { icon: '⚙️', label: 'الإعدادات', route: '/dashboard/settings', active: false, adminOnly: false, studentOnly: false },
    ];
    
    const mainItems: typeof allItems = [];
    const subItems: typeof allItems = [];
    
    allItems.forEach(item => {
      // Filter by role
      let shouldShow = false;
      if (item.adminOnly) {
        shouldShow = isAdmin;
      } else if (item.studentOnly) {
        shouldShow = isStudent;
      } else {
        shouldShow = true;
      }
      
      if (shouldShow) {
        if (item.parentRoute) {
          subItems.push(item);
        } else {
          mainItems.push(item);
        }
      }
    });
    
    this.submenuItems = subItems.map(item => ({
      icon: item.icon,
      label: item.label,
      route: item.route,
      active: false,
      parentRoute: item.parentRoute!
    }));
    
    return mainItems;
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
      
      // Check if any submenu item is active
      if (item.hasSubmenu) {
        const hasActiveSubmenu = this.submenuItems.some(subItem => 
          subItem.parentRoute === item.route && 
          (currentRoute === subItem.route || currentRoute.startsWith(subItem.route))
        );
        if (hasActiveSubmenu) {
          this.expandedMenus.add(item.route);
        }
      }
    });
    
    this.submenuItems.forEach(item => {
      item.active = currentRoute === item.route || currentRoute.startsWith(item.route);
    });
  }

  toggleSubmenu(route: string) {
    if (this.expandedMenus.has(route)) {
      this.expandedMenus.delete(route);
    } else {
      this.expandedMenus.add(route);
    }
  }

  isSubmenuExpanded(route: string): boolean {
    return this.expandedMenus.has(route);
  }

  getSubmenuItems(parentRoute: string) {
    return this.submenuItems.filter(item => item.parentRoute === parentRoute);
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

