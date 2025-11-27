import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { RoomRequestService, RoomRequest } from '../../../services/room-request.service';
import { Room } from '../../../services/room.service';

@Component({
  selector: 'app-available-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './available-rooms.component.html',
  styleUrl: './available-rooms.component.css'
})
export class AvailableRoomsComponent implements OnInit {
  rooms: Room[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  showRequestModal = false;
  selectedRoom: Room | null = null;
  requestNotes = '';

  constructor(private roomRequestService: RoomRequestService) {}

  ngOnInit() {
    this.loadRooms();
  }

  loadRooms(page: number = 1) {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentPage = page;

    this.roomRequestService.getMatchingRooms(page, this.limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.rooms = response.data.rooms;
          this.totalPages = response.data.pagination.totalPages;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'فشل تحميل الغرف';
        this.isLoading = false;
      }
    });
  }

  openRequestModal(room: Room) {
    this.selectedRoom = room;
    this.requestNotes = '';
    this.showRequestModal = true;
  }

  closeRequestModal() {
    this.showRequestModal = false;
    this.selectedRoom = null;
    this.requestNotes = '';
  }

  submitRequest() {
    if (!this.selectedRoom) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.roomRequestService.createRoomRequest({
      roomId: this.selectedRoom.id,
      notes: this.requestNotes || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'تم تقديم الطلب بنجاح';
          this.closeRequestModal();
          // Reload rooms to update request status
          this.loadRooms(this.currentPage);
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'فشل تقديم الطلب';
        this.isLoading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'available': 'bg-green-100 text-green-700',
      'occupied': 'bg-yellow-100 text-yellow-700',
      'maintenance': 'bg-red-100 text-red-700',
      'reserved': 'bg-blue-100 text-blue-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'available': 'متاحة',
      'occupied': 'مشغولة',
      'maintenance': 'صيانة',
      'reserved': 'محجوزة'
    };
    return texts[status] || status;
  }

  getRoomTypeText(roomType: string | undefined): string {
    return roomType === 'single' ? 'فردية' : 'جماعية';
  }
}


