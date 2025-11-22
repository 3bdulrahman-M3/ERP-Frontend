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
    this.loadStudents();
  }

  loadColleges() {
    this.isLoading = true;
    this.errorMessage = '';

    this.collegeService.getAllColleges().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.colleges = response.data;
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
  }

  closeAddModal() {
    this.showAddModal = false;
    this.formData = { name: '', description: '' };
  }

  openEditModal(college: College) {
    this.selectedCollege = college;
    this.formData = {
      name: college.name,
      description: college.description || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedCollege = null;
    this.formData = { name: '', description: '' };
  }

  openDeleteModal(college: College) {
    this.selectedCollege = college;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedCollege = null;
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
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل حذف الكلية';
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadStudents();
  }

  loadStudents() {
    this.isLoadingStudents = true;
    this.errorMessage = '';

    this.studentService.getStudentsByCollegeAndYear(
      this.selectedCollegeId || undefined,
      this.selectedYear || undefined,
      this.currentPage,
      this.limit
    ).subscribe({
      next: (response) => {
        this.isLoadingStudents = false;
        if (response.success) {
          this.students = response.data.students;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
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

  get Math() {
    return Math;
  }
}

