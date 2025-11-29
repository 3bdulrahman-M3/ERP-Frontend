import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { PaymentService, PaymentRecord } from '../../../services/payment.service';

@Component({
  selector: 'app-financial-report',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './financial-report.component.html',
  styleUrl: './financial-report.component.css'
})
export class FinancialReportComponent implements OnInit {
  payments: PaymentRecord[] = [];
  totals = {
    totalDue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    methods: {} as Record<string, { totalPaid: number; count: number; }>
  };
  filters: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    status?: string;
  } = {};
  isLoading = false;
  errorMessage = '';

  paymentMethodLabels: Record<string, string> = {
    cash: 'نقدي',
    visa: 'فيزا',
    bank_transfer: 'تحويل بنكي',
    other: 'أخرى'
  };

  statusLabels: Record<string, string> = {
    paid: 'تم الدفع',
    partial: 'مدفوع جزئياً',
    unpaid: 'لم يتم الدفع'
  };

  paymentMethodOptions = [
    { value: 'cash', label: 'نقدي' },
    { value: 'visa', label: 'فيزا' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'other', label: 'أخرى' }
  ];

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.isLoading = true;
    this.errorMessage = '';
    this.paymentService.getFinancialReport(this.filters).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.payments = response.data.payments;
          this.totals = response.data.totals;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل التقرير المالي';
      }
    });
  }

  resetFilters() {
    this.filters = {};
    this.loadReport();
  }

  getMethodLabel(method?: string): string {
    return this.paymentMethodLabels[method || ''] || 'غير محدد';
  }

  getStatusLabel(status?: string): string {
    return this.statusLabels[status || ''] || 'غير محدد';
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'paid':
        return 'bg-gray-700 text-white';
      case 'partial':
        return 'bg-gray-600 text-white';
      case 'unpaid':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  formatCurrency(value?: number | string | null): string {
    const numericValue = Number(value ?? 0);
    return `${numericValue.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
  }
}

