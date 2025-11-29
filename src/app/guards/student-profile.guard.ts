import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const studentProfileGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const studentService = inject(StudentService);
  const router = inject(Router);

  const user = authService.getCurrentUser();

  // If not authenticated or not a student, allow access (other guards will handle)
  if (!authService.isAuthenticated() || user?.role !== 'student') {
    return true;
  }

  // Check if student profile exists
  // We'll check by trying to get the student's room or by checking if student exists
  // For now, we'll use a simple approach: if user is student, check if they have a student record
  // This is a simplified check - in production you might want to add an endpoint to check this
  
  // For dashboard routes, we'll check in the component itself
  return true;
};

