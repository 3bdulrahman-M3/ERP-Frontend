import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService, CreateRoomRequest, UpdateRoomRequest } from '../../../services/room.service';
import { ServiceService, Service } from '../../../services/service.service';
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

  buildings = ['A', 'B', 'C'];
  services: Service[] = [];
  selectedServiceIds: number[] = [];

  formData = {
    roomNumber: '',
    floor: null as number | null,
    building: '',
    totalBeds: null as number | null,
    roomType: 'shared' as 'single' | 'shared',
    roomPrice: null as number | null,
    bedPrice: null as number | null,
    description: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance' | 'reserved'
  };

  constructor(
    private roomService: RoomService,
    private serviceService: ServiceService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadServices();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.roomId = +id;
      this.loadRoom();
    }
  }

  loadServices() {
    // Get all services without pagination (use large limit)
    this.serviceService.getAllServices(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          this.services = response.data.services;
        }
      },
      error: (error) => {
        console.error('Error loading services:', error);
      }
    });
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
            roomType: room.roomType || 'shared',
            roomPrice: room.roomPrice ? parseFloat(room.roomPrice.toString()) : null,
            bedPrice: room.bedPrice ? parseFloat(room.bedPrice.toString()) : null,
            description: room.description || '',
            status: room.status
          };
          // Load selected services
          this.selectedServiceIds = room.services ? room.services.map(s => s.id) : [];
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
        roomType: this.formData.roomType,
        roomPrice: this.formData.roomPrice || undefined,
        bedPrice: this.formData.bedPrice || undefined,
        description: this.formData.description || undefined,
        status: this.formData.status,
        serviceIds: this.selectedServiceIds
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
        roomType: this.formData.roomType,
        roomPrice: this.formData.roomPrice || undefined,
        bedPrice: this.formData.bedPrice || undefined,
        description: this.formData.description || undefined,
        status: this.formData.status,
        serviceIds: this.selectedServiceIds
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

  onRoomTypeChange() {
    if (this.formData.roomType === 'single') {
      this.formData.totalBeds = 1;
      this.formData.bedPrice = null;
    } else {
      this.formData.roomPrice = null;
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

    if (this.formData.roomType === 'single') {
      if (this.formData.totalBeds !== 1) {
        this.errorMessage = 'الغرف الفردية يجب أن تحتوي على سرير واحد فقط';
        return false;
      }
      if (!this.formData.roomPrice || this.formData.roomPrice <= 0) {
        this.errorMessage = 'الرجاء إدخال سعر الغرفة';
        return false;
      }
    } else {
      if (!this.formData.bedPrice || this.formData.bedPrice <= 0) {
        this.errorMessage = 'الرجاء إدخال سعر السرير';
        return false;
      }
    }

    return true;
  }

  cancel() {
    this.router.navigate(['/dashboard/rooms']);
  }

  toggleService(serviceId: number) {
    const index = this.selectedServiceIds.indexOf(serviceId);
    if (index > -1) {
      this.selectedServiceIds.splice(index, 1);
    } else {
      this.selectedServiceIds.push(serviceId);
    }
  }
}

