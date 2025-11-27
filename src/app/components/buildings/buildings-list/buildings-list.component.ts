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
    latitude: '',
    longitude: '',
    floors: ''
  };

  // Google Maps
  map: google.maps.Map | null = null;
  marker: google.maps.Marker | null = null;
  mapInitialized = false;

  constructor(
    private buildingService: BuildingService,
    private sanitizer: DomSanitizer
  ) {}

  getMapUrl(): SafeResourceUrl | null {
    if (this.formData.latitude && this.formData.longitude) {
      const lat = parseFloat(this.formData.latitude);
      const lng = parseFloat(this.formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const url = `https://www.google.com/maps?q=${lat},${lng}&output=embed`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    }
    return null;
  }

  ngOnInit() {
    this.loadBuildings();
  }

  openGoogleMaps() {
    if (this.formData.latitude && this.formData.longitude) {
      const lat = this.formData.latitude;
      const lng = this.formData.longitude;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
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
      latitude: '',
      longitude: '',
      floors: ''
    };
    this.showAddModal = true;
    setTimeout(() => {
      this.initMap('map-add');
    }, 100);
  }

  closeAddModal() {
    this.showAddModal = false;
    this.map = null;
    this.marker = null;
  }

  openEditModal(building: Building) {
    this.selectedBuilding = building;
    this.formData = {
      name: building.name,
      address: building.address || '',
      latitude: building.latitude?.toString() || '',
      longitude: building.longitude?.toString() || '',
      floors: building.floors?.toString() || ''
    };
    
    this.showEditModal = true;
    setTimeout(() => {
      this.initMap('map-edit');
      if (building.latitude && building.longitude) {
        const lat = parseFloat(building.latitude.toString());
        const lng = parseFloat(building.longitude.toString());
        if (!isNaN(lat) && !isNaN(lng)) {
          this.setMapLocation(lat, lng);
        }
      }
    }, 100);
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedBuilding = null;
    this.map = null;
    this.marker = null;
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
      floors: this.formData.floors ? parseInt(this.formData.floors) : undefined
    };

    if (this.formData.latitude && this.formData.longitude) {
      buildingData.latitude = parseFloat(this.formData.latitude);
      buildingData.longitude = parseFloat(this.formData.longitude);
    }

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
      floors: this.formData.floors ? parseInt(this.formData.floors) : undefined
    };

    if (this.formData.latitude && this.formData.longitude) {
      buildingData.latitude = parseFloat(this.formData.latitude);
      buildingData.longitude = parseFloat(this.formData.longitude);
    }

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

  initMap(mapId: string) {
    if (typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps API not loaded. Please add your API key in index.html');
      return;
    }

    const mapElement = document.getElementById(mapId);
    if (!mapElement) return;

    // Default location (Cairo, Egypt)
    const defaultLocation = { lat: 30.0444, lng: 31.2357 };
    
    // If coordinates exist, use them
    let initialLocation = defaultLocation;
    if (this.formData.latitude && this.formData.longitude) {
      const lat = parseFloat(this.formData.latitude);
      const lng = parseFloat(this.formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        initialLocation = { lat, lng };
      }
    }

    this.map = new google.maps.Map(mapElement, {
      center: initialLocation,
      zoom: initialLocation !== defaultLocation ? 15 : 10,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });

    // Add marker if location exists
    if (initialLocation !== defaultLocation) {
      this.marker = new google.maps.Marker({
        position: initialLocation,
        map: this.map,
        draggable: true
      });

      // Update coordinates when marker is dragged
      this.marker.addListener('dragend', () => {
        if (this.marker) {
          const position = this.marker.getPosition();
          if (position) {
            this.formData.latitude = position.lat().toString();
            this.formData.longitude = position.lng().toString();
          }
        }
      });
    }

    // Add click listener to map
    this.map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        
        // Update form data
        this.formData.latitude = lat.toString();
        this.formData.longitude = lng.toString();

        // Update or create marker
        if (this.marker) {
          this.marker.setPosition({ lat, lng });
        } else {
          this.marker = new google.maps.Marker({
            position: { lat, lng },
            map: this.map,
            draggable: true
          });

          // Update coordinates when marker is dragged
          this.marker.addListener('dragend', () => {
            if (this.marker) {
              const position = this.marker.getPosition();
              if (position) {
                this.formData.latitude = position.lat().toString();
                this.formData.longitude = position.lng().toString();
              }
            }
          });
        }

        // Get address using reverse geocoding
        this.getAddressFromCoordinates(lat, lng);
      }
    });

    // Add search box
    this.addSearchBox(mapId);
  }

  setMapLocation(lat: number, lng: number) {
    if (this.map) {
      const location = { lat, lng };
      this.map.setCenter(location);
      this.map.setZoom(15);

      if (this.marker) {
        this.marker.setPosition(location);
      } else {
        this.marker = new google.maps.Marker({
          position: location,
          map: this.map,
          draggable: true
        });

        this.marker.addListener('dragend', () => {
          if (this.marker) {
            const position = this.marker.getPosition();
            if (position) {
              this.formData.latitude = position.lat().toString();
              this.formData.longitude = position.lng().toString();
            }
          }
        });
      }
    }
  }

  addSearchBox(mapId: string) {
    if (typeof google === 'undefined' || !google.maps || !this.map) return;

    const input = document.getElementById(`search-${mapId}`) as HTMLInputElement;
    if (!input) return;

    const searchBox = new google.maps.places.SearchBox(input);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          this.formData.latitude = lat.toString();
          this.formData.longitude = lng.toString();
          this.formData.address = place.formatted_address || '';

          this.setMapLocation(lat, lng);
        }
      }
    });
  }

  getAddressFromCoordinates(lat: number, lng: number) {
    if (typeof google === 'undefined' || !google.maps) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        this.formData.address = results[0].formatted_address || '';
      }
    });
  }

  onCoordinatesChange() {
    if (this.formData.latitude && this.formData.longitude) {
      const lat = parseFloat(this.formData.latitude);
      const lng = parseFloat(this.formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.setMapLocation(lat, lng);
      }
    }
  }
}

