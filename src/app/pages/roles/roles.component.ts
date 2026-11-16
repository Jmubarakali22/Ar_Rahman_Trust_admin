import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Role, UserRoleItem, AvailablePage } from '../../core/models/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="roles-container">
      <!-- Page Header -->
      <div class="page-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold" style="font-size: 11px;">
              <i class="bi bi-shield-lock-fill me-1"></i> ACCESS CONTROL
            </span>
          </div>
          <h2 class="page-title mb-1">Roles & Permissions (RBAC)</h2>
          <p class="page-subtitle text-muted mb-0">
            Define administrative roles and control which pages and features staff members can access.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 flex-shrink-0">
          <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5" (click)="refreshAll()" [disabled]="isLoading()" title="Reload roles and permissions">
            <i class="bi bi-arrow-clockwise" [class.spin]="isLoading()"></i>
            <span>Refresh</span>
          </button>
          <button class="btn btn-trust-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm" (click)="openCreateRoleModal()">
            <i class="bi bi-plus-circle-fill"></i>
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Overview -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3">
          <div class="metric-card">
            <div class="metric-icon-box bg-blue-light text-primary">
              <i class="bi bi-shield-shaded"></i>
            </div>
            <div>
              <div class="metric-value">{{ roles().length }}</div>
              <div class="metric-label">Defined Roles</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="metric-card">
            <div class="metric-icon-box bg-green-light text-success">
              <i class="bi bi-people-fill"></i>
            </div>
            <div>
              <div class="metric-value">{{ customRolesCount() }}</div>
              <div class="metric-label">Custom Roles</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="metric-card">
            <div class="metric-icon-box bg-purple-light text-purple">
              <i class="bi bi-lock-fill"></i>
            </div>
            <div>
              <div class="metric-value">{{ systemRolesCount() }}</div>
              <div class="metric-label">System Standards</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="metric-card">
            <div class="metric-icon-box bg-amber-light text-warning">
              <i class="bi bi-grid-fill"></i>
            </div>
            <div>
              <div class="metric-value">{{ availablePages().length || 9 }}</div>
              <div class="metric-label">Protected Modules</div>
            </div>
          </div>
        </div>
      </div>

      

      <!-- Feedback Alerts -->
      @if (successMessage()) {
        <div class="alert alert-success d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm border-0 mb-4" role="alert">
          <div class="d-flex align-items-center gap-2.5">
            <i class="bi bi-check-circle-fill text-success fs-5"></i>
            <span class="small fw-semibold text-dark">{{ successMessage() }}</span>
          </div>
          <button type="button" class="btn-close" (click)="successMessage.set(null)" aria-label="Close"></button>
        </div>
      }
      @if (errorMessage()) {
        <div class="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm border-0 mb-4" role="alert">
          <div class="d-flex align-items-center gap-2.5">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
            <span class="small fw-semibold text-dark">{{ errorMessage() }}</span>
          </div>
          <button type="button" class="btn-close" (click)="errorMessage.set(null)" aria-label="Close"></button>
        </div>
      }

      <!-- ROLES & PAGE PERMISSIONS TEMPLATES -->
        @if (isLoading()) {
          <div class="loading-state text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted small mt-2.5">Loading role templates and permissions...</p>
          </div>
        } @else {
          <div class="row g-3 mb-4">
            @for (role of roles(); track role.id) {
              <div class="col-12 col-md-6 col-xl-4">
                <div class="clean-card role-card h-100 d-flex flex-column justify-content-between">
                  <div>
                    <!-- Role Card Top Header -->
                    <div class="d-flex align-items-start justify-content-between gap-2 mb-3">
                      <div class="d-flex align-items-center gap-2.5">
                        <div class="role-avatar-box" [ngClass]="getRoleAvatarClass(role.name)">
                          <i class="bi" [class]="getRoleIcon(role.name)"></i>
                        </div>
                        <div>
                          <h6 class="role-name mb-0 text-dark fw-bold">{{ role.name }}</h6>
                          <div class="role-user-count text-muted small">
                            <i class="bi bi-person me-1"></i>{{ role.user_count || 0 }} user(s) assigned
                          </div>
                        </div>
                      </div>

                      @if (role.is_system) {
                        <span class="badge bg-light text-secondary border fw-normal" style="font-size: 11px;">
                          <i class="bi bi-lock me-1"></i>System
                        </span>
                      } @else {
                        <span class="badge bg-purple-subtle text-purple border border-purple-subtle fw-normal" style="font-size: 11px;">
                          Custom
                        </span>
                      }
                    </div>

                    <!-- Description -->
                    <p class="role-description text-muted small mb-3">
                      {{ role.description || 'Standard charity role configuration.' }}
                    </p>

                    <!-- Allowed Modules Chips -->
                    <div class="modules-section">
                      <div class="section-micro-title text-muted text-uppercase mb-2">
                        Allowed Page Access:
                      </div>

                      <div class="d-flex flex-wrap gap-1.5">
                        @if (role.permissions.includes('*')) {
                          <span class="full-access-chip">
                            <i class="bi bi-shield-fill-check me-1.5 text-success"></i> Full Unrestricted Access (All Modules)
                          </span>
                        } @else {
                          @for (page of availablePages(); track page.key) {
                            @if (role.permissions.includes(page.key)) {
                              <span class="module-chip">
                                <i class="bi me-1 text-primary" [class]="getPageIcon(page.key)"></i>
                                {{ page.name }}
                              </span>
                            }
                          }
                          @if (role.permissions.length === 0) {
                            <span class="badge bg-warning-subtle text-warning border border-warning-subtle py-1 px-2 fw-normal">
                              No pages permitted
                            </span>
                          }
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Role Card Footer Actions -->
                  <div class="card-footer-action d-flex justify-content-between align-items-center pt-3 mt-3 border-top">
                    <span class="text-muted small" style="font-size: 11.5px;">
                      {{ role.permissions.includes('*') ? 'All Modules Enabled' : (role.permissions.length + ' page(s) granted') }}
                    </span>
                    <div class="d-flex gap-1.5">
                      <button class="btn btn-sm btn-outline-primary py-1 px-2.5 rounded-2 d-flex align-items-center gap-1" (click)="openEditRoleModal(role)" title="Edit Page Permissions">
                        <i class="bi bi-pencil"></i>
                        <span>Edit</span>
                      </button>
                      @if (!role.is_system) {
                        <button class="btn btn-sm btn-outline-danger py-1 px-2 rounded-2" (click)="deleteRole(role)" title="Delete Role">
                          <i class="bi bi-trash"></i>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="col-12">
                <div class="clean-card p-5 text-center">
                  <i class="bi bi-shield-exclamation text-warning fs-1 d-block mb-2"></i>
                  <h6 class="fw-bold text-dark">No Roles Defined Yet</h6>
                  <p class="text-muted small mb-3">Create custom designations or reload system standard templates.</p>
                  <button class="btn btn-trust-primary btn-sm px-3" (click)="openCreateRoleModal()">
                    <i class="bi bi-plus-circle me-1"></i> Create First Role
                  </button>
                </div>
              </div>
            }
          </div>
        }
      <!-- MODAL 1: CREATE / EDIT ROLE -->
      @if (showRoleModal()) {
        <div class="modal fade show d-block modal-backdrop-custom" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header px-4 py-3 text-white" style="background-color: #0F3D63;">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi" [class]="isEditingRole() ? 'bi-pencil-square' : 'bi-shield-plus'"></i>
                  <h5 class="modal-title fw-bold mb-0">
                    {{ isEditingRole() ? 'Edit Role Permissions' : 'Create New Administrative Role' }}
                  </h5>
                </div>
                <button type="button" class="btn-close btn-close-white" (click)="showRoleModal.set(false)" aria-label="Close"></button>
              </div>

              <div class="modal-body p-4">
                <form (ngSubmit)="saveRole()">
                  <div class="row g-3 mb-3">
                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-bold text-dark">Role Title / Designation *</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="roleForm.name" 
                        name="roleName" 
                        placeholder="e.g. Donation Cashier, Volunteer Head"
                        [disabled]="isEditingRole() && !!selectedRole?.is_system"
                        required
                      >
                      @if (isEditingRole() && selectedRole?.is_system) {
                        <div class="form-text small text-muted">System standard role titles are protected and cannot be renamed.</div>
                      }
                    </div>

                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-bold text-dark">Description</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="roleForm.description" 
                        name="roleDescription" 
                        placeholder="Brief summary of duties and responsibilities..."
                      >
                    </div>
                  </div>

                  <!-- Permission Selection Matrix -->
                  <div class="permission-matrix-section mb-4">
                    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-2.5">
                      <div>
                        <label class="form-label small fw-bold text-dark mb-0">Select Permitted Pages / Modules</label>
                        <div class="text-muted" style="font-size: 11.5px;">Users with this role can only view and operate within enabled pages.</div>
                      </div>
                      <div class="d-flex gap-2">
                        <button type="button" class="btn btn-xs btn-outline-primary" (click)="toggleAllPages(true)">Select All</button>
                        <button type="button" class="btn btn-xs btn-outline-secondary" (click)="toggleAllPages(false)">Clear All</button>
                      </div>
                    </div>

                    <div class="row g-2.5">
                      @for (page of availablePages(); track page.key) {
                        <div class="col-12 col-sm-6 col-md-4">
                          <label class="module-toggle-card cursor-pointer" [class.selected]="isPageSelected(page.key)">
                            <div class="d-flex align-items-start gap-2.5">
                              <input 
                                type="checkbox" 
                                class="form-check-input mt-0.5" 
                                [checked]="isPageSelected(page.key)"
                                (change)="togglePage(page.key)"
                              >
                              <div class="flex-grow-1 min-w-0">
                                <div class="d-flex align-items-center gap-1.5 mb-0.5">
                                  <i class="bi text-primary" [class]="getPageIcon(page.key)"></i>
                                  <span class="module-title text-dark fw-semibold">{{ page.name }}</span>
                                </div>
                                <div class="module-desc text-muted">{{ page.description }}</div>
                              </div>
                            </div>
                          </label>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                    <button type="button" class="btn btn-light px-3" (click)="showRoleModal.set(false)" [disabled]="isSubmitting()">Cancel</button>
                    <button type="submit" class="btn btn-trust-primary px-4" [disabled]="isSubmitting()">
                      @if (isSubmitting()) {
                        <span class="spinner-border spinner-border-sm me-1.5"></span> Saving...
                      } @else {
                        <i class="bi bi-check-circle me-1.5"></i> {{ isEditingRole() ? 'Save Permissions' : 'Create Role' }}
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      }

      </div>
  `,
  styles: [`
    .roles-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.25rem 0.5rem;
    }

    /* Page Header */
    .page-title {
      color: #0F3D63;
      font-size: 1.45rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 0.85rem;
      color: #64748b;
    }

    /* Trust Brand Button */
    .btn-trust-primary {
      background-color: #0F3D63;
      border-color: #0F3D63;
      color: #ffffff;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .btn-trust-primary:hover, .btn-trust-primary:focus {
      background-color: #0b2e4b;
      border-color: #0b2e4b;
      color: #ffffff;
    }

    .btn-xs {
      padding: 0.2rem 0.55rem;
      font-size: 0.72rem;
      border-radius: 6px;
      font-weight: 500;
    }

    /* Metric Cards */
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.15rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .metric-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    .bg-blue-light { background: #e0f2fe; }
    .bg-green-light { background: #dcfce7; }
    .bg-purple-light { background: #f3e8ff; }
    .bg-amber-light { background: #fef3c7; }
    .text-purple { color: #8b5cf6 !important; }

    .metric-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #0F3D63;
      line-height: 1.1;
    }
    .metric-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
      margin-top: 2px;
    }

    /* Segmented Tab Switcher */
    .tab-switcher-wrapper {
      display: flex;
    }
    .tab-switcher {
      display: inline-flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      gap: 4px;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 1.15rem;
      font-size: 0.84rem;
      font-weight: 500;
      color: #64748b;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .tab-btn:hover {
      color: #0F3D63;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0F3D63;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .tab-count {
      margin-left: 6px;
      padding: 1px 7px;
      border-radius: 10px;
      font-size: 0.72rem;
      background: #e2e8f0;
      color: #475569;
    }
    .tab-btn.active .tab-count {
      background: #e0f2fe;
      color: #0284c7;
    }

    /* Clean Card Container */
    .clean-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    /* Role Card */
    .role-card {
      padding: 1.25rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      position: relative;
    }
    .role-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(15, 61, 99, 0.06);
      border-color: #cbd5e1;
    }
    .role-avatar-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .role-avatar-super { background: #fee2e2; color: #dc2626; }
    .role-avatar-trustee { background: #e0f2fe; color: #0284c7; }
    .role-avatar-finance { background: #dcfce7; color: #16a34a; }
    .role-avatar-welfare { background: #fef3c7; color: #d97706; }
    .role-avatar-media { background: #ccfbf1; color: #0d9488; }
    .role-avatar-custom { background: #f3e8ff; color: #9333ea; }

    .role-name {
      font-size: 0.95rem;
      line-height: 1.2;
    }
    .role-user-count {
      font-size: 0.75rem;
      margin-top: 2px;
    }
    .role-description {
      font-size: 0.78rem;
      line-height: 1.45;
      min-height: 34px;
    }
    .section-micro-title {
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    /* Chips */
    .full-access-chip {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
    }
    .module-chip {
      background: #f8fafc;
      color: #334155;
      border: 1px solid #e2e8f0;
      padding: 2.5px 7px;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
    }

    /* Table Styling */
    .clean-table {
      font-size: 0.85rem;
    }
    .clean-table thead th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .clean-table tbody td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .clean-table tbody tr:hover {
      background-color: #fafbfc;
    }

    /* User Avatars & Text */
    .user-avatar-circle {
      width: 36px;
      height: 36px;
      background: #0F3D63;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .user-name-label {
      font-size: 0.88rem;
    }
    .user-email-label {
      font-size: 0.74rem;
    }

    /* Role Badges in Table */
    .role-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .role-badge-super {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .role-badge-trustee {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .role-badge-finance {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .role-badge-welfare {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .role-badge-media {
      background: #ccfbf1;
      color: #0f766e;
      border: 1px solid #99f6e4;
    }
    .role-badge-custom {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }

    /* Search Box */
    .search-box-wrapper {
      position: relative;
      width: 100%;
      max-width: 340px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 0.85rem;
    }
    .search-input {
      padding-left: 32px;
      border-radius: 8px;
      border-color: #cbd5e1;
      font-size: 0.82rem;
    }
    .search-input:focus {
      border-color: #0F3D63;
      box-shadow: 0 0 0 2px rgba(15, 61, 99, 0.1);
    }

    /* Modal Backdrop */
    .modal-backdrop-custom {
      background: rgba(10, 39, 64, 0.55);
      backdrop-filter: blur(4px);
      z-index: 1060;
    }

    /* Module Toggle Card (in Modals) */
    .module-toggle-card {
      display: block;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.65rem 0.75rem;
      transition: all 0.15s ease;
      height: 100%;
    }
    .module-toggle-card:hover {
      border-color: #94a3b8;
      background: #f8fafc;
    }
    .module-toggle-card.selected {
      background: #eff6ff;
      border-color: #0284c7;
      box-shadow: 0 1px 3px rgba(2, 132, 199, 0.08);
    }
    .module-title {
      font-size: 0.8rem;
      line-height: 1.2;
    }
    .module-desc {
      font-size: 0.68rem;
      line-height: 1.35;
    }

    .user-brief-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class RolesComponent implements OnInit {
  isLoading = signal(true);
  isSubmitting = signal(false);

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  roles = signal<Role[]>([]);
  availablePages = signal<AvailablePage[]>([]);

  // Role Form Modal State
  showRoleModal = signal(false);
  isEditingRole = signal(false);
  selectedRole: Role | null = null;
  roleForm = {
    name: '',
    description: '',
    permissions: [] as string[]
  };

  // Computed Metrics
  systemRolesCount = computed(() => this.roles().filter(r => r.is_system).length);
  customRolesCount = computed(() => this.roles().filter(r => !r.is_system).length);

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  refreshAll(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading.set(true);
    this.authService.getRoles().subscribe({
      next: (res) => {
        this.roles.set(res.roles || []);
        this.availablePages.set(res.available_pages || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load roles: ' + (err.error?.message || err.message));
        this.isLoading.set(false);
      }
    });
  }

  

  // Icons and Color Helpers
  getPageIcon(key: string): string {
    switch (key) {
      case 'dashboard': return 'bi-speedometer2';
      case 'donations': return 'bi-cash-coin';
      case 'expenses': return 'bi-wallet2';
      case 'causes': return 'bi-heart-pulse-fill';
      case 'gallery': return 'bi-images';
      case 'volunteers': return 'bi-people-fill';
      case 'inquiries': return 'bi-envelope-paper-fill';
      case 'settings': return 'bi-gear-fill';
      case 'admins': return 'bi-shield-lock-fill';
      case 'roles': return 'bi-person-gear';
      default: return 'bi-app';
    }
  }

  getRoleIcon(roleName: string): string {
    const r = (roleName || '').toLowerCase();
    if (r.includes('super')) return 'bi-shield-lock-fill';
    if (r.includes('trustee')) return 'bi-person-badge-fill';
    if (r.includes('finance') || r.includes('accountant')) return 'bi-cash-coin';
    if (r.includes('welfare') || r.includes('coordinator')) return 'bi-heart-fill';
    if (r.includes('media')) return 'bi-megaphone-fill';
    return 'bi-shield-shaded';
  }

  getRoleAvatarClass(roleName: string): string {
    const r = (roleName || '').toLowerCase();
    if (r.includes('super')) return 'role-avatar-super';
    if (r.includes('trustee')) return 'role-avatar-trustee';
    if (r.includes('finance') || r.includes('accountant')) return 'role-avatar-finance';
    if (r.includes('welfare') || r.includes('coordinator')) return 'role-avatar-welfare';
    if (r.includes('media')) return 'role-avatar-media';
    return 'role-avatar-custom';
  }

  getRoleBadgeClass(roleName: string): string {
    const r = (roleName || '').toLowerCase();
    if (r.includes('super')) return 'role-badge-super';
    if (r.includes('trustee')) return 'role-badge-trustee';
    if (r.includes('finance') || r.includes('accountant')) return 'role-badge-finance';
    if (r.includes('welfare') || r.includes('coordinator')) return 'role-badge-welfare';
    if (r.includes('media')) return 'role-badge-media';
    return 'role-badge-custom';
  }

  // Role Modal Helpers
  openCreateRoleModal(): void {
    this.isEditingRole.set(false);
    this.selectedRole = null;
    this.roleForm = {
      name: '',
      description: '',
      permissions: ['dashboard']
    };
    this.showRoleModal.set(true);
  }

  openEditRoleModal(role: Role): void {
    this.isEditingRole.set(true);
    this.selectedRole = role;
    this.roleForm = {
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions]
    };
    this.showRoleModal.set(true);
  }

  isPageSelected(key: string): boolean {
    if (this.roleForm.permissions.includes('*')) return true;
    return this.roleForm.permissions.includes(key);
  }

  togglePage(key: string): void {
    if (this.roleForm.permissions.includes('*')) {
      this.roleForm.permissions = this.availablePages().map(p => p.key);
    }
    const idx = this.roleForm.permissions.indexOf(key);
    if (idx !== -1) {
      this.roleForm.permissions.splice(idx, 1);
    } else {
      this.roleForm.permissions.push(key);
    }
  }

  toggleAllPages(select: boolean): void {
    if (select) {
      this.roleForm.permissions = this.availablePages().map(p => p.key);
    } else {
      this.roleForm.permissions = [];
    }
  }

  saveRole(): void {
    if (!this.roleForm.name.trim()) {
      alert('Please enter a Role title.');
      return;
    }

    this.isSubmitting.set(true);
    const data = {
      name: this.roleForm.name.trim(),
      description: this.roleForm.description.trim(),
      permissions: this.roleForm.permissions
    };

    if (this.isEditingRole() && this.selectedRole) {
      this.authService.updateRole(this.selectedRole.id, data).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showRoleModal.set(false);
          this.successMessage.set(`Role "${data.name}" updated successfully.`);
          this.loadRoles();
          setTimeout(() => this.successMessage.set(null), 5000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || err.message);
        }
      });
    } else {
      this.authService.createRole(data).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showRoleModal.set(false);
          this.successMessage.set(`New role "${data.name}" created successfully.`);
          this.loadRoles();
          setTimeout(() => this.successMessage.set(null), 5000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || err.message);
        }
      });
    }
  }

  deleteRole(role: Role): void {
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    this.authService.deleteRole(role.id).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'Role deleted.');
        this.loadRoles();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || err.message);
      }
    });
  }

  }
