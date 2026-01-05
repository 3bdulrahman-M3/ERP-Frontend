import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService, Room, RoomStudent, PaymentMethod } from '../../../services/room.service';
import { StudentService } from '../../../services/student.service';
import { RoomRequestService, RoomRequest } from '../../../services/room-request.service';
import { PaymentService } from '../../../services/payment.service';
import { LayoutComponent } from '../../shared/layout/layout.component';
import { ModalService } from '../../../services/modal.service';
import { LanguageService } from '../../../services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './room-detail.component.html',
  styleUrl: './room-detail.component.css'
})
export class RoomDetailComponent implements OnInit {
  room: Room | null = null;
  roomStudents: RoomStudent[] = [];
  roomRequests: RoomRequest[] = [];
  isLoading = false;
  isLoadingRequests = false;
  errorMessage = '';
  showAssignModal = false;
  showAddPaymentModal = false;
  selectedStudentId: number | null = null;
  selectedPaymentId: number | null = null;
  additionalPaymentAmount: number | null = null;
  additionalPaymentMethod: PaymentMethod = 'cash';
  additionalPaymentNotes: string = '';
  paymentAmountDue: number | null = null;
  paymentAmountPaid: number | null = null;
  paymentMethod: PaymentMethod = 'cash';
  availableStudents: any[] = [];
  currentPage = 1;
  totalPages = 1;
  currentImageIndex = 0;
  paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'visa', label: 'Visa' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' }
  ];
  paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    visa: 'Visa',
    bank_transfer: 'Bank Transfer',
    other: 'Other'
  };

  constructor(
    private roomService: RoomService,
    private studentService: StudentService,
    private roomRequestService: RoomRequestService,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    public languageService: LanguageService
  ) {}

  private getSuggestedAmountDue(): number {
    if (!this.room) {
      return 0;
    }
    if (this.room.roomType === 'single' && this.room.roomPrice) {
      return Number(this.room.roomPrice);
    }
    if (this.room.roomType === 'shared' && this.room.bedPrice) {
      return Number(this.room.bedPrice);
    }
    return 0;
  }

  private resetPaymentForm() {
    this.paymentAmountDue = this.getSuggestedAmountDue();
    this.paymentAmountPaid = this.paymentAmountDue || 0;
    this.paymentMethod = 'cash';
  }

  getPaymentStatusLabel(status?: string | null): string {
    const labels: Record<string, string> = {
      paid: 'Paid',
      partial: 'Partially Paid',
      unpaid: 'Unpaid'
    };
    return labels[status || ''] || 'Not Specified';
  }

  getPaymentStatusClass(status?: string | null): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'unpaid':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  formatCurrency(value?: number | string | null): string {
    const numericValue = Number(value ?? 0);
    return `$${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRoom(+id);
      this.loadRoomStudents(+id);
      this.loadRoomRequests(+id);
    }
  }

  loadRoom(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.roomService.getRoomById(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.room = response.data;
          // Ensure images is always an array
          if (this.room) {
            const imagesValue = this.room.images;
            if (!imagesValue) {
              this.room.images = [];
            } else if (typeof imagesValue === 'string') {
              // Try to parse as JSON array
              try {
                const parsed = JSON.parse(imagesValue);
                this.room.images = Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                // If parsing fails, treat as single image URL string
                const trimmed = (imagesValue as string).trim();
                this.room.images = trimmed ? [trimmed] : [];
              }
            } else if (Array.isArray(imagesValue)) {
              // Ensure all items in array are valid strings
              this.room.images = imagesValue.filter((img): img is string => {
                return typeof img === 'string' && img.trim().length > 0;
              });
            } else {
              this.room.images = [];
            }
          }
          // Reset image index when loading new room
          this.currentImageIndex = 0;
          // Extract requests from room data if available
          if (response.data.requests) {
            this.roomRequests = response.data.requests;
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load room data';
      }
    });
  }

  loadRoomRequests(roomId: number, page: number = 1) {
    this.isLoadingRequests = true;
    this.roomRequestService.getRoomRequests(roomId, page, 10).subscribe({
      next: (response) => {
        if (response.success) {
          this.roomRequests = response.data.requests;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
        this.isLoadingRequests = false;
      },
      error: (error) => {
        console.error('Error loading room requests:', error);
        this.isLoadingRequests = false;
      }
    });
  }

  acceptRequest(requestId: number) {
    this.modalService.showConfirm({
      title: 'Confirm Approval',
      message: 'Are you sure you want to approve this request?',
      confirmText: 'Approve',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.roomRequestService.acceptRoomRequest(requestId).subscribe({
          next: (response) => {
            if (response.success) {
              if (this.room) {
                this.loadRoom(this.room.id);
                this.loadRoomStudents(this.room.id);
                this.loadRoomRequests(this.room.id);
              }
            }
          },
          error: (error) => {
            this.modalService.showAlert({
              title: 'Error',
              message: error.error?.message || 'Failed to approve request'
            }).subscribe();
          }
        });
      }
    });
  }

  rejectRequest(requestId: number) {
    this.modalService.showConfirm({
      title: 'Confirm Rejection',
      message: 'Are you sure you want to reject this request?',
      confirmText: 'Reject',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.roomRequestService.rejectRoomRequest(requestId).subscribe({
          next: (response) => {
            if (response.success) {
              if (this.room) {
                this.loadRoomRequests(this.room.id);
              }
            }
          },
          error: (error) => {
            this.modalService.showAlert({
              title: 'Error',
              message: error.error?.message || 'Failed to reject request'
            }).subscribe();
          }
        });
      }
    });
  }

  getRequestStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'rejected': 'Rejected'
    };
    return texts[status] || status;
  }

  getRequestStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'accepted': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  }

  loadRoomStudents(roomId: number) {
    this.roomService.getRoomStudents(roomId).subscribe({
      next: (response) => {
        if (response.success) {
          this.roomStudents = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading room students:', error);
      }
    });
  }

  editRoom() {
    if (this.room) {
      this.router.navigate(['/dashboard/rooms', this.room.id, 'edit']);
    }
  }

  deleteRoom() {
    if (this.room) {
      this.modalService.showConfirm({
        title: 'Confirm Delete',
        message: `Are you sure you want to delete room "${this.room.roomNumber}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }).subscribe(confirmed => {
        if (confirmed) {
          this.roomService.deleteRoom(this.room!.id).subscribe({
            next: (response) => {
              if (response.success) {
                this.router.navigate(['/dashboard/rooms']);
              } else {
                this.modalService.showAlert({
                  title: 'Error',
                  message: response.message || 'Failed to delete room'
                }).subscribe();
              }
            },
            error: (error) => {
              console.error('Delete room error:', error);
              const errorMessage = error.error?.message || error.message || 'Failed to delete room';
              this.modalService.showAlert({
                title: 'Error',
                message: errorMessage
              }).subscribe();
            }
          });
        }
      });
    }
  }

  openAssignModal() {
    this.showAssignModal = true;
    this.resetPaymentForm();
    this.loadAvailableStudents();
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedStudentId = null;
    this.resetPaymentForm();
  }

  loadAvailableStudents() {
    this.studentService.getAllStudents(1, 100, true).subscribe({
      next: (response) => {
        if (response.success) {
          this.availableStudents = response.data.students;
        }
      },
      error: (error) => {
        console.error('Error loading students:', error);
      }
    });
  }

  assignStudent() {
    if (!this.room || !this.selectedStudentId) {
      this.modalService.showAlert({
        title: 'Warning',
        message: 'Please select a student'
      }).subscribe();
      return;
    }

    const amountDue = this.paymentAmountDue !== null ? Number(this.paymentAmountDue) : this.getSuggestedAmountDue();
    const amountPaid = this.paymentAmountPaid !== null ? Number(this.paymentAmountPaid) : 0;

    this.roomService.assignStudent({
      roomId: this.room.id,
      studentId: this.selectedStudentId,
      payment: {
        amountDue,
        amountPaid,
        paymentMethod: this.paymentMethod
      }
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeAssignModal();
          this.loadRoom(this.room!.id);
          this.loadRoomStudents(this.room!.id);
        }
      },
      error: (error) => {
        this.modalService.showAlert({
          title: 'Error',
          message: error.error?.message || 'Failed to assign student to room'
        }).subscribe();
      }
    });
  }

  checkOutStudent(studentId: number, studentName: string) {
    this.modalService.showConfirm({
      title: 'Confirm Removal',
      message: `Are you sure you want to remove student "${studentName}" from the room?`,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.roomService.checkOutStudent({ studentId }).subscribe({
          next: (response) => {
            if (response.success) {
              this.loadRoom(this.room!.id);
              this.loadRoomStudents(this.room!.id);
            }
          },
          error: (error) => {
            this.modalService.showAlert({
              title: 'Error',
              message: error.error?.message || 'Failed to remove student'
            }).subscribe();
          }
        });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-gray-600';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'reserved':
        return 'bg-gray-700';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'maintenance':
        return 'Maintenance';
      case 'reserved':
        return 'Reserved';
      default:
        return status;
    }
  }

  get Math() {
    return Math;
  }

  openAddPaymentModal(roomStudent: RoomStudent) {
    if (!roomStudent.payment?.id) {
      this.modalService.showAlert({
        title: 'Warning',
        message: 'No payment data for this student'
      }).subscribe();
      return;
    }
    this.selectedPaymentId = roomStudent.payment.id;
    this.additionalPaymentAmount = null;
    this.additionalPaymentMethod = 'cash';
    this.additionalPaymentNotes = '';
    this.showAddPaymentModal = true;
  }

  closeAddPaymentModal() {
    this.showAddPaymentModal = false;
    this.selectedPaymentId = null;
    this.additionalPaymentAmount = null;
    this.additionalPaymentMethod = 'cash';
    this.additionalPaymentNotes = '';
  }

  addPayment() {
    if (!this.selectedPaymentId || !this.additionalPaymentAmount || this.additionalPaymentAmount <= 0) {
      this.modalService.showAlert({
        title: 'Warning',
        message: 'Please enter a valid amount'
      }).subscribe();
      return;
    }

    this.paymentService.addPayment(
      this.selectedPaymentId,
      this.additionalPaymentAmount,
      this.additionalPaymentMethod,
      this.additionalPaymentNotes || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeAddPaymentModal();
          if (this.room) {
            this.loadRoomStudents(this.room.id);
          }
          this.modalService.showAlert({
            title: 'Success',
            message: 'Payment added successfully'
          }).subscribe();
        }
      },
      error: (error) => {
        this.modalService.showAlert({
          title: 'Error',
          message: error.error?.message || 'Failed to add payment'
        }).subscribe();
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/rooms']);
  }

  nextImage() {
    if (this.room && Array.isArray(this.room.images) && this.room.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.room.images.length;
    }
  }

  previousImage() {
    if (this.room && Array.isArray(this.room.images) && this.room.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.room.images.length) % this.room.images.length;
    }
  }

  goToImage(index: number) {
    this.currentImageIndex = index;
  }

  getImageUrl(image: string): string {
    if (!image) return '';
    // If it's already a full URL, return it as is
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    // If it starts with /uploads, add the API URL
    if (image.startsWith('/uploads/')) {
      return `${environment.apiUrl}${image}`;
    }
    // Otherwise, assume it's a filename and construct the URL
    return `${environment.apiUrl}/uploads/${image}`;
  }

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}

