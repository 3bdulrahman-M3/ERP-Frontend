import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService, Student } from '../../../services/student.service';
import { MealService, KitchenStatus } from '../../../services/meal.service';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { interval, Subscription } from 'rxjs';
import { formatTime12Hour, getCurrentTime12HourShort, formatDateTime12Hour } from '../../../utils/time.util';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css'
})
export class StudentDetailComponent implements OnInit, OnDestroy {
  student: Student | null = null;
  isLoading = false;
  errorMessage = '';
  kitchenStatus: KitchenStatus | null = null;
  currentTime: string = '';
  countdown: { hours: number; minutes: number; seconds: number } | null = null;
  private timeUpdateSubscription?: Subscription;
  private statusUpdateSubscription?: Subscription;

  mealNames = {
    breakfast: 'الإفطار',
    lunch: 'الغداء',
    dinner: 'العشاء'
  };

  constructor(
    private studentService: StudentService,
    private mealService: MealService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStudent(+id);
    }
    this.loadKitchenStatus();
    this.updateCurrentTime();
    
    // Update current time every second
    this.timeUpdateSubscription = interval(1000).subscribe(() => {
      this.updateCurrentTime();
    });

    // Update kitchen status every 30 seconds
    this.statusUpdateSubscription = interval(30000).subscribe(() => {
      this.loadKitchenStatus();
    });
  }

  ngOnDestroy() {
    if (this.timeUpdateSubscription) {
      this.timeUpdateSubscription.unsubscribe();
    }
    if (this.statusUpdateSubscription) {
      this.statusUpdateSubscription.unsubscribe();
    }
  }

  updateCurrentTime() {
    this.currentTime = getCurrentTime12HourShort();
    
    // Update countdown if kitchen is closed
    if (this.kitchenStatus && !this.kitchenStatus.isOpen && this.kitchenStatus.timeUntilNextMeal) {
      this.updateCountdown();
    }
  }

  updateCountdown() {
    if (!this.kitchenStatus || !this.kitchenStatus.timeUntilNextMeal || !this.kitchenStatus.nextMeal) {
      this.countdown = null;
      return;
    }

    const now = new Date();
    const [nextH, nextM] = this.kitchenStatus.nextMeal.startTime.split(':').map(Number);
    const nextTime = new Date(now);
    nextTime.setHours(nextH, nextM, 0, 0);

    // If next meal is tomorrow
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    const diff = nextTime.getTime() - now.getTime();
    const totalSeconds = Math.floor(diff / 1000);
    
    if (totalSeconds <= 0) {
      this.countdown = null;
      this.loadKitchenStatus(); // Reload status
      return;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.countdown = { hours, minutes, seconds };
  }

  loadKitchenStatus() {
    this.mealService.getKitchenStatus().subscribe({
      next: (response) => {
        if (response.success) {
          this.kitchenStatus = response.data;
          if (!this.kitchenStatus.isOpen && this.kitchenStatus.timeUntilNextMeal) {
            this.updateCountdown();
          } else {
            this.countdown = null;
          }
        }
      },
      error: (error) => {
        console.error('Error loading kitchen status:', error);
      }
    });
  }

  loadStudent(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getStudentById(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.student = response.data;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الطالب';
      }
    });
  }

  editStudent() {
    if (this.student) {
      this.router.navigate(['/dashboard/students', this.student.id, 'edit']);
    }
  }

  deleteStudent() {
    if (this.student && confirm(`هل أنت متأكد من حذف الطالب "${this.student.name}"؟`)) {
      this.studentService.deleteStudent(this.student.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard/students']);
          }
        },
        error: (error) => {
          alert(error.error?.message || 'فشل حذف الطالب');
        }
      });
    }
  }

  downloadQRCode() {
    if (this.student) {
      const link = document.createElement('a');
      link.href = this.student.qrCode;
      link.download = `QR_${this.student.name.replace(/\s/g, '_')}.png`;
      link.click();
    }
  }

  goBack() {
    this.router.navigate(['/dashboard/students']);
  }

  getMealName(name: string): string {
    return this.mealNames[name as keyof typeof this.mealNames] || name;
  }

  formatTime(time: string): string {
    return formatTime12Hour(time);
  }

  formatDateTime(date: string | Date): string {
    return formatDateTime12Hour(date);
  }
}

