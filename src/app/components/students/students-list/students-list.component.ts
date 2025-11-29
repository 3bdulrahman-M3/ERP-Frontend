import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService, Student } from '../../../services/student.service';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.css'
})
export class StudentsListComponent implements OnInit {
  students: Student[] = [];
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  isLoading = false;
  errorMessage = '';

  constructor(
    private studentService: StudentService,
    private router: Router,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getAllStudents(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.students = response.data.students;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الطلاب';
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadStudents();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadStudents();
  }

  editStudent(id: number) {
    this.router.navigate(['/dashboard/students', id, 'edit']);
  }

  viewStudent(id: number) {
    this.router.navigate(['/dashboard/students', id]);
  }

  deleteStudent(id: number, name: string) {
    this.modalService.showConfirm({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف الطالب "${name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.studentService.deleteStudent(id).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadStudents();
            }
          },
          error: (error) => {
            this.modalService.showAlert({
              title: 'خطأ',
              message: error.error?.message || 'فشل حذف الطالب'
            }).subscribe();
          }
        });
      }
    });
  }

  addNewStudent() {
    this.router.navigate(['/dashboard/students/new']);
  }

  downloadQRCode(qrCode: string, studentName: string) {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR_${studentName.replace(/\s/g, '_')}.png`;
    link.click();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 5);
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get Math() {
    return Math;
  }
}

