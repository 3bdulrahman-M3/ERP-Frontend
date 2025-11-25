import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealService, Meal, KitchenStatus } from '../../services/meal.service';
import { LayoutComponent } from '../shared/layout/layout.component';
import { interval, Subscription } from 'rxjs';
import { formatTime12Hour } from '../../utils/time.util';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.css'
})
export class KitchenComponent implements OnInit, OnDestroy {
  kitchenStatus: KitchenStatus | null = null;
  allMeals: Meal[] = [];
  isLoadingKitchen = false;
  countdownTimer: { hours: number; minutes: number; seconds: number } | null = null;
  private timerSubscription?: Subscription;
  private kitchenUpdateSubscription?: Subscription;
  
  mealNames: { [key: string]: string } = {
    breakfast: 'الإفطار',
    lunch: 'الغداء',
    dinner: 'العشاء'
  };

  constructor(private mealService: MealService) {}

  ngOnInit() {
    this.loadKitchenData();
    this.startKitchenTimer();
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    if (this.kitchenUpdateSubscription) {
      this.kitchenUpdateSubscription.unsubscribe();
    }
  }

  loadKitchenData() {
    this.isLoadingKitchen = true;
    
    // Load kitchen status
    this.mealService.getKitchenStatus().subscribe({
      next: (response) => {
        if (response.success) {
          this.kitchenStatus = response.data;
          this.updateCountdown();
        }
        this.isLoadingKitchen = false;
      },
      error: (error) => {
        console.error('Error loading kitchen status:', error);
        this.isLoadingKitchen = false;
      }
    });

    // Load all meals
    this.mealService.getAllMeals().subscribe({
      next: (response) => {
        if (response.success) {
          this.allMeals = response.data.filter(meal => meal.isActive);
        }
      },
      error: (error) => {
        console.error('Error loading meals:', error);
      }
    });
  }

  startKitchenTimer() {
    // Update countdown every second
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });

    // Refresh kitchen status every 30 seconds
    this.kitchenUpdateSubscription = interval(30000).subscribe(() => {
      this.loadKitchenData();
    });
  }

  updateCountdown() {
    if (!this.kitchenStatus) {
      this.countdownTimer = null;
      return;
    }

    const now = new Date();
    let targetTime: Date | null = null;

    if (this.kitchenStatus.nextMeal) {
      const [hours, minutes] = this.kitchenStatus.nextMeal.startTime.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      // If the target time is earlier today, it means it's tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    } else if (this.kitchenStatus.currentMeal) {
      // If kitchen is open, countdown to when it closes
      const [hours, minutes] = this.kitchenStatus.currentMeal.endTime.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      // If the target time is earlier today, it means it's tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    }

    if (targetTime) {
      const diff = targetTime.getTime() - now.getTime();
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.countdownTimer = { hours, minutes, seconds };
      } else {
        this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
        // Reload kitchen status when countdown reaches zero
        this.loadKitchenData();
      }
    } else {
      this.countdownTimer = null;
    }
  }

  formatTime(time: string): string {
    return formatTime12Hour(time);
  }
}

