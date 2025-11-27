import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../shared/layout/layout.component';
import { PreferenceService, Preference } from '../../services/preference.service';
import { ServiceService, Service } from '../../services/service.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css'
})
export class PreferencesComponent implements OnInit {
  preferences: Preference = {
    userId: 0,
    roomType: null,
    preferredServices: []
  };
  services: Service[] = [];
  isLoading = false;
  isSaving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private preferenceService: PreferenceService,
    private serviceService: ServiceService
  ) {}

  ngOnInit(): void {
    this.loadPreferences();
    this.loadServices();
  }

  loadPreferences(): void {
    this.isLoading = true;
    this.preferenceService.getPreferences().subscribe({
      next: (response) => {
        if (response.success) {
          this.preferences = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'فشل تحميل التفضيلات';
        this.isLoading = false;
      }
    });
  }

  loadServices(): void {
    this.serviceService.getAllServices(1, 100).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // الخدمات تأتي من قاعدة البيانات
          this.services = response.data.services || [];
          console.log('Loaded services from database:', this.services);
        }
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.errorMessage = 'فشل تحميل الخدمات من قاعدة البيانات';
      }
    });
  }

  onRoomTypeChange(roomType: 'single' | 'shared'): void {
    this.preferences.roomType = roomType;
  }

  onServiceToggle(serviceId: number): void {
    const index = this.preferences.preferredServices.indexOf(serviceId);
    if (index > -1) {
      this.preferences.preferredServices.splice(index, 1);
    } else {
      this.preferences.preferredServices.push(serviceId);
    }
  }

  isServiceSelected(serviceId: number): boolean {
    return this.preferences.preferredServices.includes(serviceId);
  }

  onSubmit(): void {
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    this.preferenceService.updatePreferences(this.preferences).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'تم حفظ التفضيلات بنجاح';
          this.preferences = response.data;
        }
        this.isSaving = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'فشل حفظ التفضيلات';
        this.isSaving = false;
      }
    });
  }
}

