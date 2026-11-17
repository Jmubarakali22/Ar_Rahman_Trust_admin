import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Expense, ExpenseSummary } from '../../core/models/models';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="expenses-container">
      <!-- Page Header -->
      <div class="page-header mb-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                <i class="bi bi-wallet2 me-1"></i> Relief & Operations Expenditure
              </span>
              <span class="small text-muted">&bull; Pernambut Trust Central</span>
            </div>
            <h1 class="page-title fw-bold mt-1.5 mb-1">Expenses Management</h1>
            <p class="text-muted small mb-0">
              Track and audit relief expenditures across Tailoring training, Ration Kits, and Monthly Grocery operations.
            </p>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <button 
              type="button" 
              class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5" 
              (click)="refreshAll()" 
              [disabled]="isLoading()"
              title="Reload records"
            >
              <i class="bi bi-arrow-clockwise" [class.spin-icon]="isLoading()"></i>
              <span>Refresh</span>
            </button>

            <button 
              type="button" 
              class="btn btn-outline-success btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5" 
              (click)="exportToCSV()" 
              [disabled]="expenses().length === 0"
              title="Download filtered expenses in CSV format"
            >
              <i class="bi bi-file-earmark-spreadsheet"></i>
              <span>Export CSV</span>
            </button>

            <button 
              type="button" 
              class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold" 
              (click)="openAddModal()"
            >
              <i class="bi bi-plus-circle-fill"></i>
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick KPI Metric Cards -->
      <div class="row g-2.5 g-md-3 mb-4">
        <!-- 1. Total Expenditures -->
        <div class="col-6 col-xl-3">
          <div class="metric-card h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label">Total Expenditure</span>
              <div class="metric-icon-box bg-blue-subtle text-primary">
                <i class="bi bi-cash-stack"></i>
              </div>
            </div>
            <div class="metric-value text-dark">₹{{ (summary().overall_total || 0) | number:'1.2-2' }}</div>
            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
              <span class="small text-muted" style="font-size: 11.5px;">{{ summary().total_count || 0 }} Vouchers Recorded</span>
              <span class="badge bg-light text-secondary border px-1.5 py-0.5" style="font-size: 10px;">Audit Ready</span>
            </div>
          </div>
        </div>

        <!-- 2. Tailoring Training -->
        <div class="col-6 col-xl-3">
          <div class="metric-card h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label">Tailoring Classes</span>
              <div class="metric-icon-box bg-purple-subtle text-purple">
                <i class="bi bi-scissors"></i>
              </div>
            </div>
            <div class="metric-value text-purple">₹{{ (summary().tailoring_total || 0) | number:'1.2-2' }}</div>
            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
              <span class="small text-muted" style="font-size: 11.5px;">Machines & Course Materials</span>
              <button type="button" class="btn btn-link btn-xs p-0 text-decoration-none" (click)="filterByCategory('Tailoring')">Filter &rarr;</button>
            </div>
          </div>
        </div>

        <!-- 3. Ration Kit Relief -->
        <div class="col-6 col-xl-3">
          <div class="metric-card h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label">Ration Kits Relief</span>
              <div class="metric-icon-box bg-emerald-subtle text-success">
                <i class="bi bi-box2-heart"></i>
              </div>
            </div>
            <div class="metric-value text-success">₹{{ (summary().ration_kit_total || 0) | number:'1.2-2' }}</div>
            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
              <span class="small text-muted" style="font-size: 11.5px;">Direct Aid & Emergency Kits</span>
              <button type="button" class="btn btn-link btn-xs p-0 text-decoration-none" (click)="filterByCategory('Ration Kit')">Filter &rarr;</button>
            </div>
          </div>
        </div>

        <!-- 4. Medical Aid -->
        <div class="col-6 col-xl-3">
          <div class="metric-card h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="metric-label">Medical Aid</span>
              <div class="metric-icon-box bg-danger-subtle text-danger">
                <i class="bi bi-heart-pulse-fill"></i>
              </div>
            </div>
            <div class="metric-value text-danger">₹{{ ((summary().medical_aid_total ?? summary().monthly_ration_kit_total) || 0) | number:'1.2-2' }}</div>
            <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
              <span class="small text-muted" style="font-size: 11.5px;">Medicines & Camp Relief</span>
              <button type="button" class="btn btn-link btn-xs p-0 text-decoration-none" (click)="filterByCategory('Medical Aid')">Filter &rarr;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Filter Pills Bar -->
      <div class="category-pills-bar mb-3 d-flex align-items-center gap-2 overflow-auto pb-1">
        <button 
          type="button" 
          class="btn btn-sm category-pill-btn" 
          [class.active]="selectedCategory() === 'all'" 
          (click)="filterByCategory('all')"
        >
          <i class="bi bi-grid-fill me-1"></i> All Categories
        </button>

        <button 
          type="button" 
          class="btn btn-sm category-pill-btn" 
          [class.active]="selectedCategory() === 'Tailoring' || selectedCategory() === 'Tailoring Class'" 
          (click)="filterByCategory('Tailoring Class')"
        >
          <i class="bi bi-scissors me-1 text-purple"></i> Tailoring Class
        </button>

        <button 
          type="button" 
          class="btn btn-sm category-pill-btn" 
          [class.active]="selectedCategory() === 'Ration Kit'" 
          (click)="filterByCategory('Ration Kit')"
        >
          <i class="bi bi-box2-heart me-1 text-success"></i> Ration Kit
        </button>

        <button 
          type="button" 
          class="btn btn-sm category-pill-btn" 
          [class.active]="selectedCategory() === 'Medical Aid' || selectedCategory() === 'Monthly Ration Kit'" 
          (click)="filterByCategory('Medical Aid')"
        >
          <i class="bi bi-heart-pulse-fill me-1 text-danger"></i> Medical Aid
        </button>

        @for (cat of customCategories(); track cat) {
          <button 
            type="button" 
            class="btn btn-sm category-pill-btn" 
            [class.active]="selectedCategory() === cat" 
            (click)="filterByCategory(cat)"
          >
            <i class="bi bi-tag-fill me-1 text-primary"></i> {{ cat }}
          </button>
        }
      </div>

      <!-- Filter Controls Toolbar Card -->
      <div class="clean-card p-3 mb-4">
        <div class="row g-2.5 align-items-center">
          <!-- Search input -->
          <div class="col-12 col-md-4 col-xl-4">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
              <input 
                type="text" 
                class="form-control border-start-0 ps-0" 
                placeholder="Search title, payee, voucher #..." 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange()"
              >
              @if (searchQuery) {
                <button class="btn btn-outline-secondary border-start-0" type="button" (click)="searchQuery = ''; onSearchChange()">
                  <i class="bi bi-x"></i>
                </button>
              }
            </div>
          </div>

          <!-- Date Range Filter -->
          <div class="col-12 col-sm-6 col-md-4 col-xl-3">
            <div class="d-flex align-items-center gap-1.5">
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light text-muted px-2" style="font-size: 11px;">From</span>
                <input type="date" class="form-control form-control-sm px-1.5" [(ngModel)]="fromDate" (change)="onDateChange()">
              </div>
              <div class="input-group input-group-sm">
                <span class="input-group-text bg-light text-muted px-2" style="font-size: 11px;">To</span>
                <input type="date" class="form-control form-control-sm px-1.5" [(ngModel)]="toDate" (change)="onDateChange()">
              </div>
              @if (fromDate || toDate) {
                <button type="button" class="btn btn-link btn-sm p-0 text-danger" (click)="clearDates()" title="Clear date range">
                  <i class="bi bi-x-circle-fill"></i>
                </button>
              }
            </div>
          </div>

          <!-- Payment Method Filter -->
          <div class="col-6 col-sm-3 col-md-2 col-xl-2">
            <select class="form-select form-select-sm" [(ngModel)]="selectedMethod" (change)="onFilterChange()">
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div class="col-6 col-sm-3 col-md-2 col-xl-2">
            <select class="form-select form-select-sm" [(ngModel)]="selectedStatus" (change)="onFilterChange()">
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <!-- Reset All Filters -->
          <div class="col-12 col-xl-1 text-xl-end">
            @if (hasActiveFilters()) {
              <button type="button" class="btn btn-link btn-sm p-0 text-danger text-decoration-none small" (click)="resetFilters()">
                <i class="bi bi-x-lg me-1"></i> Reset
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Feedback Alerts -->
      @if (successMessage()) {
        <div class="alert alert-success d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm border-0 mb-4" role="alert">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill text-success fs-5"></i>
            <span class="small fw-semibold text-dark">{{ successMessage() }}</span>
          </div>
          <button type="button" class="btn-close" (click)="successMessage.set(null)" aria-label="Close"></button>
        </div>
      }
      @if (errorMessage()) {
        <div class="alert alert-danger d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm border-0 mb-4" role="alert">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
            <span class="small fw-semibold text-dark">{{ errorMessage() }}</span>
          </div>
          <button type="button" class="btn-close" (click)="errorMessage.set(null)" aria-label="Close"></button>
        </div>
      }

      <!-- Expenses Table Card -->
      <div class="clean-card mb-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table clean-table mb-0 align-middle">
            <thead>
              <tr>
                <th style="min-width: 140px;">Voucher #</th>
                <th style="min-width: 110px;">Date</th>
                <th style="min-width: 260px;">Expense Title & Vendor</th>
                <th style="min-width: 160px;">Category</th>
                <th style="min-width: 130px;" class="text-end">Amount (₹)</th>
                <th style="min-width: 110px;">Status</th>
                <th style="min-width: 160px;" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                <tr>
                  <td colspan="7" class="text-center py-5 text-muted">
                    <div class="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    <span>Loading expense vouchers and financial records...</span>
                  </td>
                </tr>
              } @else {
                @for (item of expenses(); track item.id) {
                  <tr>
                    <!-- Voucher # -->
                    <td>
                      <span class="font-monospace fw-bold small text-dark d-inline-flex align-items-center gap-1">
                        <i class="bi bi-receipt text-primary"></i>
                        {{ item.voucher_number || ('EXP-' + item.id) }}
                      </span>
                    </td>

                    <!-- Date -->
                    <td class="small text-muted font-monospace">
                      {{ item.expense_date | date:'mediumDate' }}
                    </td>

                    <!-- Title & Payee -->
                    <td>
                      <div class="fw-bold text-dark fs-6">{{ item.title }}</div>
                      @if (item.vendor_payee) {
                        <div class="small text-muted d-flex align-items-center gap-1 mt-0.5">
                          <i class="bi bi-shop me-1"></i> Paid to: <strong>{{ item.vendor_payee }}</strong>
                        </div>
                      }
                      @if (item.notes) {
                        <div class="small text-secondary text-truncate" style="max-width: 320px; font-size: 11px;">
                          {{ item.notes }}
                        </div>
                      }
                    </td>

                    <!-- Category -->
                    <td>
                      <span class="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold" [ngClass]="getCategoryBadgeClass(item.category)" style="font-size: 11px; letter-spacing: 0.3px;">
                        <i class="bi me-1" [ngClass]="getCategoryIcon(item.category)"></i>
                        {{ item.category }}
                      </span>
                    </td>

                    <!-- Amount -->
                    <td class="text-end font-monospace fw-bold fs-6 text-dark">
                      ₹{{ item.amount | number:'1.2-2' }}
                    </td>

                    <!-- Status -->
                    <td>
                      <span class="status-pill" [ngClass]="getStatusPillClass(item.status)">
                        <span class="status-dot"></span>
                        {{ item.status || 'Paid' }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="text-end" style="min-width: 160px; white-space: nowrap;">
                      <div class="action-btn-group">
                        <button type="button" class="btn btn-outline-info action-btn" (click)="viewExpense(item)" title="View Expense Details">
                          <i class="bi bi-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary action-btn" (click)="viewVoucher(item)" title="View & Print Voucher Slip">
                          <i class="bi bi-printer"></i>
                        </button>
                        <button type="button" class="btn btn-outline-primary action-btn" (click)="openEditModal(item)" title="Edit Expense">
                          <i class="bi bi-pencil-square"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger action-btn" (click)="deleteExpense(item)" title="Delete Record">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                      <i class="bi bi-wallet-fill fs-1 text-secondary opacity-50 d-block mb-2"></i>
                      <div class="fw-semibold">No expense records found</div>
                      <div class="small">Try clearing search filters or click "Record Expense" to add one.</div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Centered Pagination Controls -->
        @if (totalPages() > 1 || expenses().length > 0) {
          <div class="px-3 py-3 border-top d-flex justify-content-center align-items-center bg-light bg-opacity-25 rounded-bottom">
            <div class="d-flex align-items-center gap-1.5 flex-wrap justify-content-center">
              <button 
                type="button" 
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === 1" 
                (click)="goToPage(1)"
                title="First Page"
              >
                <i class="bi bi-chevron-double-left"></i>
              </button>

              <button 
                type="button" 
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === 1" 
                (click)="goToPage(currentPage() - 1)"
                title="Previous Page"
              >
                <i class="bi bi-chevron-left"></i>
              </button>

              @for (p of visiblePages(); track p) {
                <button 
                  type="button" 
                  class="btn btn-sm page-num-btn" 
                  [class.active-page]="currentPage() === p"
                  (click)="goToPage(p)"
                >
                  {{ p }}
                </button>
              }

              <button 
                type="button" 
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === totalPages()" 
                (click)="goToPage(currentPage() + 1)"
                title="Next Page"
              >
                <i class="bi bi-chevron-right"></i>
              </button>

              <button 
                type="button" 
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === totalPages()" 
                (click)="goToPage(totalPages())"
                title="Last Page"
              >
                <i class="bi bi-chevron-double-right"></i>
              </button>

              <button 
                type="button" 
                class="btn btn-sm page-nav-btn ms-1 text-primary fw-bold" 
                (click)="scrollToTop()" 
                title="Scroll to Top of Page"
              >
                <i class="bi bi-arrow-up"></i>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- MODAL 1: RECORD / EDIT EXPENSE MODAL -->
      @if (showFormModal()) {
        <div class="modal fade show d-block" style="background: rgba(10, 39, 64, 0.65); z-index: 1060; backdrop-filter: blur(3px);" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header border-0 px-4 py-3 text-white" style="background: linear-gradient(135deg, #0a2740 0%, #0F3D63 100%);">
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 36px; height: 36px; background: rgba(255,255,255,0.15);">
                    <i class="bi" [class.bi-wallet-plus]="!isEditing()" [class.bi-pencil-square]="isEditing()"></i>
                  </div>
                  <div>
                    <h5 class="modal-title fw-bold mb-0 fs-6">
                      {{ isEditing() ? 'Edit Expense Record' : 'Record New Trust Expenditure' }}
                    </h5>
                    <div class="small text-white-50" style="font-size: 11.5px;">
                      Enter details for Tailoring, Ration Kits, Medical Aid, or relief disbursements
                    </div>
                  </div>
                </div>
                <button type="button" class="btn-close btn-close-white" (click)="closeFormModal()"></button>
              </div>

              <form (ngSubmit)="saveExpense()" autocomplete="off">
                <div class="modal-body p-4 bg-light">
                  <!-- Category Selection & Creation -->
                  <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                    <div class="d-flex align-items-center justify-content-between mb-2">
                      <label class="form-label small fw-bold text-dark mb-0 text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                        <i class="bi bi-tags text-primary me-1"></i> Designated Category *
                      </label>
                      <button 
                        type="button" 
                        class="btn btn-xs rounded-pill px-2.5 py-1 fw-semibold"
                        [ngClass]="isCreatingNewCategory() ? 'btn-primary' : 'btn-outline-primary'"
                        (click)="toggleNewCategoryMode()"
                        style="font-size: 11px;"
                      >
                        <i class="bi" [ngClass]="isCreatingNewCategory() ? 'bi-x-circle me-1' : 'bi-plus-circle-fill me-1'"></i>
                        {{ isCreatingNewCategory() ? 'Select Existing' : '+ Create New Category' }}
                      </button>
                    </div>

                    <!-- Category Choice Pills -->
                    <div class="d-flex gap-2 flex-wrap mb-2">
                      <button 
                        type="button" 
                        class="btn btn-sm preset-cat-btn" 
                        [class.active]="!isCreatingNewCategory() && (formData.category === 'Tailoring' || formData.category === 'Tailoring Class')" 
                        (click)="selectCategory('Tailoring Class')"
                      >
                        <i class="bi bi-scissors me-1 text-purple"></i> Tailoring Class
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm preset-cat-btn" 
                        [class.active]="!isCreatingNewCategory() && formData.category === 'Ration Kit'" 
                        (click)="selectCategory('Ration Kit')"
                      >
                        <i class="bi bi-box2-heart me-1 text-success"></i> Ration Kit
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-sm preset-cat-btn" 
                        [class.active]="!isCreatingNewCategory() && formData.category === 'Medical Aid'" 
                        (click)="selectCategory('Medical Aid')"
                      >
                        <i class="bi bi-heart-pulse-fill me-1 text-danger"></i> Medical Aid
                      </button>

                      @for (cat of customCategories(); track cat) {
                        <button 
                          type="button" 
                          class="btn btn-sm preset-cat-btn" 
                          [class.active]="!isCreatingNewCategory() && formData.category === cat" 
                          (click)="selectCategory(cat)"
                        >
                          <i class="bi bi-tag-fill me-1 text-primary"></i> {{ cat }}
                        </button>
                      }

                      <button 
                        type="button" 
                        class="btn btn-sm preset-cat-btn border-primary border-dashed text-primary fw-semibold" 
                        [class.active]="isCreatingNewCategory()" 
                        (click)="toggleNewCategoryMode()"
                      >
                        <i class="bi bi-plus-circle me-1"></i> + New Category
                      </button>
                    </div>

                    <!-- Dynamic Create New Category Input -->
                    @if (isCreatingNewCategory()) {
                      <div class="p-2.5 rounded-3 bg-light border mt-2">
                        <label class="form-label small fw-bold text-dark mb-1" style="font-size: 11.5px;">
                          <i class="bi bi-folder-plus text-primary me-1"></i> Enter New Category Name *
                        </label>
                        <div class="input-group input-group-sm">
                          <span class="input-group-text bg-white text-primary border-end-0"><i class="bi bi-tag"></i></span>
                          <input 
                            type="text" 
                            class="form-control form-control-sm border-start-0" 
                            placeholder="Type new category (e.g. Office Rent, Education Aid, Food Drive)..." 
                            [(ngModel)]="customCategoryName" 
                            (ngModelChange)="onCustomCategoryChange()"
                            name="customCategory"
                            required
                          >
                        </div>
                        <div class="small text-muted mt-1.5 d-flex align-items-center gap-1.5 flex-wrap" style="font-size: 11px;">
                          <i class="bi bi-check-circle-fill text-success"></i>
                          <span>ImageKit folder will be auto-created:</span>
                          <code class="text-primary font-monospace bg-white px-1.5 py-0.5 rounded border">/assets/expenses-management/{{ getFolderSlug(formData.category) }}</code>
                        </div>
                      </div>
                    } @else {
                      <div class="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                        <span class="small text-muted" style="font-size: 11.5px;">
                          Active Category: <strong class="text-dark">{{ formData.category || 'None selected' }}</strong>
                        </span>
                        <span class="badge bg-light text-secondary border font-monospace" style="font-size: 10.5px;">
                          /assets/expenses-management/{{ getFolderSlug(formData.category) }}
                        </span>
                      </div>
                    }
                  </div>

                  <!-- Expense Details -->
                  <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                    <div class="fw-bold small text-dark mb-2 text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                      <i class="bi bi-receipt text-primary me-1"></i> Transaction Details
                    </div>
                    <div class="row g-3">
                      <div class="col-md-8">
                        <label class="form-label small fw-bold text-secondary mb-1">Expense Title / Item Description *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="e.g. 50 Bags of Toor Dal and Rice Supply" 
                          [(ngModel)]="formData.title" 
                          name="title" 
                          required
                        >
                      </div>

                      <div class="col-md-4">
                        <label class="form-label small fw-bold text-secondary mb-1">Amount (₹) *</label>
                        <div class="input-group">
                          <span class="input-group-text bg-light fw-bold">₹</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            min="1" 
                            class="form-control fw-bold" 
                            placeholder="0.00" 
                            [(ngModel)]="formData.amount" 
                            name="amount" 
                            required
                          >
                        </div>
                      </div>

                      <div class="col-md-4">
                        <label class="form-label small fw-bold text-secondary mb-1">Expense Date *</label>
                        <input 
                          type="date" 
                          class="form-control" 
                          [(ngModel)]="formData.expense_date" 
                          name="expense_date" 
                          required
                        >
                      </div>

                      <div class="col-md-4">
                        <label class="form-label small fw-bold text-secondary mb-1">Payment Method</label>
                        <select class="form-select" [(ngModel)]="formData.payment_method" name="payment_method">
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>

                      <div class="col-md-4">
                        <label class="form-label small fw-bold text-secondary mb-1">Status</label>
                        <select class="form-select" [(ngModel)]="formData.status" name="status">
                          <option value="Paid">Paid</option>
                          <option value="Verified">Verified</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>

                      <div class="col-md-6">
                        <label class="form-label small fw-bold text-secondary mb-1">Paid To / Vendor / Shop</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="e.g. Al-Madina Provisions, Pernambut" 
                          [(ngModel)]="formData.vendor_payee" 
                          name="vendor_payee"
                        >
                      </div>

                      <div class="col-md-6">
                        <label class="form-label small fw-bold text-secondary mb-1">Voucher # (Auto if blank)</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="Leave blank for automatic EXP-YYYY-XXXX" 
                          [(ngModel)]="formData.voucher_number" 
                          name="voucher_number"
                        >
                      </div>

                      <div class="col-12">
                        <label class="form-label small fw-bold text-secondary mb-1">Notes / Additional Purpose Details</label>
                        <textarea 
                          class="form-control" 
                          rows="2" 
                          placeholder="Provide context, beneficiary count, or specific breakdown..." 
                          [(ngModel)]="formData.notes" 
                          name="notes"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Document / Bill Upload (Images & PDF) -->
                  <div class="bg-white p-3 rounded-3 border shadow-sm">
                    <div class="fw-bold small text-dark mb-2 text-uppercase d-flex align-items-center justify-content-between" style="font-size: 11px; letter-spacing: 0.5px;">
                      <span><i class="bi bi-paperclip text-primary me-1"></i> Bill / Receipt Attachment (PDF or Image)</span>
                      <span class="badge bg-light text-secondary border fw-normal" style="font-size: 10px;">PDF, PNG, JPG</span>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                      <input 
                        type="file" 
                        class="form-control form-control-sm" 
                        accept="image/*,application/pdf" 
                        (change)="onFileSelected($event)"
                      >
                      @if (formData.receipt_url && !selectedFile) {
                        <a [href]="formData.receipt_url" target="_blank" class="small text-primary text-nowrap">
                          <i class="bi" [ngClass]="formData.receipt_url.toLowerCase().includes('.pdf') ? 'bi-file-earmark-pdf text-danger' : 'bi-eye'"></i> Current File
                        </a>
                      }
                    </div>

                    <!-- Dynamic ImageKit destination folder preview -->
                    <div class="small text-muted mt-2.5 pt-2 border-top d-flex align-items-center gap-1.5 flex-wrap" style="font-size: 11.5px;">
                      <i class="bi bi-cloud-arrow-up text-primary"></i>
                      <span>ImageKit Destination:</span>
                      <code class="text-primary bg-light px-2 py-0.5 rounded border font-monospace">/assets/expenses-management/{{ getFolderSlug(formData.category) }}</code>
                      @if (isCustomCategory(formData.category)) {
                        <span class="badge bg-success-subtle text-success border px-2 py-0.5" style="font-size: 10px;">
                          <i class="bi bi-folder-plus me-1"></i>New Folder Auto-Created in ImageKit
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <div class="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
                  <button type="button" class="btn btn-light rounded-pill px-4 py-2" (click)="closeFormModal()" [disabled]="isSubmitting()">Cancel</button>
                  <button type="submit" class="btn btn-trust-primary rounded-pill px-4 py-2 shadow-sm fw-semibold" [disabled]="isSubmitting()">
                    @if (isSubmitting()) {
                      <span class="spinner-border spinner-border-sm me-1"></span> Saving...
                    } @else {
                      <i class="bi bi-check-circle me-1"></i> {{ isEditing() ? 'Update Expense' : 'Save Expense' }}
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: VIEW EXPENSE VOUCHER SLIP -->
      @if (showVoucherModal() && activeVoucher()) {
        <div class="modal fade show d-block" style="background: rgba(10, 39, 64, 0.7); z-index: 1060; backdrop-filter: blur(3px);" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered" style="max-width: 580px;">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header border-0 px-4 py-3 text-white" style="background: #0F3D63;">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-receipt-cutoff fs-5"></i>
                  <h5 class="modal-title fw-bold mb-0 fs-6">Official Payment Voucher</h5>
                </div>
                <button type="button" class="btn-close btn-close-white" (click)="showVoucherModal.set(false)"></button>
              </div>

              <div class="modal-body p-4" id="printableVoucher">
                <!-- Trust Header -->
                <div class="text-center pb-3 mb-3 border-bottom">
                  <div class="d-inline-flex align-items-center justify-content-center p-2 rounded-circle bg-light border mb-2" style="width: 56px; height: 56px;">
                    <img src="https://ik.imagekit.io/baaidzoik/assets/header-logo/ar_logo_1.png" alt="Trust Logo" style="width: 40px; height: 40px; object-fit: contain;">
                  </div>
                  <h5 class="fw-bold text-dark mb-0">Ar Rahman Trust</h5>
                  <div class="small text-muted">Pernambut, Tamil Nadu &bull; Reg. No. 04/16/2020</div>
                  <span class="badge bg-secondary-subtle text-secondary font-monospace mt-1">
                    VOUCHER: {{ activeVoucher()!.voucher_number || ('EXP-' + activeVoucher()!.id) }}
                  </span>
                </div>

                <!-- Voucher Fields -->
                <div class="row g-2 mb-3 small">
                  <div class="col-6">
                    <span class="text-muted d-block">Disbursement Date:</span>
                    <strong class="text-dark">{{ activeVoucher()!.expense_date | date:'mediumDate' }}</strong>
                  </div>
                  <div class="col-6 text-end">
                    <span class="text-muted d-block">Category:</span>
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle">{{ activeVoucher()!.category }}</span>
                  </div>

                  <div class="col-12 pt-2 border-top">
                    <span class="text-muted d-block">Purpose / Title:</span>
                    <strong class="text-dark fs-6">{{ activeVoucher()!.title }}</strong>
                  </div>

                  @if (activeVoucher()!.vendor_payee) {
                    <div class="col-12 pt-2">
                      <span class="text-muted d-block">Paid To / Recipient:</span>
                      <strong class="text-dark">{{ activeVoucher()!.vendor_payee }}</strong>
                    </div>
                  }

                  <div class="col-6 pt-2">
                    <span class="text-muted d-block">Payment Mode:</span>
                    <span class="text-dark fw-semibold">{{ activeVoucher()!.payment_method || 'Cash' }}</span>
                  </div>
                  <div class="col-6 pt-2 text-end">
                    <span class="text-muted d-block">Audit Status:</span>
                    <span class="text-success fw-bold">{{ activeVoucher()!.status || 'Paid' }}</span>
                  </div>
                </div>

                <!-- Amount Box -->
                <div class="p-3 bg-light rounded-3 border text-center my-3">
                  <div class="small text-muted mb-0.5">TOTAL DISBURSED AMOUNT</div>
                  <div class="display-6 fw-bold text-dark font-monospace">₹{{ activeVoucher()!.amount | number:'1.2-2' }}</div>
                </div>

                @if (activeVoucher()!.notes) {
                  <div class="small text-muted p-2 rounded bg-light border mb-3">
                    <strong>Notes:</strong> {{ activeVoucher()!.notes }}
                  </div>
                }

                @if (activeVoucher()!.receipt_url) {
                  <div class="text-center pt-2 border-top">
                    <a [href]="activeVoucher()!.receipt_url" target="_blank" class="btn btn-outline-primary btn-sm rounded-pill px-3">
                      <i class="bi bi-box-arrow-up-right me-1"></i> View Original Bill / Invoice
                    </a>
                  </div>
                }
              </div>

              <div class="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-light" (click)="showVoucherModal.set(false)">Close</button>
                <button type="button" class="btn btn-trust-primary" (click)="printVoucher()">
                  <i class="bi bi-printer me-1"></i> Print Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 3: VIEW EXPENSE DETAILS MODAL -->
      @if (showViewModal() && activeExpenseView()) {
        <div class="modal fade show d-block" style="background: rgba(10, 39, 64, 0.65); z-index: 1060; backdrop-filter: blur(3px);" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header border-0 px-4 py-3 text-white" style="background: linear-gradient(135deg, #0a2740 0%, #0F3D63 100%);">
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 38px; height: 38px; background: rgba(255,255,255,0.18);">
                    <i class="bi bi-receipt-cutoff fs-5"></i>
                  </div>
                  <div>
                    <h5 class="modal-title fw-bold mb-0 fs-6">Expense Record Details</h5>
                    <div class="small text-white-50" style="font-size: 11.5px;">
                      Voucher Reference: <strong class="text-white font-monospace">{{ activeExpenseView()!.voucher_number || ('EXP-' + activeExpenseView()!.id) }}</strong>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn-close btn-close-white" (click)="showViewModal.set(false)"></button>
              </div>

              <div class="modal-body p-4 bg-light">
                <!-- Amount Banner Card -->
                <div class="bg-white p-3.5 rounded-3 border mb-3 shadow-sm">
                  <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <div class="text-uppercase small fw-bold text-muted" style="font-size: 11px; letter-spacing: 0.5px;">Disbursed Amount</div>
                      <div class="fw-bold fs-3 text-danger">₹{{ activeExpenseView()!.amount | number:'1.2-2' }}</div>
                      <div class="text-muted small">Indian Rupees</div>
                    </div>
                    <div class="d-flex flex-column align-items-end gap-1.5">
                      <span class="status-pill" [ngClass]="getStatusPillClass(activeExpenseView()!.status)">
                        <span class="status-dot"></span>
                        Status: {{ activeExpenseView()!.status || 'Paid' }}
                      </span>
                      <span class="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold" [ngClass]="getCategoryBadgeClass(activeExpenseView()!.category)" style="font-size: 11px;">
                        <i class="bi me-1" [ngClass]="getCategoryIcon(activeExpenseView()!.category)"></i>
                        {{ activeExpenseView()!.category }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Transaction Details Grid -->
                <div class="bg-white p-3 rounded-3 border mb-3 shadow-sm">
                  <div class="fw-bold small text-dark mb-2.5 text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                    <i class="bi bi-info-circle-fill text-primary me-1"></i> Transaction Record Information
                  </div>
                  <div class="row g-3">
                    <div class="col-sm-6">
                      <div class="small text-muted mb-0.5">Title / Description:</div>
                      <div class="fw-semibold text-dark">{{ activeExpenseView()!.title }}</div>
                    </div>
                    <div class="col-sm-6">
                      <div class="small text-muted mb-0.5">Paid To / Payee:</div>
                      <div class="fw-semibold text-dark">{{ activeExpenseView()!.vendor_payee || 'Not specified' }}</div>
                    </div>
                    <div class="col-sm-4">
                      <div class="small text-muted mb-0.5">Disbursement Date:</div>
                      <div class="fw-semibold text-dark font-monospace">{{ activeExpenseView()!.expense_date | date:'mediumDate' }}</div>
                    </div>
                    <div class="col-sm-4">
                      <div class="small text-muted mb-0.5">Payment Method:</div>
                      <div class="fw-semibold text-dark">
                        <i class="bi" [ngClass]="getMethodIcon(activeExpenseView()!.payment_method)"></i>
                        {{ activeExpenseView()!.payment_method || 'Cash' }}
                      </div>
                    </div>
                    <div class="col-sm-4">
                      <div class="small text-muted mb-0.5">Voucher Number:</div>
                      <div class="fw-semibold text-dark font-monospace">{{ activeExpenseView()!.voucher_number || ('EXP-' + activeExpenseView()!.id) }}</div>
                    </div>
                    @if (activeExpenseView()!.notes) {
                      <div class="col-12">
                        <div class="small text-muted mb-0.5">Audit Notes / Justification:</div>
                        <div class="p-2.5 rounded bg-light border text-secondary small">{{ activeExpenseView()!.notes }}</div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Attached Bill / Receipt Section -->
                <div class="bg-white p-3 rounded-3 border shadow-sm">
                  <div class="fw-bold small text-dark mb-2.5 text-uppercase d-flex align-items-center justify-content-between" style="font-size: 11px; letter-spacing: 0.5px;">
                    <span><i class="bi bi-paperclip text-primary me-1"></i> Bill / Receipt Attachment</span>
                    @if (activeExpenseView()!.receipt_url) {
                      <span class="badge bg-success-subtle text-success border">Attached in ImageKit</span>
                    } @else {
                      <span class="badge bg-light text-muted border">No Document Attached</span>
                    }
                  </div>

                  @if (activeExpenseView()!.receipt_url) {
                    <div class="p-3 rounded-3 border bg-light">
                      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <div class="d-flex align-items-center gap-2">
                          <i class="bi fs-4" [ngClass]="activeExpenseView()!.receipt_url!.toLowerCase().includes('.pdf') ? 'bi-file-earmark-pdf-fill text-danger' : 'bi-file-earmark-image text-primary'"></i>
                          <div>
                            <div class="fw-bold small text-dark">{{ activeExpenseView()!.receipt_url!.toLowerCase().includes('.pdf') ? 'PDF Bill Document' : 'Receipt Image Attachment' }}</div>
                            <div class="text-muted" style="font-size: 11px;">Saved in ImageKit Media Storage</div>
                          </div>
                        </div>
                        <a [href]="activeExpenseView()!.receipt_url" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-trust-primary rounded-pill px-3 py-1.5 shadow-sm fw-semibold">
                          <i class="bi bi-box-arrow-up-right me-1"></i> Open Original Document
                        </a>
                      </div>

                      @if (!activeExpenseView()!.receipt_url!.toLowerCase().includes('.pdf')) {
                        <div class="text-center mt-3 pt-3 border-top">
                          <img [src]="activeExpenseView()!.receipt_url" alt="Receipt Preview" class="img-fluid rounded border shadow-sm" style="max-height: 260px; object-fit: contain;">
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="text-center py-3 text-muted">
                      <i class="bi bi-file-earmark-x fs-3 d-block mb-1 text-secondary opacity-50"></i>
                      <div class="small">No receipt or bill file was attached for this transaction.</div>
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
                <button type="button" class="btn btn-light rounded-pill px-3.5 py-1.5" (click)="showViewModal.set(false)">Close</button>
                <div class="d-flex align-items-center gap-2">
                  <button type="button" class="btn btn-outline-secondary rounded-pill px-3.5 py-1.5 fw-semibold" (click)="printFromViewModal()">
                    <i class="bi bi-printer me-1"></i> Print Voucher Slip
                  </button>
                  <button type="button" class="btn btn-trust-primary rounded-pill px-3.5 py-1.5 shadow-sm fw-semibold" (click)="editFromViewModal()">
                    <i class="bi bi-pencil-square me-1"></i> Edit Expense
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .expenses-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.25rem 0.5rem;
    }
    .page-title {
      color: #0F3D63;
      font-size: 1.45rem;
    }
    .btn-trust-primary {
      background-color: #0F3D63;
      color: #ffffff;
      border: 1px solid #0F3D63;
      transition: all 0.2s ease;
    }
    .btn-trust-primary:hover {
      background-color: #0a2740;
      border-color: #0a2740;
      color: #ffffff;
      transform: translateY(-1px);
    }
    .clean-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.15rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
    }
    .metric-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
    }
    .metric-label {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 1.55rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .metric-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
    }
    .bg-blue-subtle { background-color: #eff6ff; }
    .bg-purple-subtle { background-color: #faf5ff; }
    .bg-emerald-subtle { background-color: #ecfdf5; }
    .bg-amber-subtle { background-color: #fffbeb; }
    .bg-danger-subtle { background-color: #fef2f2; }
    .text-purple { color: #7e22ce; }
    .text-amber { color: #d97706; }

    /* Category Filter Pills */
    .category-pill-btn {
      background: #ffffff;
      color: #475569;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 0.35rem 0.9rem;
      font-weight: 600;
      font-size: 0.8rem;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .category-pill-btn:hover {
      border-color: #0F3D63;
      color: #0F3D63;
      background: #f8fafc;
    }
    .category-pill-btn.active {
      background: #0F3D63;
      color: #ffffff;
      border-color: #0F3D63;
      box-shadow: 0 2px 6px rgba(15, 61, 99, 0.25);
    }

    .preset-cat-btn {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      padding: 0.4rem 0.85rem;
      transition: all 0.15s ease;
    }
    .preset-cat-btn:hover {
      background: #ffffff;
      border-color: #0F3D63;
    }
    .preset-cat-btn.active {
      background: #eff6ff;
      border-color: #0F3D63;
      color: #0F3D63;
    }

    /* Table */
    .clean-table {
      font-size: 0.88rem;
    }
    .clean-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .clean-table td {
      padding: 0.95rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .clean-table tbody tr:hover {
      background-color: #f8fafc;
    }

    /* Badges & Status */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 16px;
      font-size: 0.74rem;
      font-weight: 600;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-paid { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .status-paid .status-dot { background: #10b981; }
    .status-verified { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .status-verified .status-dot { background: #3b82f6; }
    .status-pending { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .status-pending .status-dot { background: #f59e0b; }

    /* Category badge classes */
    .badge-tailoring { background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .badge-ration { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-medical { background: #fee2e2; color: #b91c1c; border: 1px solid #fecdd3; }
    .badge-monthly { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-default { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* Pagination */
    .page-nav-btn {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .page-nav-btn:hover:not(:disabled) {
      background: #eff6ff;
      border-color: #0F3D63;
      color: #0F3D63;
    }
    .page-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      background: #f8fafc;
    }
    .page-num-btn {
      min-width: 32px;
      height: 32px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #334155;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .page-num-btn:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .page-num-btn.active-page {
      background: #0F3D63;
      color: #ffffff;
      border-color: #0F3D63;
    }
    .spin-icon {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ExpensesComponent implements OnInit {
  isLoading = signal(true);
  isSubmitting = signal(false);

  expenses = signal<Expense[]>([]);
  summary = signal<ExpenseSummary>({
    overall_total: 0,
    tailoring_total: 0,
    ration_kit_total: 0,
    monthly_ration_kit_total: 0,
    current_month_total: 0,
    total_count: 0
  });

  // Filter signals
  selectedCategory = signal<string>('all');
  searchQuery = '';
  fromDate = '';
  toDate = '';
  selectedMethod = 'all';
  selectedStatus = 'all';

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(1);

  // Modals
  showFormModal = signal(false);
  isEditing = signal(false);
  selectedExpense: Expense | null = null;

  showVoucherModal = signal(false);
  activeVoucher = signal<Expense | null>(null);

  showViewModal = signal(false);
  activeExpenseView = signal<Expense | null>(null);

  // Custom Category creation in modal
  isCreatingNewCategory = signal(false);
  customCategoryName = '';

  // Dynamic custom categories derived from records
  customCategories = computed(() => {
    const dynamicCats = new Set<string>();
    for (const exp of this.expenses()) {
      if (exp.category) {
        const c = exp.category.trim();
        if (this.isCustomCategory(c)) {
          dynamicCats.add(c);
        }
      }
    }
    return Array.from(dynamicCats);
  });

  // Alerts
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Form Data
  formData = {
    title: '',
    category: 'Tailoring',
    amount: null as number | null,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    vendor_payee: '',
    voucher_number: '',
    status: 'Paid',
    notes: '',
    receipt_url: ''
  };

  selectedFile: File | null = null;

  // Search debounce timer
  private searchTimer: any;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  refreshAll(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.isLoading.set(true);
    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize()
    };

    if (this.selectedCategory() && this.selectedCategory() !== 'all') {
      params.category = this.selectedCategory();
    }
    if (this.searchQuery && this.searchQuery.trim()) {
      params.search = this.searchQuery.trim();
    }
    if (this.fromDate) {
      params.from_date = this.fromDate;
    }
    if (this.toDate) {
      params.to_date = this.toDate;
    }
    if (this.selectedMethod && this.selectedMethod !== 'all') {
      params.payment_method = this.selectedMethod;
    }
    if (this.selectedStatus && this.selectedStatus !== 'all') {
      params.status = this.selectedStatus;
    }

    this.apiService.getExpenses(params).subscribe({
      next: (res) => {
        this.expenses.set(res.data || []);
        if (res.summary) {
          this.summary.set(res.summary);
        }
        if (res.pagination) {
          this.totalRecords.set(res.pagination.total);
          this.totalPages.set(res.pagination.totalPages);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load expenses: ' + (err.error?.message || err.message));
        this.isLoading.set(false);
      }
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loadExpenses();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.loadExpenses();
    }, 350);
  }

  onDateChange(): void {
    this.currentPage.set(1);
    this.loadExpenses();
  }

  clearDates(): void {
    this.fromDate = '';
    this.toDate = '';
    this.currentPage.set(1);
    this.loadExpenses();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadExpenses();
  }

  resetFilters(): void {
    this.selectedCategory.set('all');
    this.searchQuery = '';
    this.fromDate = '';
    this.toDate = '';
    this.selectedMethod = 'all';
    this.selectedStatus = 'all';
    this.currentPage.set(1);
    this.loadExpenses();
  }

  hasActiveFilters(): boolean {
    return this.selectedCategory() !== 'all' ||
      !!this.searchQuery.trim() ||
      !!this.fromDate ||
      !!this.toDate ||
      this.selectedMethod !== 'all' ||
      this.selectedStatus !== 'all';
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadExpenses();
      this.scrollToTop();
    }
  }

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const pageBody = document.querySelector('.page-body');
    if (pageBody) {
      pageBody.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Form Modal Handlers
  openAddModal(): void {
    this.isEditing.set(false);
    this.selectedExpense = null;
    this.selectedFile = null;
    this.isCreatingNewCategory.set(false);
    this.customCategoryName = '';
    const cat = (this.selectedCategory() !== 'all' && this.selectedCategory() !== 'All') ? this.selectedCategory() : 'Tailoring Class';
    this.formData = {
      title: '',
      category: cat,
      amount: null,
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      vendor_payee: '',
      voucher_number: '',
      status: 'Paid',
      notes: '',
      receipt_url: ''
    };
    this.showFormModal.set(true);
  }

  openEditModal(item: Expense): void {
    this.isEditing.set(true);
    this.selectedExpense = item;
    this.selectedFile = null;
    const cat = item.category || 'Tailoring Class';
    const isCustom = this.isCustomCategory(cat);
    this.isCreatingNewCategory.set(isCustom);
    this.customCategoryName = isCustom ? cat : '';
    const dateStr = item.expense_date ? item.expense_date.split('T')[0] : new Date().toISOString().split('T')[0];
    this.formData = {
      title: item.title,
      category: cat,
      amount: item.amount,
      expense_date: dateStr,
      payment_method: item.payment_method || 'Cash',
      vendor_payee: item.vendor_payee || '',
      voucher_number: item.voucher_number || '',
      status: item.status || 'Paid',
      notes: item.notes || '',
      receipt_url: item.receipt_url || ''
    };
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedExpense = null;
    this.selectedFile = null;
    this.isCreatingNewCategory.set(false);
    this.customCategoryName = '';
  }

  // View Details Modal Handlers
  viewExpense(item: Expense): void {
    this.activeExpenseView.set(item);
    this.showViewModal.set(true);
  }

  printFromViewModal(): void {
    if (this.activeExpenseView()) {
      const exp = this.activeExpenseView()!;
      this.showViewModal.set(false);
      this.viewVoucher(exp);
    }
  }

  editFromViewModal(): void {
    if (this.activeExpenseView()) {
      const exp = this.activeExpenseView()!;
      this.showViewModal.set(false);
      this.openEditModal(exp);
    }
  }

  // Category Selection & Creation in Modal
  toggleNewCategoryMode(): void {
    const nextState = !this.isCreatingNewCategory();
    this.isCreatingNewCategory.set(nextState);
    if (nextState) {
      this.formData.category = this.customCategoryName.trim() || '';
    } else {
      this.formData.category = 'Tailoring Class';
    }
  }

  onCustomCategoryChange(): void {
    this.formData.category = this.customCategoryName.trim();
  }

  selectCategory(category: string): void {
    this.isCreatingNewCategory.set(false);
    this.customCategoryName = '';
    this.formData.category = category;
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  saveExpense(): void {
    if (!this.formData.title.trim() || !this.formData.category.trim() || !this.formData.amount || !this.formData.expense_date) {
      this.errorMessage.set('Please fill out Title, Category, Amount, and Date.');
      return;
    }

    this.isSubmitting.set(true);

    if (this.isEditing() && this.selectedExpense) {
      this.apiService.updateExpense(this.selectedExpense.id, this.formData, this.selectedFile || undefined).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.successMessage.set(res.message || 'Expense updated successfully.');
          this.loadExpenses();
          setTimeout(() => this.successMessage.set(null), 5000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update expense record.');
        }
      });
    } else {
      this.apiService.createExpense(this.formData, this.selectedFile || undefined).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.successMessage.set(res.message || 'Expense record saved successfully.');
          this.loadExpenses();
          setTimeout(() => this.successMessage.set(null), 5000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to record expense.');
        }
      });
    }
  }

  deleteExpense(item: Expense): void {
    const name = item.voucher_number || item.title;
    if (confirm(`Are you sure you want to permanently delete expense record "${name}" of ₹${item.amount}?`)) {
      this.apiService.deleteExpense(item.id).subscribe({
        next: () => {
          this.successMessage.set(`Expense record removed.`);
          this.loadExpenses();
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Failed to delete expense record.');
        }
      });
    }
  }

  viewVoucher(item: Expense): void {
    this.activeVoucher.set(item);
    this.showVoucherModal.set(true);
  }

  printVoucher(): void {
    window.print();
  }

  // Export CSV Helper
  exportToCSV(): void {
    const data = this.expenses();
    if (data.length === 0) return;

    const headers = ['Voucher Number', 'Date', 'Category', 'Title', 'Amount (INR)', 'Payment Method', 'Paid To / Vendor', 'Status', 'Notes'];
    const rows = data.map(e => [
      `"${e.voucher_number || ('EXP-' + e.id)}"`,
      `"${e.expense_date ? e.expense_date.split('T')[0] : ''}"`,
      `"${e.category || ''}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.amount || 0}"`,
      `"${e.payment_method || ''}"`,
      `"${(e.vendor_payee || '').replace(/"/g, '""')}"`,
      `"${e.status || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ar_Rahman_Trust_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Badge & Icon Helpers
  getCategoryBadgeClass(category: string): string {
    const c = (category || '').toLowerCase();
    if (c.includes('tailor')) return 'badge-tailoring';
    if (c.includes('medic') || c.includes('health')) return 'badge-medical';
    if (c.includes('monthly') && c.includes('ration')) return 'badge-medical';
    if (c.includes('ration')) return 'badge-ration';
    return 'badge-default';
  }

  getCategoryIcon(category: string): string {
    const c = (category || '').toLowerCase();
    if (c.includes('tailor')) return 'bi-scissors';
    if (c.includes('medic') || c.includes('health')) return 'bi-heart-pulse-fill text-danger';
    if (c.includes('monthly') && c.includes('ration')) return 'bi-heart-pulse-fill text-danger';
    if (c.includes('ration')) return 'bi-box2-heart text-success';
    return 'bi-tag-fill';
  }

  getStatusPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'verified') return 'status-verified';
    if (s === 'pending') return 'status-pending';
    return 'status-paid';
  }

  getMethodIcon(method: string): string {
    const m = (method || '').toLowerCase();
    if (m === 'upi') return 'bi-phone text-primary me-1';
    if (m.includes('bank') || m.includes('transfer')) return 'bi-bank text-info me-1';
    if (m === 'cheque') return 'bi-card-heading text-secondary me-1';
    return 'bi-cash me-1';
  }

  // ImageKit Category Folder Helpers
  getFolderSlug(category: string): string {
    if (!category) return 'general';
    const c = category.toLowerCase().trim();
    if (c.includes('tailor')) return 'tailoring-class';
    if (c.includes('medic') || c.includes('health')) return 'medical-aid';
    if (c.includes('ration')) return 'ration-kit';
    const slug = c.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'general';
  }

  isCustomCategory(category: string): boolean {
    if (!category) return false;
    const c = category.toLowerCase().trim();
    return !c.includes('tailor') && !c.includes('medic') && !c.includes('health') && !c.includes('ration');
  }
}
