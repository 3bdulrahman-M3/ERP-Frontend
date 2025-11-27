import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService, Room } from '../../../services/room.service';
import { BuildingService, Building } from '../../../services/building.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-rooms-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './rooms-list.component.html',
  styleUrl: './rooms-list.component.css'
})
export class RoomsListComponent implements OnInit {
  rooms: Room[] = [];
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  isLoading = false;
  errorMessage = '';

  // Filters
  statusFilter = '';
  buildingFilter: number | null = null;
  floorFilter: number | null = null;
  buildings: Building[] = [];

  constructor(
    private roomService: RoomService,
    private buildingService: BuildingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBuildings();
    this.loadRooms();
  }

  loadBuildings() {
    // Get all buildings without pagination
    this.buildingService.getAllBuildings(1, 1000).subscribe({
      next: (response) => {
        if (response.success) {
          this.buildings = response.data.buildings;
        }
      },
      error: (error) => {
        console.error('Error loading buildings:', error);
      }
    });
  }

  loadRooms() {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    if (this.buildingFilter) filters.buildingId = this.buildingFilter;
    if (this.floorFilter) filters.floor = this.floorFilter;

    this.roomService.getAllRooms(this.currentPage, this.limit, filters).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.rooms = response.data.rooms;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الغرف';
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRooms();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadRooms();
  }

  editRoom(id: number) {
    this.router.navigate(['/dashboard/rooms', id, 'edit']);
  }

  viewRoom(id: number) {
    this.router.navigate(['/dashboard/rooms', id]);
  }

  deleteRoom(id: number, roomNumber: string) {
    if (confirm(`هل أنت متأكد من حذف الغرفة "${roomNumber}"؟`)) {
      this.roomService.deleteRoom(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadRooms();
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

  addNewRoom() {
    this.router.navigate(['/dashboard/rooms/new']);
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadRooms();
  }

  clearFilters() {
    this.statusFilter = '';
    this.buildingFilter = null;
    this.floorFilter = null;
    this.currentPage = 1;
    this.loadRooms();
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

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 5);
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get Math() {
    return Math;
  }
}

