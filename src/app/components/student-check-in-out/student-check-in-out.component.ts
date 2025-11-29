import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../shared/layout/layout.component';
import { CheckInOutService, CheckInOutRecord } from '../../services/check-in-out.service';

@Component({
  selector: 'app-student-check-in-out',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './student-check-in-out.component.html',
  styleUrl: './student-check-in-out.component.css'
})
export class StudentCheckInOutComponent implements OnInit {
  records: CheckInOutRecord[] = [];
  isLoading = false;
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  total = 0;

  constructor(
    private checkInOutService: CheckInOutService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.checkInOutService.getMyHistory(this.currentPage, this.limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.records = response.data.records || [];
          this.total = response.data.pagination?.total || 0;
          this.totalPages = response.data.pagination?.totalPages || 1;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.isLoading = false;
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadHistory();
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
      ? 'bg-gray-700 text-white' 
      : 'bg-gray-400 text-white';
  }

  getStatusText(status: string): string {
    return status === 'checked_in' ? 'داخل' : 'خارج';
  }
}

