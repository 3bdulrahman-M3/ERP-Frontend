import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollegeService, College } from '../../../services/college.service';
import { StudentService, Student } from '../../../services/student.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-colleges-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './colleges-list.component.html',
  styleUrl: './colleges-list.component.css'
})
export class CollegesListComponent implements OnInit {
  colleges: College[] = [];
  students: Student[] = [];
  selectedCollegeId: number | null = null;
  selectedYear: number | null = null;
  showManageModal = false;
  isLoading = false;
  isLoadingStudents = false;
  errorMessage = '';
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCollege: College | null = null;
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  currentPageStudents = 1;
  limitStudents = 10;
  totalStudents = 0;
  totalPagesStudents = 0;
  years = [1, 2, 3, 4, 5, 6];
  
  formData = {
    name: '',
    description: ''
  };

  constructor(
    private collegeService: CollegeService,
    private studentService: StudentService,
    public router: Router
  ) {}

  ngOnInit() {
    this.loadColleges();
  }

  loadColleges() {
    this.isLoading = true;
    this.errorMessage = '';

    this.collegeService.getAllColleges(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.colleges = response.data.colleges;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الكليات';
      }
    });
  }

  openAddModal() {
    this.formData = { name: '', description: '' };
    this.showAddModal = true;
    this.showManageModal = false; // Close manage modal when opening add modal
  }

  closeAddModal() {
    this.showAddModal = false;
    this.formData = { name: '', description: '' };
    this.showManageModal = true; // Reopen manage modal after closing add modal
  }

  openEditModal(college: College) {
    this.selectedCollege = college;
    this.formData = {
      name: college.name,
      description: college.description || ''
    };
    this.showEditModal = true;
    this.showManageModal = false; // Close manage modal when opening edit modal
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedCollege = null;
    this.formData = { name: '', description: '' };
    this.showManageModal = true; // Reopen manage modal after closing edit modal
  }

  openDeleteModal(college: College) {
    this.selectedCollege = college;
    this.showDeleteModal = true;
    this.showManageModal = false; // Close manage modal when opening delete modal
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedCollege = null;
    this.showManageModal = true; // Reopen manage modal after closing delete modal
  }

  addCollege() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الكلية';
      return;
    }

    this.isLoading = true;
    this.collegeService.createCollege(this.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeAddModal();
          this.loadColleges();
          this.loadStudents(); // Reload students to reflect changes
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل إضافة الكلية';
      }
    });
  }

  updateCollege() {
    if (!this.selectedCollege || !this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الكلية';
      return;
    }

    this.isLoading = true;
    this.collegeService.updateCollege(this.selectedCollege.id, this.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeEditModal();
          this.loadColleges();
          this.loadStudents(); // Reload students to reflect changes
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحديث الكلية';
      }
    });
  }

  deleteCollege() {
    if (!this.selectedCollege) return;

    this.isLoading = true;
    this.collegeService.deleteCollege(this.selectedCollege.id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeDeleteModal();
          this.loadColleges();
          this.loadStudents(); // Reload students to reflect changes
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل حذف الكلية';
      }
    });
  }

  onFilterChange() {
    this.currentPageStudents = 1;
    this.loadStudents();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadColleges();
  }

  loadStudents() {
    this.isLoadingStudents = true;
    this.errorMessage = '';

    this.studentService.getStudentsByCollegeAndYear(
      this.selectedCollegeId || undefined,
      this.selectedYear || undefined,
      this.currentPageStudents,
      this.limitStudents
    ).subscribe({
      next: (response) => {
        this.isLoadingStudents = false;
        if (response.success) {
          this.students = response.data.students;
          this.totalStudents = response.data.pagination.total;
          this.totalPagesStudents = response.data.pagination.totalPages;
          this.currentPageStudents = response.data.pagination.page;
        }
      },
      error: (error) => {
        this.isLoadingStudents = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الطلاب';
      }
    });
  }

  openManageModal() {
    this.showManageModal = true;
    this.loadColleges();
  }

  closeManageModal() {
    this.showManageModal = false;
    this.selectedCollege = null;
    this.formData = { name: '', description: '' };
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadColleges();
    }
  }

  goToPageStudents(page: number) {
    if (page >= 1 && page <= this.totalPagesStudents) {
      this.currentPageStudents = page;
      this.loadStudents();
    }
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

  getPageNumbersStudents(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPagesStudents, 5);
    let startPage = Math.max(1, this.currentPageStudents - 2);
    let endPage = Math.min(this.totalPagesStudents, startPage + maxPages - 1);
    
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

