import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../shared/layout/layout.component';
import { LanguageService } from '../../services/language.service';
import { CheckInOutService, CheckInOutRecord } from '../../services/check-in-out.service';

declare var Html5Qrcode: any;

@Component({
  selector: 'app-check-in-out',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './check-in-out.component.html',
  styleUrl: './check-in-out.component.css'
})
export class CheckInOutComponent implements OnInit, OnDestroy {
  @ViewChild('qrReader', { static: false }) qrReaderElement!: ElementRef;

  records: CheckInOutRecord[] = [];
  todayRecords: CheckInOutRecord[] = [];
  isLoading = false;
  isScanning = false;
  html5QrCode: any = null;
  currentPage = 1;
  limit = 10;
  totalPages = 1;
  total = 0;

  // Filters
  selectedDate = new Date().toISOString().split('T')[0];
  selectedStatus = '';
  showScanner = false;

  // Success/Error messages
  successMessage = '';
  errorMessage = '';

  constructor(
    private checkInOutService: CheckInOutService,
    public languageService: LanguageService
  ) {}

  ngOnInit() {
    this.loadTodayCheckIns();
    this.loadRecords();
  }

  ngOnDestroy() {
    this.stopScanning();
  }

  loadTodayCheckIns() {
    this.checkInOutService.getTodayCheckIns().subscribe({
      next: (response) => {
        if (response.success) {
          this.todayRecords = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading today check-ins:', error);
      }
    });
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
        this.errorMessage = 'Failed to load records';
        this.isLoading = false;
      }
    });
  }

  startScanning() {
    if (this.isScanning) {
      return;
    }

    this.showScanner = true;
    this.isScanning = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Wait for the view to update
    setTimeout(() => {
      const elementId = 'qr-reader';
      this.html5QrCode = new Html5Qrcode(elementId);

      this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText: string, decodedResult: any) => {
          this.onQRCodeScanned(decodedText);
        },
        (errorMessage: string) => {
          // Ignore scanning errors
        }
      ).catch((err: any) => {
        console.error('Error starting QR scanner:', err);
        this.errorMessage = this.languageService.translate('checkInOut.cameraError');
        this.isScanning = false;
        this.showScanner = false;
      });
    }, 100);
  }

  stopScanning() {
    if (this.html5QrCode && this.isScanning) {
      this.html5QrCode.stop().then(() => {
        this.html5QrCode.clear();
        this.html5QrCode = null;
        this.isScanning = false;
        this.showScanner = false;
      }).catch((err: any) => {
        console.error('Error stopping QR scanner:', err);
        this.isScanning = false;
        this.showScanner = false;
      });
    }
  }

  onQRCodeScanned(qrData: string) {
    this.stopScanning();

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.checkInOutService.checkInOutByQR(qrData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.loadTodayCheckIns();
          this.loadRecords();
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || this.languageService.translate('checkInOut.checkError');
        this.isLoading = false;
        
        // Clear error after 5 seconds
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadRecords();
  }

  resetFilters() {
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.selectedStatus = '';
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
    return status === 'checked_in' 
      ? this.languageService.translate('checkInOut.checkedIn') 
      : this.languageService.translate('checkInOut.checkedOut');
  }
}

