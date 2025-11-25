import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/students',
    loadComponent: () => import('./components/students/students-list/students-list.component').then(m => m.StudentsListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/students/new',
    loadComponent: () => import('./components/students/student-form/student-form.component').then(m => m.StudentFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/students/:id',
    loadComponent: () => import('./components/students/student-detail/student-detail.component').then(m => m.StudentDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/students/:id/edit',
    loadComponent: () => import('./components/students/student-form/student-form.component').then(m => m.StudentFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/students/by-college',
    loadComponent: () => import('./components/students/students-by-college/students-by-college.component').then(m => m.StudentsByCollegeComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/colleges',
    loadComponent: () => import('./components/colleges/colleges-list/colleges-list.component').then(m => m.CollegesListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/meals',
    loadComponent: () => import('./components/meals/meals-list/meals-list.component').then(m => m.MealsListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/rooms',
    loadComponent: () => import('./components/rooms/rooms-list/rooms-list.component').then(m => m.RoomsListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/rooms/new',
    loadComponent: () => import('./components/rooms/room-form/room-form.component').then(m => m.RoomFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/rooms/:id',
    loadComponent: () => import('./components/rooms/room-detail/room-detail.component').then(m => m.RoomDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/rooms/:id/edit',
    loadComponent: () => import('./components/rooms/room-form/room-form.component').then(m => m.RoomFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  }
];

