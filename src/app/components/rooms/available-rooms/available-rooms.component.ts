import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { RoomRequestService, RoomRequest } from '../../../services/room-request.service';
import { RoomService, Room, RoomStudent } from '../../../services/room.service';
import { environment } from '../../../../environments/environment';

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
  showImagesModal = false;
  showRoomDetailsModal = false;
  selectedRoom: Room | null = null;
  selectedRoomImages: string[] = [];
  currentImageIndex = 0;
  requestNotes = '';
  roomDetails: Room | null = null;
  roomStudents: RoomStudent[] = [];
  isLoadingRoomDetails = false;
  roomDetailsImageIndex = 0;

  constructor(
    private roomRequestService: RoomRequestService,
    private roomService: RoomService
  ) {}

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
        this.errorMessage = error.error?.message || 'Failed to load rooms';
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
          this.successMessage = 'Request submitted successfully';
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
        this.errorMessage = error.error?.message || 'Failed to submit request';
        this.isLoading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'available': 'bg-gray-500 text-white',
      'occupied': 'bg-gray-600 text-white',
      'maintenance': 'bg-gray-700 text-white',
      'reserved': 'bg-gray-800 text-white'
    };
    return classes[status] || 'bg-gray-500 text-white';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'available': 'Available',
      'occupied': 'Occupied',
      'maintenance': 'Maintenance',
      'reserved': 'Reserved'
    };
    return texts[status] || status;
  }

  getRoomTypeText(roomType: string | undefined): string {
    return roomType === 'single' ? 'Single' : 'Shared';
  }

  openImagesModal(room: Room) {
    if (room.images && Array.isArray(room.images) && room.images.length > 0) {
      // Parse images if it's a JSON string
      let images = room.images;
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch (e) {
          images = [];
        }
      }
      this.selectedRoomImages = Array.isArray(images) ? images : [];
      this.currentImageIndex = 0;
      this.showImagesModal = true;
    }
  }

  closeImagesModal() {
    this.showImagesModal = false;
    this.selectedRoomImages = [];
    this.currentImageIndex = 0;
  }

  nextImage() {
    if (this.selectedRoomImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedRoomImages.length;
    }
  }

  previousImage() {
    if (this.selectedRoomImages.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.selectedRoomImages.length) % this.selectedRoomImages.length;
    }
  }

  goToImage(index: number) {
    this.currentImageIndex = index;
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    // If it's already a full URL, return it as is
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    // If it starts with /uploads, add the API URL
    if (image.startsWith('/uploads/')) {
      return `${environment.apiUrl}${image}`;
    }
    // Otherwise, assume it's a filename and construct the URL
    return `${environment.apiUrl}/uploads/${image}`;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  getRoomImage(room: Room): string | null {
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

  openRoomDetailsModal(room: Room) {
    this.selectedRoom = room;
    this.showRoomDetailsModal = true;
    this.isLoadingRoomDetails = true;
    this.roomDetails = null;
    this.roomStudents = [];
    this.roomDetailsImageIndex = 0;

    // Load full room details
    this.roomService.getRoomById(room.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.roomDetails = response.data;
          // Ensure images is an array
          if (this.roomDetails.images) {
            const imagesValue: string | string[] | undefined = this.roomDetails.images;
            if (typeof imagesValue === 'string') {
              // Try to parse as JSON array
              try {
                const parsed = JSON.parse(imagesValue);
                this.roomDetails.images = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                // If parsing fails, treat as single image URL string
                const trimmed = (imagesValue as string).trim();
                this.roomDetails.images = trimmed ? [trimmed] : [];
              }
            } else if (Array.isArray(imagesValue)) {
              // Ensure all items in array are valid strings
              this.roomDetails.images = imagesValue.filter((img): img is string => {
                return typeof img === 'string' && img.trim().length > 0;
              });
            } else {
              this.roomDetails.images = [];
            }
          } else {
            this.roomDetails.images = [];
          }
        }
        this.isLoadingRoomDetails = false;
      },
      error: (error) => {
        console.error('Error loading room details:', error);
        this.isLoadingRoomDetails = false;
      }
    });

    // Load room students
    this.roomService.getRoomStudents(room.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.roomStudents = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading room students:', error);
      }
    });
  }

  closeRoomDetailsModal() {
    this.showRoomDetailsModal = false;
    this.selectedRoom = null;
    this.roomDetails = null;
    this.roomStudents = [];
    this.roomDetailsImageIndex = 0;
  }

  nextRoomImage() {
    if (this.roomDetails && this.roomDetails.images && Array.isArray(this.roomDetails.images) && this.roomDetails.images.length > 0) {
      this.roomDetailsImageIndex = (this.roomDetailsImageIndex + 1) % this.roomDetails.images.length;
    }
  }

  prevRoomImage() {
    if (this.roomDetails && this.roomDetails.images && Array.isArray(this.roomDetails.images) && this.roomDetails.images.length > 0) {
      this.roomDetailsImageIndex = (this.roomDetailsImageIndex - 1 + this.roomDetails.images.length) % this.roomDetails.images.length;
    }
  }

  goToRoomImage(index: number) {
    if (this.roomDetails && this.roomDetails.images && index >= 0 && index < this.roomDetails.images.length) {
      this.roomDetailsImageIndex = index;
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}



