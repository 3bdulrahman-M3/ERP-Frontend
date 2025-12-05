import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService, Student } from '../../../services/student.service';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { formatDateTime12Hour } from '../../../utils/time.util';
import { environment } from '../../../../environments/environment';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css'
})
export class StudentDetailComponent implements OnInit {
  student: Student | null = null;
  isLoading = false;
  errorMessage = '';
  apiUrl = environment.apiUrl;

  constructor(
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStudent(+id);
    }
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
        this.errorMessage = error.error?.message || 'Failed to load student data';
      }
    });
  }

  editStudent() {
    if (this.student) {
      this.router.navigate(['/dashboard/students', this.student.id, 'edit']);
    }
  }

  deleteStudent() {
    if (this.student) {
      this.modalService.showConfirm({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete student "${this.student.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }).subscribe(confirmed => {
        if (confirmed) {
          this.studentService.deleteStudent(this.student!.id).subscribe({
            next: (response) => {
              if (response.success) {
                this.router.navigate(['/dashboard/students']);
              }
            },
            error: (error) => {
              this.modalService.showAlert({
                title: 'Error',
                message: error.error?.message || 'Failed to delete student'
              }).subscribe();
            }
          });
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

  formatDateTime(date: string | Date): string {
    return formatDateTime12Hour(date);
  }

  getProfileImage(): string | null {
    // Try user profileImage first, then student profileImage
    return this.student?.user?.profileImage || this.student?.profileImage || null;
  }

  getProfileImageUrl(): string {
    const profileImage = this.getProfileImage();
    if (!profileImage) {
      return 'https://via.placeholder.com/150?text=No+Image';
    }
    // If it's already a full URL, return it as is
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    // Otherwise, construct the full URL
    return `${this.apiUrl}/uploads/${profileImage}`;
  }
}

