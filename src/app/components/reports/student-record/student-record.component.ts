import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { CheckInOutService, CheckInOutRecord } from '../../../services/check-in-out.service';
import { StudentService, Student } from '../../../services/student.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-student-record',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './student-record.component.html',
  styleUrl: './student-record.component.css'
})
export class StudentRecordComponent implements OnInit {
  records: CheckInOutRecord[] = [];
  isLoading = false;
  isLoadingHistory = false;
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  total = 0;

  // Search
  searchQuery = '';
  searchResults: Student[] = [];
  showSuggestions = false;
  selectedStudent: Student | null = null;
  private searchSubject = new Subject<string>();

  constructor(
    private checkInOutService: CheckInOutService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
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
      this.records = [];
    }
  }

  selectStudent(student: Student) {
    this.selectedStudent = student;
    this.searchQuery = student.name;
    this.showSuggestions = false;
    this.currentPage = 1;
    this.loadStudentHistory();
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

  loadStudentHistory() {
    if (!this.selectedStudent) {
      return;
    }

    this.isLoadingHistory = true;
    this.checkInOutService.getStudentHistory(this.selectedStudent.id, this.currentPage, this.limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.records = response.data.records;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
        }
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading student history:', error);
        this.isLoadingHistory = false;
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadStudentHistory();
    }
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('ar-EG');
  }

  getStatusBadgeClass(status: string): string {
    return status === 'checked_in' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  getStatusText(status: string): string {
    return status === 'checked_in' ? 'داخل' : 'خارج';
  }
}

