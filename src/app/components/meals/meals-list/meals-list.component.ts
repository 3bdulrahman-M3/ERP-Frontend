import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealService, Meal } from '../../../services/meal.service';
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
  
  formData = {
    name: 'breakfast' as 'breakfast' | 'lunch' | 'dinner',
    startTime: '',
    endTime: '',
    isActive: true,
    category: ''
  };

  mealNames = {
    breakfast: 'الإفطار',
    lunch: 'الغداء',
    dinner: 'العشاء'
  };

  constructor(private mealService: MealService) {}

  ngOnInit() {
    this.loadMeals();
  }

  loadMeals() {
    this.isLoading = true;
    this.errorMessage = '';
    this.mealService.getAllMeals().subscribe({
      next: (response) => {
        this.meals = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء تحميل الوجبات';
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

  onSubmit() {
    if (!this.validateForm()) {
      return;
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
        category: this.formData.category
      }).subscribe({
        next: () => {
          this.loadMeals();
          this.closeModals();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'حدث خطأ أثناء إضافة الوجبة';
        }
      });
    } else if (this.showEditModal && this.selectedMeal) {
      this.mealService.updateMeal(this.selectedMeal.id, {
        name: this.formData.name,
        startTime,
        endTime,
        isActive: this.formData.isActive,
        category: this.formData.category
      }).subscribe({
        next: () => {
          this.loadMeals();
          this.closeModals();
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'حدث خطأ أثناء تحديث الوجبة';
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
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء حذف الوجبة';
      }
    });
  }

  validateForm(): boolean {
    if (!this.formData.startTime || !this.formData.endTime) {
      this.errorMessage = 'يرجى إدخال وقت البدء ووقت الانتهاء';
      return false;
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(this.formData.startTime) || !timeRegex.test(this.formData.endTime)) {
      this.errorMessage = 'تنسيق الوقت غير صحيح. استخدم الصيغة HH:mm';
      return false;
    }

    // Validate that end time is after start time
    const [startH, startM] = this.formData.startTime.split(':').map(Number);
    const [endH, endM] = this.formData.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (endTotal <= startTotal) {
      this.errorMessage = 'وقت الانتهاء يجب أن يكون بعد وقت البدء';
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
}

