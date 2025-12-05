import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'complete-profile',
    loadComponent: () => import('./components/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
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
    path: 'dashboard/available-rooms',
    loadComponent: () => import('./components/rooms/available-rooms/available-rooms.component').then(m => m.AvailableRoomsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
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
    path: 'dashboard/kitchen',
    loadComponent: () => import('./components/kitchen/kitchen.component').then(m => m.KitchenComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  {
    path: 'dashboard/student-check-in-out',
    loadComponent: () => import('./components/student-check-in-out/student-check-in-out.component').then(m => m.StudentCheckInOutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  {
    path: 'dashboard/check-in-out',
    loadComponent: () => import('./components/check-in-out/check-in-out.component').then(m => m.CheckInOutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/reports/check-in-out',
    loadComponent: () => import('./components/reports/check-in-out-report/check-in-out-report.component').then(m => m.CheckInOutReportComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/reports/financial',
    loadComponent: () => import('./components/reports/financial-report/financial-report.component').then(m => m.FinancialReportComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/registration-requests',
    loadComponent: () => import('./components/registration-requests/registration-requests.component').then(m => m.RegistrationRequestsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/services',
    loadComponent: () => import('./components/services/services-list/services-list.component').then(m => m.ServicesListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/buildings',
    loadComponent: () => import('./components/buildings/buildings-list/buildings-list.component').then(m => m.BuildingsListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'dashboard/chat',
    loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard/preferences',
    loadComponent: () => import('./components/preferences/preferences.component').then(m => m.PreferencesComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  {
    path: 'dashboard/my-room',
    loadComponent: () => import('./components/students/my-room/my-room.component').then(m => m.MyRoomComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  {
    path: 'dashboard/my-review',
    loadComponent: () => import('./components/reviews/student-review/student-review.component').then(m => m.StudentReviewComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  {
    path: 'dashboard/reviews',
    loadComponent: () => import('./components/reviews/admin-reviews/admin-reviews.component').then(m => m.AdminReviewsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  }
];

