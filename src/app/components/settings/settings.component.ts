import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { LayoutComponent } from '../shared/layout/layout.component';
import { LanguageService } from '../../services/language.service';

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
    private uploadService: UploadService,
    public languageService: LanguageService
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
        this.errorMessage = 'Current password is required to change password';
        this.isLoading = false;
        return;
      }

      if (this.formData.newPassword.length < 6) {
        this.errorMessage = 'New password must be at least 6 characters';
        this.isLoading = false;
        return;
      }

      if (this.formData.newPassword !== this.formData.confirmPassword) {
        this.errorMessage = 'New password and confirm password do not match';
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
          this.successMessage = this.languageService.translate('settings.updateSuccess');
          this.currentUser = response.data;
          // Clear password fields
          this.formData.currentPassword = '';
          this.formData.newPassword = '';
          this.formData.confirmPassword = '';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || this.languageService.translate('settings.updateError');
        this.isLoading = false;
      }
    });
  }

  onProfileImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = this.languageService.translate('settings.imageSizeError');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = this.languageService.translate('settings.imageTypeError');
        return;
      }

      this.uploadingProfileImage = true;
      this.errorMessage = '';

      this.uploadService.uploadImage(file).subscribe({
        next: (response: any) => {
          this.uploadingProfileImage = false;
          if (response.success) {
            this.formData.profileImage = response.data.url;
            this.successMessage = 'Profile image uploaded successfully';
          } else {
            this.errorMessage = response.message || 'Failed to upload profile image';
          }
        },
        error: (error: any) => {
          this.uploadingProfileImage = false;
          this.errorMessage = error.error?.message || error.message || 'Failed to upload profile image';
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
          this.successMessage = this.languageService.translate('settings.imageDeleteSuccess');
        },
        error: (error: any) => {
          console.error('Error deleting image:', error);
          this.errorMessage = this.languageService.translate('settings.imageDeleteError');
        }
      });
    }
  }
}

