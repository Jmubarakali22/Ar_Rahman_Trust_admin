import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DonationsComponent } from './pages/donations/donations.component';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { CausesComponent } from './pages/causes/causes.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { VolunteersComponent } from './pages/volunteers/volunteers.component';
import { StudentsComponent } from './pages/students/students.component';
import { InquiriesComponent } from './pages/inquiries/inquiries.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AdminsComponent } from './pages/admins/admins.component';
import { RolesComponent } from './pages/roles/roles.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, data: { page: 'dashboard' } },
      { path: 'donations', component: DonationsComponent, data: { page: 'donations' } },
      { path: 'expenses', component: ExpensesComponent, data: { page: 'expenses' } },
      { path: 'causes', component: CausesComponent, data: { page: 'causes' } },
      { path: 'gallery', component: GalleryComponent, data: { page: 'gallery' } },
      { path: 'volunteers', component: VolunteersComponent, data: { page: 'volunteers' } },
      { path: 'students', component: StudentsComponent, data: { page: 'students' } },
      { path: 'inquiries', component: InquiriesComponent, data: { page: 'inquiries' } },
      { path: 'settings', component: SettingsComponent, data: { page: 'settings' } },
      { path: 'admins', component: AdminsComponent, data: { page: 'admins' } },
      { path: 'roles', component: RolesComponent, data: { page: 'roles' } }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
