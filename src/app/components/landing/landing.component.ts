import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  showRegisterModal = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  registerData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  openRegisterModal() {
    this.showRegisterModal = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
    this.registerData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  submitRegister() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.registerData.name || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'الرجاء ملء جميع الحقول المطلوبة';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'كلمات المرور غير متطابقة';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      return;
    }

    this.isLoading = true;

    this.authService.register({
      name: this.registerData.name,
      email: this.registerData.email,
      password: this.registerData.password
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Save tokens and user
          if (response.data.accessToken && response.data.refreshToken) {
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
            this.authService.setCurrentUser(response.data.user);
          }
          
          this.successMessage = 'تم التسجيل بنجاح! جاري توجيهك...';
          setTimeout(() => {
            this.router.navigate(['/complete-profile']);
          }, 1500);
        } else {
          this.errorMessage = response.message || 'حدث خطأ أثناء التسجيل';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء التسجيل';
        this.isLoading = false;
      }
    });
  }
}

