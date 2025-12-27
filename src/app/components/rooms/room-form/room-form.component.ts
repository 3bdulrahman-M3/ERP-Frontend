import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RoomService, CreateRoomRequest, UpdateRoomRequest } from '../../../services/room.service';
import { ServiceService, Service } from '../../../services/service.service';
import { BuildingService, Building } from '../../../services/building.service';
import { UploadService } from '../../../services/upload.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent],
  templateUrl: './room-form.component.html',
  styleUrl: './room-form.component.css'
})
export class RoomFormComponent implements OnInit {
  isEditMode = false;
  roomId: number | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  buildings: Building[] = [];
  services: Service[] = [];
  selectedServiceIds: number[] = [];
  selectedImages: string[] = [];
  imageFiles: File[] = [];
  isUploadingImages = false;

  formData = {
    roomNumber: '',
    floor: null as number | null,
    buildingId: null as number | null,
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
    private buildingService: BuildingService,
    private uploadService: UploadService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadServices();
    this.loadBuildings();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.roomId = +id;
      this.loadRoom();
    }
  }

  loadBuildings() {
    console.log('Loading buildings...');
    // Get all buildings without pagination (use large limit)
    this.buildingService.getAllBuildings(1, 1000).subscribe({
      next: (response) => {
        console.log('Buildings API response:', response);
        if (response.success && response.data && response.data.buildings) {
          this.buildings = response.data.buildings;
          console.log('Buildings loaded successfully:', this.buildings);
        } else {
          console.error('Invalid response structure:', response);
          this.errorMessage = 'فشل تحميل قائمة المباني';
        }
      },
      error: (error) => {
        console.error('Error loading buildings:', error);
        console.error('Error details:', error.error);
        this.errorMessage = 'فشل تحميل قائمة المباني: ' + (error.error?.message || error.message);
      }
    });
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
            buildingId: room.buildingId || null,
            totalBeds: room.totalBeds,
            roomType: room.roomType || 'shared',
            roomPrice: room.roomPrice ? parseFloat(room.roomPrice.toString()) : null,
            bedPrice: room.bedPrice ? parseFloat(room.bedPrice.toString()) : null,
            description: room.description || '',
            status: room.status
          };
          // Load selected services
          this.selectedServiceIds = room.services ? room.services.map(s => s.id) : [];
          // Load images
          if (room.images) {
            // Parse images if it's a JSON string
            let images = room.images;
            if (typeof images === 'string') {
              try {
                images = JSON.parse(images);
              } catch (e) {
                images = [];
              }
            }
            if (Array.isArray(images)) {
              this.selectedImages = images.filter(img => img && typeof img === 'string' && !img.startsWith('data:'));
            } else {
              this.selectedImages = [];
            }
          } else {
            this.selectedImages = [];
          }
          this.imageFiles = [];
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الغرفة';
      }
    });
  }

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Upload images first
    // Separate existing URLs from new base64 images
    const existingUrls = this.selectedImages.filter(img => 
      typeof img === 'string' && !img.startsWith('data:') && (img.startsWith('http') || img.startsWith('/'))
    );
    
    let imageUrls: string[] = [...existingUrls];
    
    if (this.imageFiles.length > 0) {
      this.isUploadingImages = true;
      try {
        const uploadPromises = this.imageFiles.map(file => 
          firstValueFrom(this.uploadService.uploadImage(file))
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newUrls = uploadResults
          .filter(result => result && result.success)
          .map(result => result.data.url);
        imageUrls = [...imageUrls, ...newUrls];
      } catch (error) {
        console.error('Error uploading images:', error);
        this.isLoading = false;
        this.isUploadingImages = false;
        this.errorMessage = 'Failed to upload images: ' + (error instanceof Error ? error.message : 'Unknown error');
        return;
      }
      this.isUploadingImages = false;
    }

    if (this.isEditMode && this.roomId) {
      const updateData: UpdateRoomRequest = {
        roomNumber: this.formData.roomNumber,
        floor: this.formData.floor || undefined,
        buildingId: this.formData.buildingId || undefined,
        totalBeds: this.formData.totalBeds!,
        roomType: this.formData.roomType,
        roomPrice: this.formData.roomPrice || undefined,
        bedPrice: this.formData.bedPrice || undefined,
        description: this.formData.description || undefined,
        status: this.formData.status,
        serviceIds: this.selectedServiceIds,
        // Always send images array - empty array means delete all images
        images: imageUrls
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
        buildingId: this.formData.buildingId || undefined,
        totalBeds: this.formData.totalBeds!,
        roomType: this.formData.roomType,
        roomPrice: this.formData.roomPrice || undefined,
        bedPrice: this.formData.bedPrice || undefined,
        description: this.formData.description || undefined,
        status: this.formData.status,
        serviceIds: this.selectedServiceIds,
        images: imageUrls.length > 0 ? imageUrls : undefined
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

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          this.imageFiles.push(file);
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.selectedImages.push(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  removeImage(index: number) {
    if (index < 0 || index >= this.selectedImages.length) {
      return;
    }

    const imageToRemove = this.selectedImages[index];
    const isBase64 = typeof imageToRemove === 'string' && imageToRemove.startsWith('data:');
    
    // If it's a base64 image, find and remove the corresponding file first
    if (isBase64) {
      // Count how many base64 images come before this one
      let base64Count = 0;
      for (let i = 0; i < index; i++) {
        if (typeof this.selectedImages[i] === 'string' && this.selectedImages[i].startsWith('data:')) {
          base64Count++;
        }
      }
      // Remove the file at the corresponding index
      if (base64Count >= 0 && base64Count < this.imageFiles.length) {
        this.imageFiles.splice(base64Count, 1);
      }
    }
    
    // Remove from selectedImages array
    this.selectedImages.splice(index, 1);
  }
}

