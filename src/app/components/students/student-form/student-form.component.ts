import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService, CreateStudentRequest, UpdateStudentRequest } from '../../../services/student.service';
import { CollegeService, College } from '../../../services/college.service';
import { UploadService } from '../../../services/upload.service';
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
    phoneNumber: '',
    profileImage: '',
    governorate: '',
    address: '',
    guardianPhone: '',
    idCardImage: ''
  };

  colleges: College[] = [];
  years = [1, 2, 3, 4, 5, 6];

  uploadingProfileImage = false;
  uploadingIdCard = false;

  constructor(
    private studentService: StudentService,
    private collegeService: CollegeService,
    private uploadService: UploadService,
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
    // Get all colleges without pagination (use large limit)
    this.collegeService.getAllColleges(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          this.colleges = response.data.colleges;
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
            phoneNumber: student.phoneNumber,
            profileImage: student.profileImage || '',
            governorate: student.governorate || '',
            address: student.address || '',
            guardianPhone: student.guardianPhone || '',
            idCardImage: student.idCardImage || ''
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
        phoneNumber: this.formData.phoneNumber,
        profileImage: this.formData.profileImage || undefined,
        governorate: this.formData.governorate || undefined,
        address: this.formData.address || undefined,
        guardianPhone: this.formData.guardianPhone || undefined,
        idCardImage: this.formData.idCardImage || undefined
      };

      if (this.formData.password) {
        updateData.password = this.formData.password;
      }

      console.log('Updating student with data:', updateData);

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
        phoneNumber: this.formData.phoneNumber,
        profileImage: this.formData.profileImage || undefined,
        governorate: this.formData.governorate || undefined,
        address: this.formData.address || undefined,
        guardianPhone: this.formData.guardianPhone || undefined,
        idCardImage: this.formData.idCardImage || undefined
      };

      console.log('Creating student with data:', createData);

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

  onProfileImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'حجم الصورة يجب أن يكون أقل من 5MB';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'يُسمح فقط بملفات الصور (JPEG, JPG, PNG, GIF, WEBP)';
        return;
      }

      this.uploadingProfileImage = true;
      this.errorMessage = '';

      this.uploadService.uploadImage(file).subscribe({
        next: (response) => {
          console.log('Upload response:', response);
          this.uploadingProfileImage = false;
          if (response.success) {
            this.formData.profileImage = response.data.url;
            this.successMessage = 'تم رفع الصورة الشخصية بنجاح';
            console.log('Image URL saved:', response.data.url);
          } else {
            this.errorMessage = response.message || 'فشل رفع الصورة الشخصية';
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.uploadingProfileImage = false;
          this.errorMessage = error.error?.message || error.message || 'فشل رفع الصورة الشخصية';
        }
      });
    }
  }

  onIdCardImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'حجم الصورة يجب أن يكون أقل من 5MB';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'يُسمح فقط بملفات الصور (JPEG, JPG, PNG, GIF, WEBP)';
        return;
      }

      this.uploadingIdCard = true;
      this.errorMessage = '';

      this.uploadService.uploadImage(file).subscribe({
        next: (response) => {
          console.log('Upload response:', response);
          this.uploadingIdCard = false;
          if (response.success) {
            this.formData.idCardImage = response.data.url;
            this.successMessage = 'تم رفع صورة البطاقة الشخصية بنجاح';
            console.log('ID Card URL saved:', response.data.url);
          } else {
            this.errorMessage = response.message || 'فشل رفع صورة البطاقة الشخصية';
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.uploadingIdCard = false;
          this.errorMessage = error.error?.message || error.message || 'فشل رفع صورة البطاقة الشخصية';
        }
      });
    }
  }

  removeProfileImage() {
    this.formData.profileImage = '';
  }

  removeIdCardImage() {
    this.formData.idCardImage = '';
  }
}

