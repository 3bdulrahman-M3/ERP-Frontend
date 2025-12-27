import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RoomService, PaymentInfo } from '../../../services/room.service';
import { AuthService } from '../../../services/auth.service';
import { StudentService } from '../../../services/student.service';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { environment } from '../../../../environments/environment';

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
    images?: string[] | string;
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
    cash: 'Cash',
    visa: 'Visa',
    bank_transfer: 'Bank Transfer',
    other: 'Other'
  };
  paymentStatusLabels: Record<string, string> = {
    paid: 'Paid',
    partial: 'Partially Paid',
    unpaid: 'Unpaid'
  };

  constructor(
    private roomService: RoomService,
    private authService: AuthService,
    private studentService: StudentService,
    private sanitizer: DomSanitizer
  ) {}

  getPaymentStatusLabel(status?: string | null): string {
    return this.paymentStatusLabels[status || ''] || 'Not Specified';
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
    return `$${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  ngOnInit() {
    this.loadCurrentStudent();
  }

  loadCurrentStudent() {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'student') {
      this.errorMessage = 'You must be logged in as a student';
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
          this.errorMessage = 'You have not been assigned to any room';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load room data';
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

  getRoomImage(room: RoomData['room']): string | null {
    if (!room.images) return null;
    
    // Handle different image formats
    let images: string[] = [];
    if (typeof room.images === 'string') {
      try {
        const parsed = JSON.parse(room.images);
        images = Array.isArray(parsed) ? parsed : [room.images];
      } catch (e) {
        images = [room.images];
      }
    } else if (Array.isArray(room.images)) {
      images = room.images;
    }
    
    // Return first valid image
    return images.length > 0 && images[0] ? images[0] : null;
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
    }
  }
}

