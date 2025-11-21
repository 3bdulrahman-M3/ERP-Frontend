import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];
  const user = authService.getCurrentUser();

  if (authService.isAuthenticated() && user?.role === expectedRole) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

