import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const accessToken = authService.getAccessToken();
  if (accessToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          return authService.refreshToken().pipe(
            switchMap((response: any) => {
              isRefreshing = false;
              if (response.success) {
                const newReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.data.accessToken}`
                  }
                });
                return next(newReq);
              }
              return throwError(() => new Error('Token refresh failed'));
            }),
            catchError((err) => {
              isRefreshing = false;
              authService.logout().subscribe();
              router.navigate(['/login']);
              return throwError(() => err);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};

