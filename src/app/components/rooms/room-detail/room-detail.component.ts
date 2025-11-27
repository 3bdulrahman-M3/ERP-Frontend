import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService, Room, RoomStudent } from '../../../services/room.service';
import { StudentService } from '../../../services/student.service';
import { RoomRequestService, RoomRequest } from '../../../services/room-request.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

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
  selectedStudentId: number | null = null;
  selectedPaid: boolean = false;
  availableStudents: any[] = [];
  currentPage = 1;
  totalPages = 1;

  constructor(
    private roomService: RoomService,
    private studentService: StudentService,
    private roomRequestService: RoomRequestService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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
    if (confirm('هل أنت متأكد من قبول هذا الطلب؟')) {
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
          alert(error.error?.message || 'فشل قبول الطلب');
        }
      });
    }
  }

  rejectRequest(requestId: number) {
    if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
      this.roomRequestService.rejectRoomRequest(requestId).subscribe({
        next: (response) => {
          if (response.success) {
            if (this.room) {
              this.loadRoomRequests(this.room.id);
            }
          }
        },
        error: (error) => {
          alert(error.error?.message || 'فشل رفض الطلب');
        }
      });
    }
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
    if (this.room && confirm(`هل أنت متأكد من حذف الغرفة "${this.room.roomNumber}"؟`)) {
      this.roomService.deleteRoom(this.room.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard/rooms']);
          } else {
            alert(response.message || 'فشل حذف الغرفة');
          }
        },
        error: (error) => {
          console.error('Delete room error:', error);
          const errorMessage = error.error?.message || error.message || 'فشل حذف الغرفة';
          alert(errorMessage);
        }
      });
    }
  }

  openAssignModal() {
    this.showAssignModal = true;
    this.loadAvailableStudents();
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedStudentId = null;
    this.selectedPaid = false;
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
      alert('الرجاء اختيار طالب');
      return;
    }

    this.roomService.assignStudent({
      roomId: this.room.id,
      studentId: this.selectedStudentId,
      paid: this.selectedPaid
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.closeAssignModal();
          this.loadRoom(this.room!.id);
          this.loadRoomStudents(this.room!.id);
        }
      },
      error: (error) => {
        alert(error.error?.message || 'فشل إسناد الطالب للغرفة');
      }
    });
  }

  checkOutStudent(studentId: number, studentName: string) {
    if (confirm(`هل أنت متأكد من إخراج الطالب "${studentName}" من الغرفة؟`)) {
      this.roomService.checkOutStudent({ studentId }).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadRoom(this.room!.id);
            this.loadRoomStudents(this.room!.id);
          }
        },
        error: (error) => {
          alert(error.error?.message || 'فشل إخراج الطالب');
        }
      });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'reserved':
        return 'bg-purple-500';
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

  goBack() {
    this.router.navigate(['/dashboard/rooms']);
  }
}

