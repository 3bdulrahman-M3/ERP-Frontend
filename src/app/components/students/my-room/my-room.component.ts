import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RoomService, PaymentInfo } from '../../../services/room.service';
import { AuthService } from '../../../services/auth.service';
import { StudentService } from '../../../services/student.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

interface Roommate {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
  year?: number;
  college?: {
    id: number;
    name: string;
  };
  payment?: PaymentInfo | null;
}

interface RoomData {
  room: {
    id: number;
    roomNumber: string;
    floor?: number;
    buildingInfo?: {
      id: number;
      name: string;
      mapUrl?: string;
    };
    roomStudents?: Array<{
      student: Roommate;
    }>;
  };
  roommates?: Roommate[];
  payment?: PaymentInfo | null;
}

@Component({
  selector: 'app-my-room',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  templateUrl: './my-room.component.html',
  styleUrl: './my-room.component.css'
})
export class MyRoomComponent implements OnInit {
  roomData: RoomData | null = null;
  isLoading = true;
  errorMessage = '';
  currentStudentId: number | null = null;
  paymentMethodLabels: Record<string, string> = {
    cash: 'نقدي',
    visa: 'فيزا',
    bank_transfer: 'تحويل بنكي',
    other: 'أخرى'
  };
  paymentStatusLabels: Record<string, string> = {
    paid: 'تم الدفع',
    partial: 'مدفوع جزئياً',
    unpaid: 'لم يتم الدفع'
  };

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private studentService: StudentService,
    private sanitizer: DomSanitizer
  ) {}

  getPaymentStatusLabel(status?: string | null): string {
    return this.paymentStatusLabels[status || ''] || 'غير محدد';
  }

  getPaymentStatusClass(status?: string | null): string {
    switch (status) {
      case 'paid':
        return 'bg-gray-700 text-white';
      case 'partial':
        return 'bg-gray-600 text-white';
      case 'unpaid':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  formatCurrency(value?: number | string | null): string {
    const numericValue = Number(value ?? 0);
    return `${numericValue.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
  }

  ngOnInit() {
    this.loadCurrentStudent();
  }

  loadCurrentStudent() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'student') {
      this.errorMessage = 'يجب تسجيل الدخول كطالب أولاً';
      this.isLoading = false;
      return;
    }

    this.loadRoomData();
  }

  loadRoomData() {
    this.isLoading = true;
    this.errorMessage = '';

    this.roomService.getMyRoom().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.roomData = response.data;
        } else {
          this.errorMessage = 'لم يتم تعيينك في أي غرفة';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الغرفة';
      }
    });
  }

  getDirectionsUrl(mapUrl: string | null | undefined): string | null {
    if (!mapUrl) return null;
    
    // Convert to directions URL
    if (mapUrl.includes('google.com/maps')) {
      if (mapUrl.includes('/place/')) {
        const placeMatch = mapUrl.match(/\/place\/([^/?]+)/);
        if (placeMatch && placeMatch[1]) {
          return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeMatch[1])}`;
        }
      } else if (mapUrl.includes('?q=')) {
        const query = mapUrl.split('?q=')[1]?.split('&')[0];
        if (query) {
          return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
        }
      } else if (mapUrl.includes('/@')) {
        const coordMatch = mapUrl.match(/@([^,]+),([^,]+)/);
        if (coordMatch && coordMatch[1] && coordMatch[2]) {
          return `https://www.google.com/maps/dir/?api=1&destination=${coordMatch[1]},${coordMatch[2]}`;
        }
      }
    }
    
    // If we can't convert, return original URL
    return mapUrl;
  }

  openDirections() {
    if (this.roomData?.room?.buildingInfo?.mapUrl) {
      const directionsUrl = this.getDirectionsUrl(this.roomData.room.buildingInfo.mapUrl);
      if (directionsUrl) {
        window.open(directionsUrl, '_blank');
      }
    }
  }
}

