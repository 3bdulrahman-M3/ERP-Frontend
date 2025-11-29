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
  private isReloading = false; // Flag to prevent multiple simultaneous reloads
  
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
    if (this.isReloading) {
      return; // Prevent multiple simultaneous reloads
    }
    
    this.isLoadingKitchen = true;
    
    // Load kitchen status
    this.mealService.getKitchenStatus().subscribe({
      next: (response) => {
        if (response.success) {
          const previousStatus = this.kitchenStatus?.isOpen;
          this.kitchenStatus = response.data;
          
          // If status changed from open to closed, update countdown immediately
          if (previousStatus === true && !this.kitchenStatus.isOpen) {
            this.updateCountdown();
          } else {
            this.updateCountdown();
          }
        }
        this.isLoadingKitchen = false;
        this.isReloading = false;
      },
      error: (error) => {
        console.error('Error loading kitchen status:', error);
        this.isLoadingKitchen = false;
        this.isReloading = false;
      }
    });

    // Load all meals
    this.mealService.getAllMeals(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          this.allMeals = response.data.meals.filter((meal: any) => meal.isActive);
        }
      },
      error: (error) => {
        console.error('Error loading meals:', error);
      }
    });
  }

  startKitchenTimer() {
    // Update countdown every second (more frequent for accuracy)
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateCountdown();
    });

    // Refresh kitchen status every 5 seconds to ensure accuracy
    this.kitchenUpdateSubscription = interval(5000).subscribe(() => {
      if (!this.isReloading) {
        this.loadKitchenData();
      }
    });
  }

  updateCountdown() {
    if (!this.kitchenStatus) {
      this.countdownTimer = null;
      return;
    }

    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const nowSeconds = now.getSeconds();
    let targetTime: Date | null = null;
    let shouldReload = false;

    // Check if kitchen is open and has current meal
    if (this.kitchenStatus.isOpen && this.kitchenStatus.currentMeal) {
      // If kitchen is open, countdown to when it closes
      const [endHours, endMinutes] = this.kitchenStatus.currentMeal.endTime.split(':').map(Number);
      
      // Check if we've reached or passed the exact end time (compare hours and minutes)
      const endTimeToday = new Date();
      endTimeToday.setHours(endHours, endMinutes, 0, 0);
      const timeUntilEnd = endTimeToday.getTime() - now.getTime();
      
      // More precise check: if current time is at or past the end time
      // Check by comparing hours and minutes directly
      const isTimeReached = nowHours > endHours || (nowHours === endHours && nowMinutes >= endMinutes);
      
      if (isTimeReached || timeUntilEnd <= 0) {
        // Time has been reached (at or past the exact time), reload immediately
        shouldReload = true;
        this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
      } else {
        // Meal hasn't ended yet, countdown to end time
        targetTime = endTimeToday;
        
        if (timeUntilEnd > 0) {
          const totalSeconds = Math.floor(timeUntilEnd / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          this.countdownTimer = { hours, minutes, seconds };
        } else {
          this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
          shouldReload = true;
        }
      }
    } else if (this.kitchenStatus.nextMeal) {
      // If kitchen is closed, countdown to next meal
      const [hours, minutes] = this.kitchenStatus.nextMeal.startTime.split(':').map(Number);
      targetTime = new Date();
      targetTime.setHours(hours, minutes, 0, 0);
      
      // If the target time is earlier today, it means it's tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      
      const diff = targetTime.getTime() - now.getTime();
      if (diff > 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        this.countdownTimer = { hours, minutes, seconds };
      } else {
        // Countdown reached zero or negative
        this.countdownTimer = { hours: 0, minutes: 0, seconds: 0 };
        shouldReload = true;
      }
    } else {
      this.countdownTimer = null;
    }

    // Reload kitchen status immediately when time is reached
    if (shouldReload && !this.isReloading) {
      this.isReloading = true;
      // Reload immediately without delay
      this.loadKitchenData();
    }
  }

  formatTime(time: string): string {
    return formatTime12Hour(time);
  }
}

