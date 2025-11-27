import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { LayoutComponent } from '../shared/layout/layout.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  uploadingProfileImage = false;

  formData = {
    name: '',
    email: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private authService: AuthService,
    private uploadService: UploadService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.formData.name = this.currentUser.name;
      this.formData.email = this.currentUser.email;
      this.formData.profileImage = this.currentUser.profileImage || '';
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Validate password if new password is provided
    if (this.formData.newPassword) {
      if (!this.formData.currentPassword) {
        this.errorMessage = 'يجب إدخال كلمة المرور الحالية لتغيير كلمة المرور';
        this.isLoading = false;
        return;
      }

      if (this.formData.newPassword.length < 6) {
        this.errorMessage = 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل';
        this.isLoading = false;
        return;
      }

      if (this.formData.newPassword !== this.formData.confirmPassword) {
        this.errorMessage = 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقين';
        this.isLoading = false;
        return;
      }
    }

    const updateData: { name?: string; email?: string; password?: string; profileImage?: string } = {
      name: this.formData.name,
      email: this.formData.email
    };

    // Only include password if new password is provided
    if (this.formData.newPassword) {
      updateData.password = this.formData.newPassword;
    }

    // Include profile image (even if empty string to allow deletion)
    if (this.formData.profileImage !== undefined) {
      updateData.profileImage = this.formData.profileImage || undefined;
    }

    this.authService.updateProfile(updateData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = 'تم تحديث البيانات بنجاح';
          this.currentUser = response.data;
          // Clear password fields
          this.formData.currentPassword = '';
          this.formData.newPassword = '';
          this.formData.confirmPassword = '';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'حدث خطأ أثناء تحديث البيانات';
        this.isLoading = false;
      }
    });
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
        next: (response: any) => {
          this.uploadingProfileImage = false;
          if (response.success) {
            this.formData.profileImage = response.data.url;
            this.successMessage = 'تم رفع الصورة الشخصية بنجاح';
          } else {
            this.errorMessage = response.message || 'فشل رفع الصورة الشخصية';
          }
        },
        error: (error: any) => {
          this.uploadingProfileImage = false;
          this.errorMessage = error.error?.message || error.message || 'فشل رفع الصورة الشخصية';
        }
      });
    }
  }

  deleteProfileImage() {
    if (this.formData.profileImage) {
      // Extract filename from URL
      const urlParts = this.formData.profileImage.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      this.uploadService.deleteImage(filename).subscribe({
        next: () => {
          this.formData.profileImage = '';
          this.successMessage = 'تم حذف الصورة الشخصية';
        },
        error: (error: any) => {
          console.error('Error deleting image:', error);
        }
      });
    }
  }
}

