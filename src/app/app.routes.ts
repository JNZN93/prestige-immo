import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { ownerGuard } from './guards/owner.guard';
import { AdminEmployeeFormComponent } from './pages/admin/admin-employee-form/admin-employee-form.component';
import { AdminEmployeeListComponent } from './pages/admin/admin-employee-list/admin-employee-list.component';
import { AdminInquiryListComponent } from './pages/admin/admin-inquiry-list/admin-inquiry-list.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';
import { AdminLoginComponent } from './pages/admin/admin-login/admin-login.component';
import { AdminPropertyFormComponent } from './pages/admin/admin-property-form/admin-property-form.component';
import { AdminPropertyListComponent } from './pages/admin/admin-property-list/admin-property-list.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin/login',
    component: AdminLoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'properties', pathMatch: 'full' },
      { path: 'properties', component: AdminPropertyListComponent },
      { path: 'inquiries', component: AdminInquiryListComponent },
      { path: 'properties/new', component: AdminPropertyFormComponent },
      { path: 'properties/:id/edit', component: AdminPropertyFormComponent },
      {
        path: 'employees',
        component: AdminEmployeeListComponent,
        canActivate: [ownerGuard],
      },
      {
        path: 'employees/new',
        component: AdminEmployeeFormComponent,
        canActivate: [ownerGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
