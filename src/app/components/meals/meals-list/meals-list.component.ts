import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MealService, Meal } from '../../../services/meal.service';
import { UploadService } from '../../../services/upload.service';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { formatTime12Hour } from '../../../utils/time.util';

@Component({
  selector: 'app-meals-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './meals-list.component.html',
  styleUrl: './meals-list.component.css'
})
export class MealsListComponent implements OnInit {
  meals: Meal[] = [];
  isLoading = false;
  errorMessage = '';
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedMeal: Meal | null = null;
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  
  formData = {
    name: 'breakfast' as 'breakfast' | 'lunch' | 'dinner',
    startTime: '',
    endTime: '',
    isActive: true,
    category: ''
  };
  selectedImage: string | null = null;
  imageFile: File | null = null;
  isUploadingImage = false;

  mealNames = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner'
  };

  constructor(
    private mealService: MealService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    this.loadMeals();
  }

  loadMeals() {
    this.isLoading = true;
    this.errorMessage = '';
    this.mealService.getAllMeals(this.currentPage, this.limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.meals = response.data.meals;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading meals';
        this.isLoading = false;
      }
    });
  }

  openAddModal() {
    this.formData = {
      name: 'breakfast',
      startTime: '',
      endTime: '',
      isActive: true,
      category: ''
    };
    this.selectedImage = null;
    this.imageFile = null;
    this.showAddModal = true;
  }

  openEditModal(meal: Meal) {
    this.selectedMeal = meal;
    this.formData = {
      name: meal.name,
      startTime: meal.startTime.substring(0, 5), // Extract HH:mm from HH:mm:ss
      endTime: meal.endTime.substring(0, 5),
      isActive: meal.isActive,
      category: meal.category || ''
    };
    this.selectedImage = meal.image || null;
    this.imageFile = null;
    this.showEditModal = true;
  }

  openDeleteModal(meal: Meal) {
    this.selectedMeal = meal;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedMeal = null;
  }

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    // Upload image if selected
    let imageUrl: string | undefined = undefined;
    if (this.imageFile) {
      this.isUploadingImage = true;
      try {
        const result = await firstValueFrom(this.uploadService.uploadImage(this.imageFile));
        if (result.success) {
          imageUrl = result.data.url;
        }
      } catch (error) {
        this.isUploadingImage = false;
        this.errorMessage = 'Failed to upload image';
        return;
      }
      this.isUploadingImage = false;
    } else if (this.selectedImage) {
      imageUrl = this.selectedImage;
    }

    // Convert time to HH:mm:ss format
    const startTime = this.formData.startTime + ':00';
    const endTime = this.formData.endTime + ':00';

    if (this.showAddModal) {
      this.mealService.createMeal({
        name: this.formData.name,
        startTime,
        endTime,
        isActive: this.formData.isActive,
        category: this.formData.category,
        image: imageUrl
      }).subscribe({
        next: () => {
          this.loadMeals();
          this.closeModals();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'An error occurred while adding the meal';
        }
      });
    } else if (this.showEditModal && this.selectedMeal) {
      this.mealService.updateMeal(this.selectedMeal.id, {
        name: this.formData.name,
        startTime,
        endTime,
        isActive: this.formData.isActive,
        category: this.formData.category,
        image: imageUrl
      }).subscribe({
        next: () => {
          this.loadMeals();
          this.closeModals();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'An error occurred while updating the meal';
        }
      });
    }
  }

  onDelete() {
    if (!this.selectedMeal) return;

    this.mealService.deleteMeal(this.selectedMeal.id).subscribe({
      next: () => {
        this.loadMeals();
        this.closeModals();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while deleting the meal';
      }
    });
  }

  validateForm(): boolean {
    if (!this.formData.startTime || !this.formData.endTime) {
      this.errorMessage = 'Please enter start time and end time';
      return false;
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.formData.startTime) || !timeRegex.test(this.formData.endTime)) {
      this.errorMessage = 'Invalid time format. Use HH:mm format';
      return false;
    }

    // Validate that end time is after start time
    const [startH, startM] = this.formData.startTime.split(':').map(Number);
    const [endH, endM] = this.formData.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (endTotal <= startTotal) {
      this.errorMessage = 'End time must be after start time';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  getMealName(name: string): string {
    return this.mealNames[name as keyof typeof this.mealNames] || name;
  }

  formatTime(time: string): string {
    return formatTime12Hour(time);
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.imageFile = null;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMeals();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadMeals();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 5);
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get Math() {
    return Math;
  }
}

