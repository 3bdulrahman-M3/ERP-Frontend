import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService, CreateRoomRequest, UpdateRoomRequest } from '../../../services/room.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './room-form.component.html',
  styleUrl: './room-form.component.css'
})
export class RoomFormComponent implements OnInit {
  isEditMode = false;
  roomId: number | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  formData = {
    roomNumber: '',
    floor: null as number | null,
    building: '',
    totalBeds: null as number | null,
    description: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance' | 'reserved'
  };

  constructor(
    private roomService: RoomService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.roomId = +id;
      this.loadRoom();
    }
  }

  loadRoom() {
    if (!this.roomId) return;

    this.isLoading = true;
    this.roomService.getRoomById(this.roomId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          const room = response.data;
          this.formData = {
            roomNumber: room.roomNumber,
            floor: room.floor,
            building: room.building || '',
            totalBeds: room.totalBeds,
            description: room.description || '',
            status: room.status
          };
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الغرفة';
      }
    });
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditMode && this.roomId) {
      const updateData: UpdateRoomRequest = {
        roomNumber: this.formData.roomNumber,
        floor: this.formData.floor || undefined,
        building: this.formData.building || undefined,
        totalBeds: this.formData.totalBeds!,
        description: this.formData.description || undefined,
        status: this.formData.status
      };

      this.roomService.updateRoom(this.roomId, updateData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'تم تحديث بيانات الغرفة بنجاح';
            setTimeout(() => {
              this.router.navigate(['/dashboard/rooms']);
            }, 1500);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'فشل تحديث بيانات الغرفة';
        }
      });
    } else {
      const createData: CreateRoomRequest = {
        roomNumber: this.formData.roomNumber,
        floor: this.formData.floor || undefined,
        building: this.formData.building || undefined,
        totalBeds: this.formData.totalBeds!,
        description: this.formData.description || undefined,
        status: this.formData.status
      };

      this.roomService.createRoom(createData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'تم إضافة الغرفة بنجاح';
            setTimeout(() => {
              this.router.navigate(['/dashboard/rooms']);
            }, 1500);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'فشل إضافة الغرفة';
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.roomNumber.trim()) {
      this.errorMessage = 'الرجاء إدخال رقم الغرفة';
      return false;
    }

    if (!this.formData.totalBeds || this.formData.totalBeds < 1) {
      this.errorMessage = 'الرجاء إدخال عدد الأسرة (على الأقل 1)';
      return false;
    }

    return true;
  }

  cancel() {
    this.router.navigate(['/dashboard/rooms']);
  }
}

