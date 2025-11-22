import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student } from '../../../services/student.service';
import { CollegeService, College } from '../../../services/college.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-students-by-college',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './students-by-college.component.html',
  styleUrl: './students-by-college.component.css'
})
export class StudentsByCollegeComponent implements OnInit {
  colleges: College[] = [];
  students: Student[] = [];
  selectedCollegeId: number | null = null;
  selectedYear: number | null = null;
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  isLoading = false;
  errorMessage = '';
  years = [1, 2, 3, 4, 5, 6];

  constructor(
    private studentService: StudentService,
    private collegeService: CollegeService
  ) {}

  ngOnInit() {
    this.loadColleges();
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

  onFilterChange() {
    this.currentPage = 1;
    this.loadStudents();
  }

  loadStudents() {
    if (!this.selectedCollegeId && !this.selectedYear) {
      this.students = [];
      this.total = 0;
      this.totalPages = 0;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.studentService.getStudentsByCollegeAndYear(
      this.selectedCollegeId || undefined,
      this.selectedYear || undefined,
      this.currentPage,
      this.limit
    ).subscribe({
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

