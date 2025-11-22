import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService, CreateStudentRequest, UpdateStudentRequest } from '../../../services/student.service';
import { CollegeService, College } from '../../../services/college.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.css'
})
export class StudentFormComponent implements OnInit {
  isEditMode = false;
  studentId: number | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  formData = {
    name: '',
    email: '',
    password: '',
    collegeId: null as number | null,
    year: null as number | null,
    age: null as number | null,
    phoneNumber: ''
  };

  colleges: College[] = [];
  years = [1, 2, 3, 4, 5, 6];

  constructor(
    private studentService: StudentService,
    private collegeService: CollegeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadColleges();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.studentId = +id;
      this.loadStudent();
    }
  }

  loadColleges() {
    this.collegeService.getAllColleges().subscribe({
      next: (response) => {
        if (response.success) {
          this.colleges = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading colleges:', error);
      }
    });
  }

  loadStudent() {
    if (!this.studentId) return;

    this.isLoading = true;
    this.studentService.getStudentById(this.studentId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          const student = response.data;
          this.formData = {
            name: student.name,
            email: student.email,
            password: '',
            collegeId: student.collegeId || null,
            year: student.year || null,
            age: student.age,
            phoneNumber: student.phoneNumber
          };
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الطالب';
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

    if (this.isEditMode && this.studentId) {
      const updateData: UpdateStudentRequest = {
        name: this.formData.name,
        email: this.formData.email,
        collegeId: this.formData.collegeId || undefined,
        year: this.formData.year || undefined,
        age: this.formData.age!,
        phoneNumber: this.formData.phoneNumber
      };

      if (this.formData.password) {
        updateData.password = this.formData.password;
      }

      this.studentService.updateStudent(this.studentId, updateData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'تم تحديث بيانات الطالب بنجاح';
            setTimeout(() => {
              this.router.navigate(['/dashboard/students']);
            }, 1500);
          }
        },
        error: (error) => {
          this.isLoading = false;
          const errorMsg = error.error?.message || 'فشل تحديث بيانات الطالب';
          if (errorMsg.includes('enum') || errorMsg.includes('role')) {
            this.errorMessage = 'خطأ في إعدادات قاعدة البيانات. يرجى التحقق من قيم الأدوار (roles) في قاعدة البيانات.';
          } else {
            this.errorMessage = errorMsg;
          }
        }
      });
    } else {
      const createData: CreateStudentRequest = {
        name: this.formData.name,
        email: this.formData.email,
        password: this.formData.password,
        collegeId: this.formData.collegeId || undefined,
        year: this.formData.year || undefined,
        age: this.formData.age!,
        phoneNumber: this.formData.phoneNumber
      };

      this.studentService.createStudent(createData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'تم إضافة الطالب بنجاح';
            setTimeout(() => {
              this.router.navigate(['/dashboard/students']);
            }, 1500);
          }
        },
        error: (error) => {
          this.isLoading = false;
          const errorMsg = error.error?.message || 'فشل إضافة الطالب';
          if (errorMsg.includes('enum') || errorMsg.includes('role') || errorMsg.includes('invalid input value')) {
            this.errorMessage = 'خطأ في إعدادات قاعدة البيانات. يرجى التحقق من أن قيمة الدور "student" موجودة في enum قاعدة البيانات.';
          } else {
            this.errorMessage = errorMsg;
          }
        }
      });
    }
  }

  validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الطالب';
      return false;
    }

    if (!this.formData.email.trim()) {
      this.errorMessage = 'الرجاء إدخال البريد الإلكتروني';
      return false;
    }

    if (!this.isValidEmail(this.formData.email)) {
      this.errorMessage = 'البريد الإلكتروني غير صحيح';
      return false;
    }

    if (!this.isEditMode && !this.formData.password) {
      this.errorMessage = 'الرجاء إدخال كلمة المرور';
      return false;
    }

    if (this.formData.password && this.formData.password.length < 6) {
      this.errorMessage = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      return false;
    }

    if (!this.formData.collegeId) {
      this.errorMessage = 'الرجاء اختيار الكلية';
      return false;
    }

    if (!this.formData.age || this.formData.age < 16 || this.formData.age > 100) {
      this.errorMessage = 'العمر يجب أن يكون بين 16 و 100';
      return false;
    }

    if (!this.formData.phoneNumber.trim()) {
      this.errorMessage = 'الرجاء إدخال رقم الهاتف';
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  cancel() {
    this.router.navigate(['/dashboard/students']);
  }
}

