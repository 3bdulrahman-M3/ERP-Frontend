import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrationRequestService, RegistrationRequest } from '../../services/registration-request.service';
import { LayoutComponent } from '../shared/layout/layout.component';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-registration-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './registration-requests.component.html',
  styleUrl: './registration-requests.component.css'
})
export class RegistrationRequestsComponent implements OnInit {
  requests: RegistrationRequest[] = [];
  filteredRequests: RegistrationRequest[] = [];
  isLoading = false;
  errorMessage = '';
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  selectedRequest: RegistrationRequest | null = null;

  constructor(
    private registrationRequestService: RegistrationRequestService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading = true;
    this.errorMessage = '';

    this.registrationRequestService.getRequests().subscribe({
      next: (response) => {
        if (response.success) {
          this.requests = response.data;
          this.applyFilter();
        } else {
          this.errorMessage = 'Failed to load registration requests';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while loading registration requests';
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    if (this.filterStatus === 'all') {
      this.filteredRequests = this.requests;
    } else {
      this.filteredRequests = this.requests.filter(r => r.status === this.filterStatus);
    }
  }

  onFilterChange() {
    this.applyFilter();
  }

  viewRequest(request: RegistrationRequest) {
    this.selectedRequest = request;
  }

  closeRequestDetails() {
    this.selectedRequest = null;
  }

  approveRequest(id: number) {
    this.modalService.showConfirm({
      title: 'Confirm Approval',
      message: 'Are you sure you want to approve this request? A student account will be created.',
      confirmText: 'Approve',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;
      this.registrationRequestService.approveRequest(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadRequests();
            this.closeRequestDetails();
          } else {
            this.errorMessage = response.message || 'Failed to approve request';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'An error occurred while approving the request';
          this.isLoading = false;
        }
      });
    });
  }

  rejectRequest(id: number) {
    this.modalService.showConfirm({
      title: 'Confirm Rejection',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }

      this.isLoading = true;
      this.registrationRequestService.rejectRequest(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadRequests();
            this.closeRequestDetails();
          } else {
            this.errorMessage = response.message || 'Failed to reject request';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'An error occurred while rejecting the request';
          this.isLoading = false;
        }
      });
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

