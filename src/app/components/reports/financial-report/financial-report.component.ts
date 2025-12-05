import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { PaymentService, PaymentRecord } from '../../../services/payment.service';
import { PaymentMethod } from '../../../services/room.service';
import { ModalService } from '../../../services/modal.service';

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
  showAddPaymentModal = false;
  selectedPayment: PaymentRecord | null = null;
  additionalPaymentAmount: number | null = null;
  additionalPaymentMethod: PaymentMethod = 'cash';
  additionalPaymentNotes: string = '';
  isAddingPayment = false;

  paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    visa: 'Visa',
    bank_transfer: 'Bank Transfer',
    other: 'Other'
  };

  statusLabels: Record<string, string> = {
    paid: 'Paid',
    partial: 'Partially Paid',
    unpaid: 'Unpaid'
  };

  paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'visa', label: 'Visa' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private paymentService: PaymentService,
    private modalService: ModalService
  ) {}

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
        this.errorMessage = error.error?.message || 'Failed to load financial report';
      }
    });
  }

  resetFilters() {
    this.filters = {};
    this.loadReport();
  }

  getMethodLabel(method?: string): string {
    return this.paymentMethodLabels[method || ''] || 'Not Specified';
  }

  getStatusLabel(status?: string): string {
    return this.statusLabels[status || ''] || 'Not Specified';
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
    return `$${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  openAddPaymentModal(payment: PaymentRecord) {
    this.selectedPayment = payment;
    this.additionalPaymentAmount = null;
    this.additionalPaymentMethod = 'cash';
    this.additionalPaymentNotes = '';
    this.showAddPaymentModal = true;
  }

  closeAddPaymentModal() {
    this.showAddPaymentModal = false;
    this.selectedPayment = null;
    this.additionalPaymentAmount = null;
    this.additionalPaymentMethod = 'cash';
    this.additionalPaymentNotes = '';
    this.isAddingPayment = false;
  }

  addPayment() {
    if (!this.selectedPayment?.id || !this.additionalPaymentAmount || this.additionalPaymentAmount <= 0) {
      this.modalService.showAlert({
        title: 'Warning',
        message: 'Please enter a valid amount'
      }).subscribe();
      return;
    }

    if (this.additionalPaymentAmount > (this.selectedPayment.remainingAmount || 0)) {
      this.modalService.showAlert({
        title: 'Warning',
        message: 'Payment amount cannot exceed remaining amount'
      }).subscribe();
      return;
    }

    this.isAddingPayment = true;
    this.paymentService.addPayment(
      this.selectedPayment.id,
      this.additionalPaymentAmount,
      this.additionalPaymentMethod,
      this.additionalPaymentNotes || undefined
    ).subscribe({
      next: (response) => {
        this.isAddingPayment = false;
        if (response.success) {
          this.closeAddPaymentModal();
          this.loadReport();
          this.modalService.showAlert({
            title: 'Success',
            message: 'Payment added successfully'
          }).subscribe();
        }
      },
      error: (error) => {
        this.isAddingPayment = false;
        this.modalService.showAlert({
          title: 'Error',
          message: error.error?.message || 'Failed to add payment'
        }).subscribe();
      }
    });
  }
}

