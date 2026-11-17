import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Admin, Role, AvailablePage } from '../../core/models/models';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admins-page">
      <!-- Header -->
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold" style="font-size: 11px;">
              <i class="bi bi-people-fill me-1"></i> USER MANAGEMENT
            </span>
          </div>
          <h2 class="h4 fw-bold mb-1" style="color: #0F3D63;">Admin Accounts & Access Control</h2>
          <p class="text-muted small mb-0">Create staff logins, assign dynamic roles, and manage module permissions.</p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5" 
            (click)="refreshAll()"
            [disabled]="isLoading()"
            title="Reload users"
          >
            <i class="bi bi-arrow-clockwise" [class.spin-icon]="isLoading()"></i>
            <span>Refresh</span>
          </button>

          <button 
            type="button" 
            class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold" 
            (click)="openAddModal()"
          >
            <i class="bi bi-plus-circle-fill"></i>
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <!-- Success & Error Alerts -->
      @if (successMessage()) {
        <div class="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 mb-3 shadow-sm" role="alert">
          <i class="bi bi-check-circle-fill fs-5"></i>
          <span class="small fw-semibold">{{ successMessage() }}</span>
          <button type="button" class="btn-close btn-sm p-2" (click)="successMessage.set(null)"></button>
        </div>
      }
      @if (errorMessage()) {
        <div class="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 py-2 px-3 mb-3 shadow-sm" role="alert">
          <i class="bi bi-exclamation-triangle-fill fs-5"></i>
          <span class="small fw-semibold">{{ errorMessage() }}</span>
          <button type="button" class="btn-close btn-sm p-2" (click)="errorMessage.set(null)"></button>
        </div>
      }

      <!-- Quick Role Metric Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="admin-card p-3 d-flex align-items-center gap-3">
            <div class="rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; background: #e0f2fe; color: #0369a1;">
              <i class="bi bi-people-fill fs-5"></i>
            </div>
            <div>
              <div class="text-muted small fw-semibold">Total Accounts</div>
              <div class="fs-4 fw-bold text-dark">{{ admins().length }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="admin-card p-3 d-flex align-items-center gap-3">
            <div class="rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; background: #fee2e2; color: #b91c1c;">
              <i class="bi bi-shield-lock-fill fs-5"></i>
            </div>
            <div>
              <div class="text-muted small fw-semibold">Super Admins</div>
              <div class="fs-4 fw-bold text-danger">{{ superAdminCount() }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="admin-card p-3 d-flex align-items-center gap-3">
            <div class="rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; background: #e0e7ff; color: #4338ca;">
              <i class="bi bi-person-badge-fill fs-5"></i>
            </div>
            <div>
              <div class="text-muted small fw-semibold">Managing Trustees</div>
              <div class="fs-4 fw-bold" style="color: #4338ca;">{{ trusteeCount() }}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="admin-card p-3 d-flex align-items-center gap-3">
            <div class="rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px; background: #fef3c7; color: #b45309;">
              <i class="bi bi-shield-check fs-5"></i>
            </div>
            <div>
              <div class="text-muted small fw-semibold">Configured Roles</div>
              <div class="fs-4 fw-bold text-warning">{{ roles().length }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Admins Table Card -->
      <div class="admin-card mb-4 shadow-sm">
        <div class="card-header-clean d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
          <h5 class="card-title-clean mb-0 fs-6 fw-bold text-dark">
            <i class="bi bi-shield-shaded me-2" style="color: #0F3D63;"></i> Registered Administrative Users
          </h5>
          <span class="badge bg-light text-muted border px-2 py-1">
            {{ admins().length }} User{{ admins().length === 1 ? '' : 's' }}
          </span>
        </div>

        <div class="table-responsive admin-table-scroll">
          <table class="table admin-table mb-0 align-middle" style="min-width: 780px;">
            <thead class="sticky-top bg-light" style="top: 0; z-index: 5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <tr>
                <th style="min-width: 170px;">Staff Member</th>
                <th style="min-width: 120px;">Username</th>
                <th style="min-width: 170px;">Email Address</th>
                <th style="min-width: 160px;">Assigned Role</th>
                <th style="min-width: 140px;">Module Access</th>
                <th style="min-width: 110px;">Joined</th>
                <th class="text-end" style="min-width: 110px; white-space: nowrap;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                <tr>
                  <td colspan="7" class="text-center py-5">
                    <div class="spinner-border text-primary" role="status"></div>
                    <div class="text-muted small mt-2">Loading user accounts & roles...</div>
                  </td>
                </tr>
              } @else {
                @for (a of admins(); track a.id) {
                  <tr>
                    <td>
                      <div class="fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                        {{ a.name }}
                        @if (a.id === authService.currentUser()?.id) {
                          <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-1" style="font-size: 10px;">You</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="font-monospace small px-2 py-1 bg-light rounded border text-secondary">
                        {{ a.username }}
                      </span>
                    </td>
                    <td>
                      <div class="small text-truncate" style="max-width: 190px;" [title]="a.email">
                        <i class="bi bi-envelope text-muted me-1"></i>{{ a.email }}
                      </div>
                    </td>
                    <td>
                      <span class="badge rounded-pill px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
                            [ngClass]="getRoleBadgeClass(a.role)">
                        <i class="bi" [ngClass]="getRoleIcon(a.role)"></i>
                        {{ formatRoleName(a.role) }}
                      </span>
                    </td>
                    <td>
                      @if (isSuperAdminRole(a.role)) {
                        <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                          <i class="bi bi-asterisk me-1"></i> All Modules
                        </span>
                      } @else if (a.permissions && a.permissions.length > 0) {
                        <span class="badge bg-light text-dark border px-2 py-1" [title]="a.permissions.join(', ')">
                          <i class="bi bi-check2-circle text-success me-1"></i> {{ a.permissions.length }} Pages
                        </span>
                      } @else {
                        <span class="badge bg-light text-muted border px-2 py-1">
                          <i class="bi bi-shield-check text-primary me-1"></i> Role Default
                        </span>
                      }
                    </td>
                    <td class="small text-muted">{{ a.created_at | date:'mediumDate' }}</td>
                    <td class="text-end" style="min-width: 110px; white-space: nowrap;">
                      <div class="d-inline-flex gap-1">
                        <!-- Edit User & Access Modal Button -->
                        <button class="btn btn-sm btn-outline-primary" 
                                (click)="openAssignRoleModal(a)" 
                                title="Edit User Details & Access">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        @if (a.id !== authService.currentUser()?.id) {
                          <button class="btn btn-sm btn-outline-danger" 
                                  (click)="deleteAdmin(a.id, a.name)" 
                                  title="Delete User Account">
                            <i class="bi bi-trash"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                      <i class="bi bi-person-x fs-1 d-block mb-2 text-secondary"></i>
                      No admin accounts found.
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 1. CREATE NEW USER & ASSIGN ROLE MODAL     -->
    <!-- ========================================== -->
    @if (showAddModal()) {
      <div class="modal fade show d-block" style="background: rgba(10, 39, 64, 0.65); z-index: 1060; backdrop-filter: blur(3px);" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="modal-header border-0 px-4 py-3 text-white" style="background: linear-gradient(135deg, #0a2740 0%, #0F3D63 100%);">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 36px; height: 36px; background: rgba(255,255,255,0.15);">
                  <i class="bi bi-person-plus-fill"></i>
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0 fs-6">Create New User & Assign Role</h5>
                  <div class="small text-white-50" style="font-size: 11.5px;">Add administrative staff and grant tailored access permissions</div>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" (click)="showAddModal.set(false)"></button>
            </div>

            <form (ngSubmit)="saveNewAdmin()" autocomplete="off">
              <!-- Dummy hidden inputs to absorb browser autofill -->
              <input type="text" style="display:none" aria-hidden="true" tabindex="-1">
              <input type="password" style="display:none" aria-hidden="true" tabindex="-1">

              <div class="modal-body p-4 bg-light">
                <!-- User Basic Details -->
                <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                  <div class="fw-bold small text-dark mb-2 text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                    <i class="bi bi-person-badge text-primary me-1"></i> Account Credentials
                  </div>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Full Name *</label>
                      <input type="text" class="form-control" [(ngModel)]="formData.name" name="new_admin_name" 
                             placeholder="e.g. Fuzail Ahmed" autocomplete="off" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Username *</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                        <input type="text" class="form-control" [(ngModel)]="formData.username" name="new_admin_username" 
                               placeholder="e.g. fuzail_ahmed" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" required>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Email Address *</label>
                      <input type="email" class="form-control" [(ngModel)]="formData.email" name="new_admin_email" 
                             placeholder="staff@arrahmantrust.org" autocomplete="off" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Initial Password *</label>
                      <div class="input-group">
                        <input [type]="showPassword() ? 'text' : 'password'" class="form-control" 
                               [(ngModel)]="formData.password" name="new_admin_password" 
                               placeholder="Enter temporary password" autocomplete="new-password" required minlength="6">
                        <button type="button" class="btn btn-outline-secondary" (click)="showPassword.set(!showPassword())">
                          <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Role Assignment Section -->
                <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="fw-bold small text-dark text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                      <i class="bi bi-shield-lock-fill text-danger me-1"></i> Assign Role & Security Profile *
                    </div>
                    <span class="badge bg-light text-muted border" style="font-size: 11px;">
                      {{ roles().length }} Roles Available
                    </span>
                  </div>

                  <!-- Role Selector Dropdown -->
                  <div class="mb-3">
                    <label class="form-label small fw-semibold text-muted mb-1">Choose Designated Role</label>
                    <select class="form-select form-select-lg fs-6 fw-semibold" 
                            [(ngModel)]="formData.role" 
                            name="role" 
                            (ngModelChange)="onRoleSelected($event)" 
                            required>
                      @for (r of roles(); track r.id) {
                        <option [value]="r.name">
                          {{ r.name }} {{ r.is_system ? '(System Standard)' : '(Custom Role)' }}
                        </option>
                      }
                    </select>
                  </div>

                  <!-- Selected Role Details Card -->
                  @if (getSelectedRole()) {
                    <div class="p-3 rounded-3 border bg-light-subtle">
                      <div class="d-flex align-items-start justify-content-between gap-2">
                        <div>
                          <div class="fw-bold text-dark d-flex align-items-center gap-2">
                            <span class="badge rounded-pill px-2.5 py-1" [ngClass]="getRoleBadgeClass(getSelectedRole()!.name)">
                              <i class="bi" [ngClass]="getRoleIcon(getSelectedRole()!.name)"></i>
                              {{ getSelectedRole()!.name }}
                            </span>
                            @if (getSelectedRole()!.is_system) {
                              <span class="badge bg-secondary-subtle text-secondary border px-2 py-0.5" style="font-size: 10px;">Default System Role</span>
                            }
                          </div>
                          <p class="text-muted small mt-1 mb-2">
                            {{ getSelectedRole()!.description || 'Grants designated module and operational permissions.' }}
                          </p>
                        </div>
                      </div>

                      <!-- Role Default Modules Display -->
                      <div class="mt-2 pt-2 border-top">
                        <div class="small fw-semibold text-secondary mb-1.5" style="font-size: 11px;">
                          PAGES ACCESSIBLE UNDER THIS ROLE:
                        </div>
                        <div class="d-flex flex-wrap gap-1.5">
                          @if (getSelectedRole()!.permissions.includes('*')) {
                            <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                              <i class="bi bi-asterisk me-1"></i> Full Unrestricted Access to All Pages & Settings
                            </span>
                          } @else {
                            @for (pageKey of getSelectedRole()!.permissions; track pageKey) {
                              <span class="badge bg-white text-dark border px-2 py-1 shadow-xs d-inline-flex align-items-center gap-1">
                                <i class="bi" [ngClass]="getPageIcon(pageKey)"></i>
                                {{ getPageName(pageKey) }}
                              </span>
                            }
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Granular Permissions Customization Option -->
                <div class="bg-white p-3 rounded-3 border shadow-sm">
                  <div class="d-flex align-items-center justify-content-between">
                    <div>
                      <div class="fw-bold small text-dark">
                        <i class="bi bi-sliders text-primary me-1"></i> Tailor Custom Permissions (Optional)
                      </div>
                      <div class="text-muted small" style="font-size: 11.5px;">
                        Override or customize specific page access rights for this user
                      </div>
                    </div>
                    <div class="form-check form-switch mb-0">
                      <input class="form-check-input cursor-pointer" type="checkbox" id="customizeToggle" 
                             [(ngModel)]="formData.customizePermissions" name="customizePermissions">
                    </div>
                  </div>

                  @if (formData.customizePermissions) {
                    <div class="mt-3 pt-3 border-top">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="small fw-semibold text-muted">SELECT ACCESSIBLE MODULES:</span>
                        <div class="d-flex gap-2">
                          <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small" (click)="selectAllPermissions()">Select All</button>
                          <span class="text-muted small">&bull;</span>
                          <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small text-secondary" (click)="clearAllPermissions()">Clear</button>
                        </div>
                      </div>

                      <div class="row g-2">
                        @for (page of availablePages(); track page.key) {
                          <div class="col-md-6 col-lg-4">
                            <label class="d-flex align-items-start gap-2 p-2 rounded-2 border cursor-pointer hover-bg-light transition"
                                   [class.border-primary]="hasPagePermission(page.key)"
                                   [class.bg-primary-subtle]="hasPagePermission(page.key)">
                              <input type="checkbox" class="form-check-input mt-0.5" 
                                     [checked]="hasPagePermission(page.key)"
                                     (change)="togglePagePermission(page.key)">
                              <div class="small">
                                <div class="fw-bold text-dark d-flex align-items-center gap-1">
                                  <i class="bi" [ngClass]="getPageIcon(page.key)"></i>
                                  {{ page.name }}
                                </div>
                                <div class="text-muted" style="font-size: 10px; line-height: 1.2;">{{ page.description }}</div>
                              </div>
                            </label>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-light px-3" (click)="showAddModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-trust-primary px-4 fw-semibold" [disabled]="isSubmitting()">
                  @if (isSubmitting()) {
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span> Creating...
                  } @else {
                    <i class="bi bi-shield-check me-1"></i> Create Admin Account
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

        <!-- ========================================== -->
    <!-- 2. EDIT USER ACCOUNT MODAL (FULL DETAILS)  -->
    <!-- ========================================== -->
    @if (showAssignModal() && selectedAdmin()) {
      <div class="modal fade show d-block" style="background: rgba(10, 39, 64, 0.65); z-index: 1060; backdrop-filter: blur(3px);" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="modal-header border-0 px-4 py-3 text-white" style="background: linear-gradient(135deg, #0a2740 0%, #0F3D63 100%);">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 36px; height: 36px; background: rgba(255,255,255,0.15);">
                  <i class="bi bi-pencil-square"></i>
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0 fs-6">Edit User Account & Access</h5>
                  <div class="small text-white-50" style="font-size: 11.5px;">Update account credentials, security role, and permissions for {{ selectedAdmin()!.name }}</div>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" (click)="showAssignModal.set(false)"></button>
            </div>

            <form (ngSubmit)="saveUserRoleAssignment()" autocomplete="off">
              <!-- Dummy hidden inputs to absorb browser autofill -->
              <input type="text" style="display:none" aria-hidden="true" tabindex="-1">
              <input type="password" style="display:none" aria-hidden="true" tabindex="-1">

              <div class="modal-body p-4 bg-light">
                <!-- User Basic Details -->
                <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                  <div class="fw-bold small text-dark mb-2 text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                    <i class="bi bi-person-badge text-primary me-1"></i> Account Credentials
                  </div>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Full Name *</label>
                      <input type="text" class="form-control" [(ngModel)]="editForm.name" name="edit_admin_name" 
                             placeholder="e.g. Fuzail Ahmed" autocomplete="off" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Username *</label>
                      <div class="input-group">
                        <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                        <input type="text" class="form-control" [(ngModel)]="editForm.username" name="edit_admin_username" 
                               placeholder="e.g. fuzail_ahmed" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" required>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">Email Address *</label>
                      <input type="email" class="form-control" [(ngModel)]="editForm.email" name="edit_admin_email" 
                             placeholder="staff@arrahmantrust.org" autocomplete="off" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold text-secondary mb-1">New Password (Optional)</label>
                      <div class="input-group">
                        <input [type]="showEditPassword() ? 'text' : 'password'" class="form-control" 
                               [(ngModel)]="editForm.password" name="edit_admin_password" 
                               placeholder="Leave blank to keep unchanged" autocomplete="new-password" minlength="6">
                        <button type="button" class="btn btn-outline-secondary" (click)="showEditPassword.set(!showEditPassword())">
                          <i class="bi" [class.bi-eye]="!showEditPassword()" [class.bi-eye-slash]="showEditPassword()"></i>
                        </button>
                      </div>
                      <div class="small text-muted mt-1" style="font-size: 11px;">
                        Only enter a password if you want to reset it (min 6 characters).
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Role Assignment Section -->
                <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                  <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="fw-bold small text-dark text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                      <i class="bi bi-shield-lock-fill text-danger me-1"></i> Designated Role & Security Profile *
                    </div>
                    <span class="badge bg-light text-muted border" style="font-size: 11px;">
                      {{ roles().length }} Roles Available
                    </span>
                  </div>

                  <div class="mb-2">
                    <label class="form-label small fw-semibold text-muted mb-1">Choose Designated Role</label>
                    <select class="form-select form-select-lg fs-6 fw-semibold" 
                            [(ngModel)]="editForm.role" 
                            name="edit_role" 
                            (ngModelChange)="onEditRoleSelected($event)" 
                            required>
                      @for (r of roles(); track r.id) {
                        <option [value]="r.name">{{ r.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Granular Permissions Customization Option -->
                <div class="bg-white p-3 rounded-3 border shadow-sm">
                  <div class="d-flex align-items-center justify-content-between">
                    <div>
                      <div class="fw-bold small text-dark">
                        <i class="bi bi-sliders text-primary me-1"></i> Tailor Custom Permissions (Optional)
                      </div>
                      <div class="text-muted small" style="font-size: 11.5px;">
                        Override or customize specific page access rights for this user
                      </div>
                    </div>
                    <div class="form-check form-switch mb-0">
                      <input class="form-check-input cursor-pointer" type="checkbox" id="editCustomizeToggle" 
                             [(ngModel)]="editForm.customizePermissions" name="editCustomizePermissions">
                    </div>
                  </div>

                  @if (editForm.customizePermissions) {
                    <div class="mt-3 pt-3 border-top">
                      <div class="d-flex align-items-center justify-content-between mb-2">
                        <span class="small fw-semibold text-muted">SELECT ACCESSIBLE MODULES:</span>
                        <div class="d-flex gap-2">
                          <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small" (click)="selectAllEditPermissions()">Select All</button>
                          <span class="text-muted small">&bull;</span>
                          <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none small text-secondary" (click)="clearAllEditPermissions()">Clear</button>
                        </div>
                      </div>

                      <div class="row g-2">
                        @for (page of availablePages(); track page.key) {
                          <div class="col-md-6 col-lg-4">
                            <label class="d-flex align-items-start gap-2 p-2 rounded-2 border cursor-pointer hover-bg-light transition"
                                   [class.border-primary]="hasEditPagePermission(page.key)"
                                   [class.bg-primary-subtle]="hasEditPagePermission(page.key)">
                              <input type="checkbox" class="form-check-input mt-0.5" 
                                     [checked]="hasEditPagePermission(page.key)"
                                     (change)="toggleEditPagePermission(page.key)">
                              <div class="small">
                                <div class="fw-bold text-dark d-flex align-items-center gap-1">
                                  <i class="bi" [ngClass]="getPageIcon(page.key)"></i>
                                  {{ page.name }}
                                </div>
                                <div class="text-muted" style="font-size: 10px; line-height: 1.2;">{{ page.description }}</div>
                              </div>
                            </label>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-light px-3" (click)="showAssignModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-trust-primary px-4 fw-semibold" [disabled]="isSubmitting()">
                  @if (isSubmitting()) {
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span> Updating...
                  } @else {
                    <i class="bi bi-check-circle me-1"></i> Save Changes
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .hover-bg-light:hover {
      background-color: #f8fafc;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .transition {
      transition: all 0.2s ease;
    }
    /* Prevent Chrome from forcing light-blue background on autofill */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 30px white inset !important;
      -webkit-text-fill-color: #1e293b !important;
    }
  `]
})
export class AdminsComponent implements OnInit {
  isLoading = signal(true);
  isSubmitting = signal(false);
  admins = signal<Admin[]>([]);
  roles = signal<Role[]>([]);
  availablePages = signal<AvailablePage[]>([]);
  
  showAddModal = signal(false);
  showAssignModal = signal(false);
  selectedAdmin = signal<Admin | null>(null);
  showPassword = signal(false);

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Form for creating a new admin
  formData: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    customizePermissions: boolean;
    permissions: string[];
  } = {
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Managing Trustee',
    customizePermissions: false,
    permissions: []
  };

  // Form for editing existing admin account
  editForm = {
    name: '',
    username: '',
    email: '',
    password: '',
    role: '',
    customizePermissions: false,
    permissions: [] as string[]
  };
  showEditPassword = signal(false);

  // Standard fallback roles if backend API is temporarily offline
  readonly defaultRoles: Role[] = [
    { id: 1, name: 'Super Admin', description: 'Full access to all modules and account settings', permissions: ['*'], is_system: true },
    { id: 2, name: 'Managing Trustee', description: 'Full management access to operations, finances, causes, and public media', permissions: ['dashboard', 'donations', 'expenses', 'causes', 'gallery', 'volunteers', 'inquiries', 'settings'], is_system: false },
    { id: 3, name: 'Finance / Accountant', description: 'Access to financial donation records, receipt vouchers, and revenue stats', permissions: ['dashboard', 'donations', 'expenses'], is_system: false },
    { id: 4, name: 'Welfare Coordinator', description: 'Management of charity causes, ration kits, relief programs, and inquiries', permissions: ['dashboard', 'causes', 'volunteers', 'inquiries'], is_system: false },
    { id: 5, name: 'Media & Communications', description: 'Responsible for public photo gallery, relief events, and inquiry responses', permissions: ['gallery', 'inquiries'], is_system: false }
  ];

  // Standard available system pages
  readonly defaultPages: AvailablePage[] = [
    { key: 'dashboard', name: 'Dashboard', description: 'Overview stats and recent donations' },
    { key: 'donations', name: 'Donations & Receipts', description: 'Voucher tracking and WhatsApp dispatch' },
    { key: 'expenses', name: 'Expenses & Relief Tracking', description: 'Tailoring, ration kits, relief expenditures & vouchers' },
    { key: 'causes', name: 'Causes & Programs', description: 'Charity causes and relief goals' },
    { key: 'gallery', name: 'Photo Gallery', description: 'Event photos and activities' },
    { key: 'volunteers', name: 'Volunteers', description: 'Volunteer registrations and applications' },
    { key: 'inquiries', name: 'Contact Inquiries', description: 'Public messages and support requests' },
    { key: 'settings', name: 'Trust Settings', description: 'Charity identity and auto-logout' },
    { key: 'admins', name: 'Admin Accounts', description: 'Manage staff credentials and user logins' },
    { key: 'roles', name: 'Roles & Access Control', description: 'Configure permissions and RBAC roles' }
  ];

  // Computed counters
  superAdminCount = computed(() => 
    this.admins().filter(a => this.isSuperAdminRole(a.role)).length
  );
  trusteeCount = computed(() => 
    this.admins().filter(a => (a.role || '').toLowerCase().includes('trustee') || (a.role || '').toLowerCase() === 'admin').length
  );

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadRoles();
    this.loadAdmins();
  }

  loadRoles(): void {
    this.authService.getRoles().subscribe({
      next: (res) => {
        if (res.roles && res.roles.length > 0) {
          this.roles.set(res.roles);
        } else {
          this.roles.set(this.defaultRoles);
        }
        if (res.available_pages && res.available_pages.length > 0) {
          this.availablePages.set(res.available_pages);
        } else {
          this.availablePages.set(this.defaultPages);
        }
      },
      error: () => {
        this.roles.set(this.defaultRoles);
        this.availablePages.set(this.defaultPages);
      }
    });
  }

  loadAdmins(): void {
    this.isLoading.set(true);
    this.authService.getAllAdmins().subscribe({
      next: (res) => {
        if (res.success) {
          this.admins.set(res.admins || []);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load admins: ' + (err.error?.message || err.message));
        this.isLoading.set(false);
      }
    });
  }

  openAddModal(): void {
    const defaultRoleName = this.roles().length > 0 
      ? (this.roles().find(r => r.name.toLowerCase() === 'managing trustee')?.name || this.roles()[0].name)
      : 'Managing Trustee';

    const selectedRoleObj = this.roles().find(r => r.name.toLowerCase() === defaultRoleName.toLowerCase());
    const initialPerms = selectedRoleObj ? [...selectedRoleObj.permissions] : ['dashboard', 'donations', 'causes', 'gallery', 'volunteers', 'inquiries', 'settings'];

    this.formData = {
      name: '',
      username: '',
      email: '',
      password: '',
      role: defaultRoleName,
      customizePermissions: false,
      permissions: initialPerms
    };
    this.showPassword.set(false);
    this.showAddModal.set(true);

    // Guard against browser password managers attempting delayed autofill
    setTimeout(() => {
      this.formData.username = '';
      this.formData.password = '';
    }, 50);
  }

  onRoleSelected(newRoleName: string): void {
    const roleObj = this.roles().find(r => r.name.toLowerCase() === (newRoleName || '').toLowerCase());
    if (roleObj) {
      this.formData.permissions = [...roleObj.permissions];
    }
  }

  getSelectedRole(): Role | null {
    return this.roles().find(r => r.name.toLowerCase() === (this.formData.role || '').toLowerCase()) || null;
  }

  hasPagePermission(pageKey: string): boolean {
    return this.formData.permissions.includes('*') || this.formData.permissions.includes(pageKey);
  }

  togglePagePermission(pageKey: string): void {
    // If it had '*', expand to all available pages first
    if (this.formData.permissions.includes('*')) {
      this.formData.permissions = this.availablePages().map(p => p.key);
    }

    const idx = this.formData.permissions.indexOf(pageKey);
    if (idx > -1) {
      this.formData.permissions.splice(idx, 1);
    } else {
      this.formData.permissions.push(pageKey);
    }
  }

  selectAllPermissions(): void {
    this.formData.permissions = this.availablePages().map(p => p.key);
  }

  clearAllPermissions(): void {
    this.formData.permissions = ['dashboard'];
  }

  onEditRoleSelected(newRoleName: string): void {
    const roleObj = this.roles().find(r => r.name.toLowerCase() === (newRoleName || '').toLowerCase());
    if (roleObj) {
      this.editForm.permissions = [...roleObj.permissions];
    }
  }

  hasEditPagePermission(pageKey: string): boolean {
    return this.editForm.permissions.includes('*') || this.editForm.permissions.includes(pageKey);
  }

  toggleEditPagePermission(pageKey: string): void {
    if (this.editForm.permissions.includes('*')) {
      this.editForm.permissions = this.availablePages().map(p => p.key);
    }
    const idx = this.editForm.permissions.indexOf(pageKey);
    if (idx > -1) {
      this.editForm.permissions.splice(idx, 1);
    } else {
      this.editForm.permissions.push(pageKey);
    }
  }

  selectAllEditPermissions(): void {
    this.editForm.permissions = this.availablePages().map(p => p.key);
  }

  clearAllEditPermissions(): void {
    this.editForm.permissions = ['dashboard'];
  }


  saveNewAdmin(): void {
    if (!this.formData.name || !this.formData.username || !this.formData.email || !this.formData.password) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const roleObj = this.roles().find(r => r.name.toLowerCase() === (this.formData.role || '').toLowerCase());
    const effectivePerms = this.formData.customizePermissions 
      ? this.formData.permissions 
      : (roleObj ? roleObj.permissions : ['dashboard']);

    const payload = {
      name: this.formData.name.trim(),
      username: this.formData.username.trim(),
      email: this.formData.email.trim(),
      password: this.formData.password.trim(),
      role: this.formData.role,
      permissions: effectivePerms
    };

    this.authService.createAdmin(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showAddModal.set(false);
        this.successMessage.set(res.message || `Admin account for ${payload.name} created with role ${payload.role}.`);
        this.loadRoles();
        this.loadAdmins();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to create admin. Please check username/email uniqueness.');
      }
    });
  }

  // Open Edit Admin Modal with Full Details
  openAssignRoleModal(admin: Admin): void {
    this.selectedAdmin.set(admin);
    let matchedRoleName = admin.role;
    const match = this.roles().find(r => 
      r.name.toLowerCase() === (admin.role || '').toLowerCase() ||
      ((admin.role || '').toLowerCase() === 'superadmin' && r.name.toLowerCase() === 'super admin') ||
      ((admin.role || '').toLowerCase() === 'admin' && r.name.toLowerCase() === 'managing trustee')
    );
    if (match) {
      matchedRoleName = match.name;
    } else if (this.roles().length > 0) {
      matchedRoleName = this.roles()[0].name;
    }

    const hasCustomPerms = Array.isArray(admin.permissions) && admin.permissions.length > 0 && !admin.permissions.includes('*');

    this.showEditPassword.set(false);
    this.editForm = {
      name: admin.name || '',
      username: admin.username || '',
      email: admin.email || '',
      password: '',
      role: matchedRoleName,
      customizePermissions: hasCustomPerms,
      permissions: Array.isArray(admin.permissions) ? [...admin.permissions] : []
    };
    this.showAssignModal.set(true);
  }

  saveUserRoleAssignment(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;

    if (!this.editForm.name.trim() || !this.editForm.username.trim() || !this.editForm.email.trim() || !this.editForm.role) {
      this.errorMessage.set('Name, username, email, and role are required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const payload: any = {
      name: this.editForm.name.trim(),
      username: this.editForm.username.trim(),
      email: this.editForm.email.trim(),
      role: this.editForm.role.trim()
    };

    if (this.editForm.password && this.editForm.password.trim().length > 0) {
      if (this.editForm.password.trim().length < 6) {
        this.isSubmitting.set(false);
        this.errorMessage.set('New password must be at least 6 characters long.');
        return;
      }
      payload.password = this.editForm.password.trim();
    }

    if (this.editForm.customizePermissions) {
      payload.permissions = this.editForm.permissions;
    } else {
      const roleObj = this.roles().find(r => r.name.toLowerCase() === this.editForm.role.toLowerCase());
      payload.permissions = roleObj ? roleObj.permissions : ['dashboard'];
    }

    this.authService.updateAdmin(admin.id, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.showAssignModal.set(false);
        this.successMessage.set(res.message || 'Admin account for ' + payload.name + ' updated successfully.');
        this.loadRoles();
        this.loadAdmins();
        if (admin.id === this.authService.currentUser()?.id) {
          this.authService.getProfile().subscribe({ error: () => {} });
        }
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to update user account.');
      }
    });
  }

  deleteAdmin(id: number, name?: string): void {
    const displayName = name ? `account for ${name}` : 'this admin account';
    if (confirm(`Are you sure you want to permanently delete the ${displayName}?`)) {
      this.authService.deleteAdmin(id).subscribe({
        next: () => {
          this.successMessage.set(`Account successfully removed.`);
          this.loadAdmins();
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to delete admin.');
        }
      });
    }
  }

  // --- Helpers & Formatters ---
  isSuperAdminRole(role: string): boolean {
    const r = (role || '').toLowerCase().replace(/[\s_-]/g, '');
    return r === 'superadmin';
  }

  formatRoleName(role: string): string {
    if (!role) return 'Staff';
    const r = role.toLowerCase().trim();
    if (r === 'superadmin') return 'Super Admin';
    if (r === 'admin') return 'Managing Trustee';
    return role;
  }

  getRoleBadgeClass(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('super')) return 'bg-danger-subtle text-danger border border-danger-subtle';
    if (r.includes('trustee') || r === 'admin') return 'bg-primary-subtle text-primary border border-primary-subtle';
    if (r.includes('finance') || r.includes('accountant')) return 'bg-success-subtle text-success border border-success-subtle';
    if (r.includes('welfare') || r.includes('coordinator')) return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    if (r.includes('media') || r.includes('communication')) return 'bg-info-subtle text-info-emphasis border border-info-subtle';
    return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
  }

  getRoleIcon(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('super')) return 'bi-shield-lock-fill';
    if (r.includes('trustee') || r === 'admin') return 'bi-person-badge-fill';
    if (r.includes('finance') || r.includes('accountant')) return 'bi-cash-coin';
    if (r.includes('welfare') || r.includes('coordinator')) return 'bi-heart-fill';
    if (r.includes('media') || r.includes('communication')) return 'bi-images';
    return 'bi-person-gear';
  }

  getPageIcon(key: string): string {
    switch (key) {
      case 'dashboard': return 'bi-speedometer2 text-primary';
      case 'donations': return 'bi-cash-coin text-success';
      case 'expenses': return 'bi-wallet2 text-warning';
      case 'causes': return 'bi-heart-pulse-fill text-danger';
      case 'gallery': return 'bi-images text-info';
      case 'volunteers': return 'bi-people-fill text-warning';
      case 'inquiries': return 'bi-envelope-paper-fill text-primary';
      case 'settings': return 'bi-gear-fill text-secondary';
      case 'admins': return 'bi-shield-lock-fill text-danger';
      case 'roles': return 'bi-person-gear text-info';
      default: return 'bi-app text-secondary';
    }
  }

  getPageName(key: string): string {
    const page = this.availablePages().find(p => p.key === key);
    if (page) return page.name;
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#0F3D63', '#0284c7', '#059669', '#d97706', '#dc2626', 
      '#7c3aed', '#db2777', '#4b5563', '#0891b2', '#2563eb'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
