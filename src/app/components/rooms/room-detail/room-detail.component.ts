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
  paymentMethodOptions = [
    { value: 'cash', label: 'نقدي' },
    { value: 'visa', label: 'فيزا' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'other', label: 'أخرى' }
  ];
  paymentMethodLabels: Record<string, string> = {
    cash: 'نقدي',
    visa: 'فيزا',
    bank_transfer: 'تحويل بنكي',
    other: 'أخرى'
  };

  constructor(
    private roomService: RoomService,
    private studentService: StudentService,
    private roomRequestService: RoomRequestService,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService
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
      paid: 'تم الدفع',
      partial: 'مدفوع جزئياً',
      unpaid: 'لم يتم الدفع'
    };
    return labels[status || ''] || 'غير محدد';
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
    return `${numericValue.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
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
          // Extract requests from room data if available
          if (response.data.requests) {
            this.roomRequests = response.data.requests;
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الغرفة';
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
      title: 'تأكيد القبول',
      message: 'هل أنت متأكد من قبول هذا الطلب؟',
      confirmText: 'قبول',
      cancelText: 'إلغاء'
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
              title: 'خطأ',
              message: error.error?.message || 'فشل قبول الطلب'
            }).subscribe();
          }
        });
      }
    });
  }

  rejectRequest(requestId: number) {
    this.modalService.showConfirm({
      title: 'تأكيد الرفض',
      message: 'هل أنت متأكد من رفض هذا الطلب؟',
      confirmText: 'رفض',
      cancelText: 'إلغاء'
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
              title: 'خطأ',
              message: error.error?.message || 'فشل رفض الطلب'
            }).subscribe();
          }
        });
      }
    });
  }

  getRequestStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'pending': 'قيد الانتظار',
      'accepted': 'مقبول',
      'rejected': 'مرفوض'
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
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف الغرفة "${this.room.roomNumber}"؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء'
      }).subscribe(confirmed => {
        if (confirmed) {
          this.roomService.deleteRoom(this.room!.id).subscribe({
            next: (response) => {
              if (response.success) {
                this.router.navigate(['/dashboard/rooms']);
              } else {
                this.modalService.showAlert({
                  title: 'خطأ',
                  message: response.message || 'فشل حذف الغرفة'
                }).subscribe();
              }
            },
            error: (error) => {
              console.error('Delete room error:', error);
              const errorMessage = error.error?.message || error.message || 'فشل حذف الغرفة';
              this.modalService.showAlert({
                title: 'خطأ',
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
        title: 'تنبيه',
        message: 'الرجاء اختيار طالب'
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
          title: 'خطأ',
          message: error.error?.message || 'فشل إسناد الطالب للغرفة'
        }).subscribe();
      }
    });
  }

  checkOutStudent(studentId: number, studentName: string) {
    this.modalService.showConfirm({
      title: 'تأكيد الإخراج',
      message: `هل أنت متأكد من إخراج الطالب "${studentName}" من الغرفة؟`,
      confirmText: 'إخراج',
      cancelText: 'إلغاء'
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
              title: 'خطأ',
              message: error.error?.message || 'فشل إخراج الطالب'
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
        return 'متاحة';
      case 'occupied':
        return 'مشغولة';
      case 'maintenance':
        return 'صيانة';
      case 'reserved':
        return 'محجوزة';
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
        title: 'تنبيه',
        message: 'لا توجد بيانات دفع لهذا الطالب'
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
        title: 'تنبيه',
        message: 'الرجاء إدخال مبلغ صحيح'
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
            title: 'نجح',
            message: 'تم إضافة الدفعة بنجاح'
          }).subscribe();
        }
      },
      error: (error) => {
        this.modalService.showAlert({
          title: 'خطأ',
          message: error.error?.message || 'فشل إضافة الدفعة'
        }).subscribe();
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard/rooms']);
  }
}

