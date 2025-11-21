import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentService, Student } from '../../../services/student.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

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

  constructor(
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
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
}

