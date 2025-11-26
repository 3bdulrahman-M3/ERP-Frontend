import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceService, Service } from '../../../services/service.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './services-list.component.html',
  styleUrl: './services-list.component.css'
})
export class ServicesListComponent implements OnInit {
  services: Service[] = [];
  isLoading = false;
  errorMessage = '';
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedService: Service | null = null;
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  formData = {
    name: '',
    description: '',
    icon: ''
  };

  constructor(private serviceService: ServiceService) {}

  ngOnInit() {
    this.loadServices();
  }

  loadServices() {
    this.isLoading = true;
    this.errorMessage = '';

    this.serviceService.getAllServices(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.services = response.data.services;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الخدمات';
      }
    });
  }

  openAddModal() {
    this.formData = { name: '', description: '', icon: '' };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.formData = { name: '', description: '', icon: '' };
  }

  openEditModal(service: Service) {
    this.selectedService = service;
    this.formData = {
      name: service.name,
      description: service.description || '',
      icon: service.icon || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedService = null;
    this.formData = { name: '', description: '', icon: '' };
  }

  openDeleteModal(service: Service) {
    this.selectedService = service;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedService = null;
  }

  addService() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الخدمة';
      return;
    }

    this.isLoading = true;
    this.serviceService.createService(this.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeAddModal();
          this.loadServices();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل إضافة الخدمة';
      }
    });
  }

  updateService() {
    if (!this.selectedService || !this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الخدمة';
      return;
    }

    this.isLoading = true;
    this.serviceService.updateService(this.selectedService.id, this.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeEditModal();
          this.loadServices();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحديث الخدمة';
      }
    });
  }

  deleteService() {
    if (!this.selectedService) return;

    this.isLoading = true;
    this.serviceService.deleteService(this.selectedService.id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeDeleteModal();
          this.loadServices();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل حذف الخدمة';
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadServices();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadServices();
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

