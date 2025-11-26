import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RoomService, Room, RoomStudent } from '../../../services/room.service';
import { StudentService } from '../../../services/student.service';
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
  isLoading = false;
  errorMessage = '';
  showAssignModal = false;
  selectedStudentId: number | null = null;
  selectedPaid: boolean = false;
  availableStudents: any[] = [];

  constructor(
    private roomService: RoomService,
    private studentService: StudentService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRoom(+id);
      this.loadRoomStudents(+id);
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
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل بيانات الغرفة';
      }
    });
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

