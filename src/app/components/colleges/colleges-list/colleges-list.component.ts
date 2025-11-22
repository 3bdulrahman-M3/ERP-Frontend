import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CollegeService, College } from '../../../services/college.service';
import { LayoutComponent } from '../../shared/layout/layout.component';

@Component({
  selector: 'app-colleges-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './colleges-list.component.html',
  styleUrl: './colleges-list.component.css'
})
export class CollegesListComponent implements OnInit {
  colleges: College[] = [];
  isLoading = false;
  errorMessage = '';
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedCollege: College | null = null;
  
  formData = {
    name: '',
    description: ''
  };

  constructor(
    private collegeService: CollegeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadColleges();
  }

  loadColleges() {
    this.isLoading = true;
    this.errorMessage = '';

    this.collegeService.getAllColleges().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.colleges = response.data;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحميل قائمة الكليات';
      }
    });
  }

  openAddModal() {
    this.formData = { name: '', description: '' };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.formData = { name: '', description: '' };
  }

  openEditModal(college: College) {
    this.selectedCollege = college;
    this.formData = {
      name: college.name,
      description: college.description || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedCollege = null;
    this.formData = { name: '', description: '' };
  }

  openDeleteModal(college: College) {
    this.selectedCollege = college;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedCollege = null;
  }

  addCollege() {
    if (!this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الكلية';
      return;
    }

    this.isLoading = true;
    this.collegeService.createCollege(this.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeAddModal();
          this.loadColleges();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل إضافة الكلية';
      }
    });
  }

  updateCollege() {
    if (!this.selectedCollege || !this.formData.name.trim()) {
      this.errorMessage = 'الرجاء إدخال اسم الكلية';
      return;
    }

    this.isLoading = true;
    this.collegeService.updateCollege(this.selectedCollege.id, this.formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeEditModal();
          this.loadColleges();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل تحديث الكلية';
      }
    });
  }

  deleteCollege() {
    if (!this.selectedCollege) return;

    this.isLoading = true;
    this.collegeService.deleteCollege(this.selectedCollege.id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.closeDeleteModal();
          this.loadColleges();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'فشل حذف الكلية';
      }
    });
  }
}

