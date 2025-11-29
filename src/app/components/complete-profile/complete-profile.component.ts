import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { CollegeService, College } from '../../services/college.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.css'
})
export class CompleteProfileComponent implements OnInit {
  colleges: College[] = [];
  isLoading = false;
  isLoadingColleges = false;
  errorMessage = '';

  profileData = {
    collegeId: null as number | null,
    year: '',
    age: '',
    phoneNumber: ''
  };

  years = ['1', '2', '3', '4', '5', '6'];

  constructor(
    private studentService: StudentService,
    private collegeService: CollegeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadColleges();
  }

  loadColleges() {
    this.isLoadingColleges = true;
    this.errorMessage = '';
    this.collegeService.getAllColleges(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          this.colleges = response.data.colleges;
        } else {
          this.errorMessage = response.message || 'فشل تحميل قائمة الكليات';
        }
        this.isLoadingColleges = false;
      },
      error: (error) => {
        console.error('Error loading colleges:', error);
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الكليات. تأكد من تسجيل الدخول.';
        this.isLoadingColleges = false;
      }
    });
  }

  submitProfile() {
    this.errorMessage = '';

    // Validation
    if (!this.profileData.collegeId || !this.profileData.year) {
      this.errorMessage = 'الرجاء إدخال الكلية والفرقة';
      return;
    }

    this.isLoading = true;

    this.studentService.completeProfile({
      collegeId: this.profileData.collegeId,
      year: this.profileData.year,
      age: this.profileData.age ? parseInt(this.profileData.age) : null,
      phoneNumber: this.profileData.phoneNumber || null
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Redirect to dashboard
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = response.message || 'فشل استكمال البيانات';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء استكمال البيانات';
        this.isLoading = false;
      }
    });
  }
}

