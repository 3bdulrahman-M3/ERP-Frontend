import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BuildingService, Building } from '../../../services/building.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-buildings-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './buildings-list.component.html',
  styleUrl: './buildings-list.component.css'
})
export class BuildingsListComponent implements OnInit {
  buildings: Building[] = [];
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedBuilding: Building | null = null;
  isLoading = false;
  errorMessage = '';
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  
  formData = {
    name: '',
    address: '',
    mapUrl: '',
    floors: ''
  };

  constructor(
    private buildingService: BuildingService,
    private sanitizer: DomSanitizer
  ) {}

  getMapEmbedUrl(): SafeResourceUrl | null {
    if (this.formData.mapUrl) {
      let embedUrl = this.formData.mapUrl.trim();
      
      // If it's already an embed URL, use it as is
      if (embedUrl.includes('/embed') || embedUrl.includes('output=embed')) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      }
      
      // Convert regular Google Maps URL to embed format
      if (embedUrl.includes('google.com/maps')) {
        // Extract the query part
        if (embedUrl.includes('?q=')) {
          const query = embedUrl.split('?q=')[1]?.split('&')[0];
          if (query) {
            embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
          }
        } else if (embedUrl.includes('/place/')) {
          // Extract place ID or name
          const placeMatch = embedUrl.match(/\/place\/([^/?]+)/);
          if (placeMatch && placeMatch[1]) {
            const placeId = placeMatch[1];
            embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(placeId)}&output=embed`;
          }
        } else if (embedUrl.includes('/@')) {
          // Extract coordinates from @lat,lng format
          const coordMatch = embedUrl.match(/@([^,]+),([^,]+)/);
          if (coordMatch && coordMatch[1] && coordMatch[2]) {
            embedUrl = `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed`;
          }
        } else {
          // Try to use the URL as is with output=embed
          if (!embedUrl.includes('output=')) {
            embedUrl = embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'output=embed';
          }
        }
      }
      
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    return null;
  }

  getDirectionsUrl(mapUrl: string | null | undefined): string | null {
    if (!mapUrl) return null;
    
    // Convert to directions URL
    if (mapUrl.includes('google.com/maps')) {
      if (mapUrl.includes('/place/')) {
        const placeMatch = mapUrl.match(/\/place\/([^/?]+)/);
        if (placeMatch && placeMatch[1]) {
          return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeMatch[1])}`;
        }
      } else if (mapUrl.includes('?q=')) {
        const query = mapUrl.split('?q=')[1]?.split('&')[0];
        if (query) {
          return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
        }
      }
    }
    
    return mapUrl;
  }

  ngOnInit() {
    this.loadBuildings();
  }

  loadBuildings() {
    this.isLoading = true;
    this.errorMessage = '';

    this.buildingService.getAllBuildings(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.buildings = response.data.buildings;
          this.total = response.data.pagination.total;
          this.totalPages = response.data.pagination.totalPages;
          this.currentPage = response.data.pagination.page;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة المباني';
      }
    });
  }

  openAddModal() {
    this.formData = {
      name: '',
      address: '',
      mapUrl: '',
      floors: ''
    };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  openEditModal(building: Building) {
    this.selectedBuilding = building;
    this.formData = {
      name: building.name,
      address: building.address || '',
      mapUrl: building.mapUrl || '',
      floors: building.floors?.toString() || ''
    };
    
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedBuilding = null;
  }

  openDeleteModal(building: Building) {
    this.selectedBuilding = building;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedBuilding = null;
  }

  addBuilding() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم المبنى';
      return;
    }

    this.isLoading = true;
    const buildingData: any = {
      name: this.formData.name,
      address: this.formData.address || undefined,
      mapUrl: this.formData.mapUrl || undefined,
      floors: this.formData.floors ? parseInt(this.formData.floors) : undefined
    };

    this.buildingService.createBuilding(buildingData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeAddModal();
          this.loadBuildings();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل إضافة المبنى';
      }
    });
  }

  updateBuilding() {
    if (!this.selectedBuilding || !this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم المبنى';
      return;
    }

    this.isLoading = true;
    const buildingData: any = {
      name: this.formData.name,
      address: this.formData.address || undefined,
      mapUrl: this.formData.mapUrl || undefined,
      floors: this.formData.floors ? parseInt(this.formData.floors) : undefined
    };

    this.buildingService.updateBuilding(this.selectedBuilding.id, buildingData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeEditModal();
          this.loadBuildings();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحديث المبنى';
      }
    });
  }

  deleteBuilding() {
    if (!this.selectedBuilding) return;

    this.isLoading = true;
    this.buildingService.deleteBuilding(this.selectedBuilding.id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeDeleteModal();
          this.loadBuildings();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل حذف المبنى';
      }
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBuildings();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadBuildings();
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

