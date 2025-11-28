import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  isLoading = false;
  currentPage = 1;
  limit = 20;
  totalPages = 1;
  
  private refreshSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.loadUnreadCount();
    
    // Refresh every 5 seconds
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.loadUnreadCount();
      if (this.isOpen) {
        this.loadNotifications();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadNotifications();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isOpen) {
      return;
    }
    const target = event.target as HTMLElement;
    if (this.elementRef.nativeElement && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  loadNotifications() {
    this.isLoading = true;
    this.notificationService.getNotifications(this.currentPage, this.limit).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Handle both response formats
          if (Array.isArray(response.data)) {
            this.notifications = response.data;
            this.totalPages = response.pagination?.totalPages || 1;
          } else if (response.data?.notifications) {
            this.notifications = response.data.notifications;
            this.totalPages = response.data.pagination?.totalPages || 1;
          } else {
            this.notifications = [];
            this.totalPages = 1;
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  loadUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.unreadCount = response.data.unreadCount || response.data.count || 0;
        }
      },
      error: (error: any) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  markAsRead(notification: Notification) {
    if (notification.isRead) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      },
      error: (error: any) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  handleNotificationClick(notification: Notification) {
    // Mark as read first
    this.markAsRead(notification);
    
    // Close dropdown
    this.isOpen = false;
    
    // Navigate based on notification type
    if (!notification.relatedId || !notification.relatedType) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin';

    switch (notification.relatedType) {
      case 'room':
        if (isAdmin) {
          this.router.navigate(['/dashboard/rooms', notification.relatedId]);
        } else {
          this.router.navigate(['/dashboard/available-rooms']);
        }
        break;
      case 'room_request':
      case 'room_request_accepted':
      case 'room_request_rejected':
        if (isAdmin && notification.relatedId) {
          this.router.navigate(['/dashboard/rooms', notification.relatedId]);
        } else {
          this.router.navigate(['/dashboard/available-rooms']);
        }
        break;
      case 'student':
        if (isAdmin) {
          this.router.navigate(['/dashboard/students', notification.relatedId]);
        }
        break;
      case 'conversation':
        this.router.navigate(['/dashboard/chat']);
        break;
      case 'meal':
        if (isAdmin) {
          this.router.navigate(['/dashboard/meals']);
        } else {
          this.router.navigate(['/dashboard/kitchen']);
        }
        break;
      case 'check_in':
      case 'check_out':
        if (isAdmin) {
          this.router.navigate(['/dashboard/reports/check-in-out']);
        } else {
          this.router.navigate(['/dashboard/student-check-in-out']);
        }
        break;
      default:
        // Default to dashboard
        this.router.navigate(['/dashboard']);
    }
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notifications.forEach(n => n.isRead = true);
          this.unreadCount = 0;
        }
      },
      error: (error: any) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notifications = this.notifications.filter(n => n.id !== notification.id);
          if (!notification.isRead) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          }
        }
      },
      error: (error: any) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'check_in': '🚪',
      'check_out': '🚶',
      'student_check_in': '🚪',
      'student_check_out': '🚶',
      'new_message': '💬',
      'student_created': '👤',
      'room_created': '🏠',
      'room_match_preferences': '🏠',
      'room_request': '📝',
      'room_request_accepted': '✅',
      'room_request_rejected': '❌',
      'meal_created': '🍽️',
      'meal_updated': '🍴',
      'kitchen_opened': '🍽️',
      'kitchen_closed': '🔒',
      'meal_changed': '🍴',
      'meal_time': '⏰'
    };
    return icons[type] || '🔔';
  }
}

