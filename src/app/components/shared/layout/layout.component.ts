import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  @Input() pageTitle = 'لوحة التحكم';
  
  currentUser: User | null = null;
  isSidebarOpen = true;

  menuItems: Array<{ icon: string; label: string; route: string; active: boolean; adminOnly?: boolean }> = [];

  getMenuItems() {
    const isAdmin = this.currentUser?.role === 'admin';
    
    return [
      { icon: '📊', label: 'لوحة التحكم', route: '/dashboard', active: false, adminOnly: false },
      { icon: '🎓', label: 'الطلاب', route: '/dashboard/students', active: false, adminOnly: true },
      { icon: '👥', label: 'المستخدمين', route: '/dashboard/users', active: false, adminOnly: true },
      { icon: '📚', label: 'الدورات', route: '/dashboard/courses', active: false, adminOnly: false },
      { icon: '📝', label: 'التقارير', route: '/dashboard/reports', active: false, adminOnly: true },
      { icon: '⚙️', label: 'الإعدادات', route: '/dashboard/settings', active: false, adminOnly: false },
    ].filter(item => !item.adminOnly || isAdmin);
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.menuItems = this.getMenuItems();
    this.updateActiveMenu();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.menuItems = this.getMenuItems();
      this.updateActiveMenu();
    });
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

