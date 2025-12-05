import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { CheckInOutService, CheckInOutRecord } from '../../../services/check-in-out.service';
import { StudentService, Student } from '../../../services/student.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-check-in-out-report',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './check-in-out-report.component.html',
  styleUrl: './check-in-out-report.component.css'
})
export class CheckInOutReportComponent implements OnInit {
  records: CheckInOutRecord[] = [];
  isLoading = false;
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  total = 0;

  // Search filters
  searchQuery = '';
  searchResults: Student[] = [];
  showSuggestions = false;
  selectedStudent: Student | null = null;
  selectedDate = '';
  selectedStatus = '';
  private searchSubject = new Subject<string>();

  constructor(
    private checkInOutService: CheckInOutService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    this.loadRecords();
    
    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length >= 2) {
          return this.checkInOutService.searchStudents(query, 5);
        } else {
          return [{ success: true, message: '', data: [] }];
        }
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.searchResults = response.data;
          this.showSuggestions = response.data.length > 0 && this.searchQuery.length >= 2;
        }
      },
      error: (error) => {
        console.error('Error searching students:', error);
        this.searchResults = [];
        this.showSuggestions = false;
      }
    });
  }

  onSearchInput() {
    if (this.searchQuery.length >= 2) {
      this.searchSubject.next(this.searchQuery);
    } else {
      this.searchResults = [];
      this.showSuggestions = false;
      this.selectedStudent = null;
    }
  }

  selectStudent(student: Student) {
    this.selectedStudent = student;
    this.searchQuery = student.name;
    this.showSuggestions = false;
    this.currentPage = 1;
    this.loadRecords();
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onSearchFocus() {
    if (this.searchResults.length > 0 && this.searchQuery.length >= 2) {
      this.showSuggestions = true;
    }
  }

  loadRecords() {
    this.isLoading = true;
    const filters: any = {};
    
    if (this.selectedDate) {
      filters.date = this.selectedDate;
    }
    
    if (this.selectedStatus) {
      filters.status = this.selectedStatus;
    }

    if (this.selectedStudent) {
      filters.studentId = this.selectedStudent.id;
    }

    this.checkInOutService.getAllRecords(this.currentPage, this.limit, filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.records = response.data.records;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading records:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadRecords();
  }

  resetFilters() {
    this.selectedDate = '';
    this.selectedStatus = '';
    this.selectedStudent = null;
    this.searchQuery = '';
    this.searchResults = [];
    this.showSuggestions = false;
    this.currentPage = 1;
    this.loadRecords();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRecords();
    }
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US');
  }

  getStatusBadgeClass(status: string): string {
    return status === 'checked_in' 
      ? 'bg-gray-700 text-white' 
      : 'bg-gray-400 text-white';
  }

  getStatusText(status: string): string {
    return status === 'checked_in' ? 'Checked In' : 'Checked Out';
  }
}

