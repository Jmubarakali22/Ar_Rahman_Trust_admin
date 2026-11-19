import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TailoringStudent, StudentStats } from '../../core/models/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="students-page">
      <!-- Page Header -->
      <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <div class="d-flex align-items-center gap-2">
            <h2 class="h4 fw-bold mb-0" style="color: #0F3D63;">Tailoring Students</h2>
            <span class="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold" style="font-size: 11px; background: #e0f2fe; color: #0369a1;">
              {{ filteredStudents().length }} Students
            </span>
          </div>
          <p class="text-muted small mb-0 mt-1">
            Review student applications from Google Form, select candidates, and manage training batches.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Quick Sync from Google Sheet if URL exists -->
          @if (googleSheetUrl) {
            <button 
              type="button" 
              class="btn btn-success btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs fw-semibold"
              [disabled]="isSyncingSheet"
              (click)="syncFromGoogleSheet()"
              title="Sync latest responses from Google Sheet"
            >
              <i class="bi bi-arrow-repeat" [class.spin-icon]="isSyncingSheet"></i>
              <span>{{ isSyncingSheet ? 'Syncing...' : 'Sync Google Sheet' }}</span>
            </button>
          }

          <!-- Connect Google Form Modal Trigger -->
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs fw-semibold"
            (click)="showWebhookModal = true"
            title="Connect Google Form & Sync Sheet"
          >
            <i class="bi bi-google text-danger"></i>
            <span>Connect Google Form</span>
          </button>

          <!-- Export CSV -->
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5"
            (click)="exportToCSV()"
            [disabled]="filteredStudents().length === 0"
            title="Export filtered students list"
          >
            <i class="bi bi-download"></i>
            <span>Export CSV</span>
          </button>

          <!-- Refresh -->
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5"
            (click)="loadStudents()"
            [disabled]="isLoading()"
            title="Reload student records"
          >
            <i class="bi bi-arrow-clockwise" [class.spin-icon]="isLoading()"></i>
            <span>Refresh</span>
          </button>

          <!-- Add Manual Student (Super Admin Only) -->
          @if (isSuperAdmin()) {
            <button 
              type="button" 
              class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold"
              (click)="openAddModal()"
            >
              <i class="bi bi-person-plus-fill"></i>
              <span>Add Student</span>
            </button>
          }
        </div>
      </div>

      <!-- Tailoring Class Staff Role Info Banner -->
      @if (!isSuperAdmin()) {
        <div class="alert bg-white border border-primary-subtle shadow-xs rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2.5">
            <div class="avatar-circle bg-primary-subtle text-primary" style="width: 36px; height: 36px; font-size: 14px;">
              <i class="bi bi-person-badge-fill"></i>
            </div>
            <div>
              <div class="fw-bold small text-navy">Tailoring Class Staff Access</div>
              <div class="text-secondary small" style="font-size: 11px;">
                You can view complete student details, create/connect Google Forms, sync & refresh student applications from Google Sheets, and assign selected students to their <strong>Batch Number</strong> and <strong>Batch Timing</strong>. Student selection, details editing, and deletion are managed by the Super Admin.
              </div>
            </div>
          </div>
          <span class="badge bg-primary text-white rounded-pill px-2.5 py-1 small">
            <i class="bi bi-shield-check me-1"></i> Class Operations & Sync
          </span>
        </div>
      }

      <!-- Metric Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="metric-card bg-white p-3 rounded-3 border shadow-xs d-flex align-items-center gap-3">
            <div class="metric-icon-box bg-primary-subtle text-primary rounded-3 p-2.5">
              <i class="bi bi-people-fill fs-4"></i>
            </div>
            <div>
              <div class="text-muted small fw-medium">Total Applicants</div>
              <div class="fs-4 fw-bold text-dark">{{ stats().total }}</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="metric-card bg-white p-3 rounded-3 border shadow-xs d-flex align-items-center gap-3 border-success-subtle">
            <div class="metric-icon-box bg-success-subtle text-success rounded-3 p-2.5">
              <i class="bi bi-person-check-fill fs-4"></i>
            </div>
            <div>
              <div class="text-muted small fw-medium">Selected Students</div>
              <div class="fs-4 fw-bold text-success">{{ stats().selected }}</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="metric-card bg-white p-3 rounded-3 border shadow-xs d-flex align-items-center gap-3">
            <div class="metric-icon-box bg-info-subtle text-info rounded-3 p-2.5">
              <i class="bi bi-mortarboard-fill fs-4"></i>
            </div>
            <div>
              <div class="text-muted small fw-medium">In Training</div>
              <div class="fs-4 fw-bold text-info">{{ stats().in_training }}</div>
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="metric-card bg-white p-3 rounded-3 border shadow-xs d-flex align-items-center gap-3">
            <div class="metric-icon-box bg-warning-subtle text-warning rounded-3 p-2.5">
              <i class="bi bi-clock-history fs-4"></i>
            </div>
            <div>
              <div class="text-muted small fw-medium">Pending Review</div>
              <div class="fs-4 fw-bold text-warning">{{ stats().applied }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="admin-card p-3 mb-4 bg-white border rounded-3 shadow-xs">
        <div class="row g-2 align-items-center">
          <!-- Status Tabs -->
          <div class="col-12 col-lg-7">
            <div class="d-flex flex-wrap gap-1.5 status-pills">
              <button 
                type="button" 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium"
                [class.btn-primary]="selectedStatus() === 'all'"
                [class.btn-light]="selectedStatus() !== 'all'"
                (click)="setStatusFilter('all')"
              >
                All ({{ stats().total }})
              </button>

              <button 
                type="button" 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium"
                [class.btn-warning]="selectedStatus() === 'applied'"
                [class.btn-light]="selectedStatus() !== 'applied'"
                (click)="setStatusFilter('applied')"
              >
                Pending ({{ stats().applied }})
              </button>

              <button 
                type="button" 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium"
                [class.btn-success]="selectedStatus() === 'selected'"
                [class.btn-light]="selectedStatus() !== 'selected'"
                (click)="setStatusFilter('selected')"
              >
                Selected ({{ stats().selected }})
              </button>

              <button 
                type="button" 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium"
                [class.btn-info]="selectedStatus() === 'in_training'"
                [class.btn-light]="selectedStatus() !== 'in_training'"
                (click)="setStatusFilter('in_training')"
              >
                In Training ({{ stats().in_training }})
              </button>

              <button 
                type="button" 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium"
                [class.btn-purple]="selectedStatus() === 'completed'"
                [class.btn-light]="selectedStatus() !== 'completed'"
                (click)="setStatusFilter('completed')"
              >
                Completed ({{ stats().completed }})
              </button>
            </div>
          </div>

          <!-- Batch & Search -->
          <div class="col-12 col-lg-5">
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm rounded-pill" style="max-width: 150px;" [(ngModel)]="selectedBatch">
                <option value="all">All Batches</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>

              <div class="input-group input-group-sm">
                <span class="input-group-text bg-white border-end-0 rounded-start-pill"><i class="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  class="form-control border-start-0 rounded-end-pill" 
                  placeholder="Search name, phone, code, village..."
                  [(ngModel)]="searchQuery"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Students Table -->
      <div class="admin-card bg-white border rounded-3 shadow-xs overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0" style="min-width: 860px;">
            <thead class="bg-light table-light">
              <tr class="small text-uppercase text-secondary" style="font-size: 11px; letter-spacing: 0.5px;">
                <th class="ps-3 py-3">Code / Date</th>
                <th>Student Details</th>
                <th>Contact</th>
                <th>Family & Background</th>
                <th>Aadhar Card</th>
                <th>Assigned Batch</th>
                <th>Status</th>
                <th class="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                <tr>
                  <td colspan="8" class="text-center py-5">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span class="text-muted small">Loading tailoring students...</span>
                  </td>
                </tr>
              } @else if (filteredStudents().length === 0) {
                <tr>
                  <td colspan="8" class="text-center py-5">
                    <div class="text-muted">
                      <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      <div class="fw-semibold">No students found</div>
                      <p class="small text-muted mb-3">No student applications match the selected status or search term.</p>
                      <button type="button" class="btn btn-sm btn-outline-primary rounded-pill px-3" (click)="openAddModal()">
                        <i class="bi bi-plus-circle me-1"></i> Add Student Manually
                      </button>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (student of filteredStudents(); track student.id) {
                  <tr>
                    <!-- Code & Date -->
                    <td class="ps-3">
                      <span 
                        class="badge bg-light text-dark border font-monospace px-2 py-1 student-code-badge" 
                        style="font-size: 11px;"
                        (click)="openViewModal(student)"
                        title="Click to view complete student details"
                      >
                        {{ student.student_code || ('#' + student.id) }}
                      </span>
                      <div class="text-muted mt-1" style="font-size: 11px;">
                        {{ student.created_at | date:'dd MMM yyyy' }}
                      </div>
                    </td>

                    <!-- Student Details -->
                    <td>
                      <div 
                        class="fw-semibold text-dark student-name-link" 
                        (click)="openViewModal(student)"
                        role="button"
                        title="Click to view complete student details"
                      >
                        {{ student.full_name }}
                      </div>
                      <div class="small text-muted d-flex flex-wrap align-items-center gap-1.5 mt-0.5">
                        <span *ngIf="student.dob"><i class="bi bi-calendar-event me-0.5"></i> {{ student.dob }}</span>
                        <span *ngIf="getStudentAge(student) as age" class="fw-semibold text-primary">({{ age }} yrs)</span>
                        <span *ngIf="student.marital_status" class="badge bg-light text-secondary border py-0.5 px-1.5" style="font-size: 10px;">{{ student.marital_status }}</span>
                      </div>
                      <div *ngIf="student.address" class="text-muted small mt-0.5" style="font-size: 11px;">
                        <i class="bi bi-geo-alt text-danger"></i> {{ student.address }}
                      </div>
                    </td>

                    <!-- Contact -->
                    <td>
                      <div class="small fw-semibold text-dark">{{ student.phone }}</div>
                      <div *ngIf="student.email" class="text-muted" style="font-size: 11px;">{{ student.email }}</div>
                    </td>

                    <!-- Family & Background -->
                    <td>
                      <div class="small">
                        <div *ngIf="student.father_name" class="text-dark">
                          <span class="text-muted">F:</span> {{ student.father_name }}
                        </div>
                        <div *ngIf="student.mother_name" class="text-dark">
                          <span class="text-muted">M:</span> {{ student.mother_name }}
                        </div>
                        <div *ngIf="student.spouse_name" class="text-dark">
                          <span class="text-muted">Spouse:</span> {{ student.spouse_name }}
                        </div>
                        <div *ngIf="student.father_spouse_occupation" class="text-primary mt-0.5 fw-medium" style="font-size: 11px;">
                          <i class="bi bi-briefcase me-0.5"></i> {{ student.father_spouse_occupation }}
                        </div>
                        <span *ngIf="!student.father_name && !student.mother_name && !student.spouse_name && !student.father_spouse_occupation" class="text-muted fst-italic" style="font-size: 11px;">
                          -
                        </span>
                      </div>
                    </td>

                    <!-- Aadhar Card Document Link -->
                    <td>
                      @if (student.aadhar_card_url) {
                        <a 
                          [href]="student.aadhar_card_url" 
                          target="_blank" 
                          class="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 shadow-2xs fw-semibold" 
                          style="font-size: 11px;"
                          title="Open Aadhar Card Document in new tab"
                        >
                          <i class="bi bi-file-earmark-person-fill text-danger"></i>
                          <span>View Aadhar</span>
                          <i class="bi bi-box-arrow-up-right" style="font-size: 9px;"></i>
                        </a>
                      } @else {
                        <span class="text-muted small" style="font-size: 11px;">Not uploaded</span>
                      }
                    </td>

                    <!-- Assigned Batch -->
                    <td>
                      @if (student.batch_number) {
                        <div class="d-flex flex-column gap-1">
                          <span class="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-semibold align-self-start" style="font-size: 11px;">
                            <i class="bi bi-tag-fill me-1"></i> {{ student.batch_number }}
                          </span>
                          <span class="small text-dark fw-medium" style="font-size: 11px;">
                            <i class="bi bi-clock me-1 text-secondary"></i> {{ student.batch_timing || student.batch_preference || 'Morning' }}
                          </span>
                        </div>
                      } @else {
                        <div class="d-flex flex-column gap-0.5">
                          <span class="badge bg-light text-secondary border rounded-pill px-2 py-0.5 small align-self-start" style="font-size: 10px;">
                            Not Assigned
                          </span>
                          <span class="text-muted small" style="font-size: 11px;">
                            Pref: {{ student.batch_preference || 'Morning' }}
                          </span>
                        </div>
                      }
                    </td>

                    <!-- Status -->
                    <td>
                      @if (student.status === 'applied') {
                        <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2.5 py-1">
                          <i class="bi bi-clock me-1"></i> Pending
                        </span>
                      } @else if (student.status === 'selected') {
                        <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1">
                          <i class="bi bi-check-circle-fill me-1"></i> Selected
                        </span>
                      } @else if (student.status === 'in_training') {
                        <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1">
                          <i class="bi bi-mortarboard me-1"></i> In Training
                        </span>
                      } @else if (student.status === 'completed') {
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1">
                          <i class="bi bi-award-fill me-1"></i> Completed
                        </span>
                      } @else if (student.status === 'rejected') {
                        <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1">
                          Rejected
                        </span>
                      }
                    </td>

                    <!-- Actions -->
                    <td class="text-end pe-3">
                      <div class="d-inline-flex align-items-center gap-1">
                        <!-- VIEW STUDENT DETAILS (For Both Tailoring Staff & Admin) -->
                        <button 
                          type="button" 
                          class="btn btn-sm btn-light border text-primary rounded-circle p-1.5 action-view-btn"
                          (click)="openViewModal(student)"
                          title="View Full Student Details"
                        >
                          <i class="bi bi-eye-fill"></i>
                        </button>

                        <!-- ASSIGN BATCH BUTTON: For Tailoring Class Staff and Super Admin -->
                        @if (student.status === 'selected' || student.status === 'in_training' || isSuperAdmin()) {
                          <button 
                            type="button" 
                            class="btn btn-sm btn-primary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs fw-semibold"
                            (click)="openAssignBatchModal(student)"
                            [title]="student.batch_number ? 'Update Assigned Batch Number & Timing' : 'Assign to Batch Number & Timing'"
                          >
                            <i class="bi bi-clock-history"></i>
                            <span class="d-none d-md-inline">{{ student.batch_number ? 'Update Batch' : 'Assign Batch' }}</span>
                          </button>
                        }

                        <!-- Tailoring Class Staff notice when student is waiting for Super Admin selection -->
                        @if (!isSuperAdmin() && student.status === 'applied') {
                          <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-1 small" title="Super Admin must select this student before batch assignment">
                            <i class="bi bi-hourglass-split me-1"></i> Awaiting Selection
                          </span>
                        }

                        <!-- SUPER ADMIN ONLY: 1-Click "Select" Button if applied -->
                        @if (isSuperAdmin() && student.status === 'applied') {
                          <button 
                            type="button" 
                            class="btn btn-sm btn-success rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs fw-semibold"
                            (click)="quickSelectStudent(student)"
                            title="Super Admin: Mark Student as Selected"
                          >
                            <i class="bi bi-check-lg"></i>
                            <span>Select</span>
                          </button>
                        }

                        <!-- SUPER ADMIN ONLY: Change Status Dropdown -->
                        @if (isSuperAdmin()) {
                          <div class="dropdown d-inline-block">
                            <button 
                              type="button" 
                              class="btn btn-sm btn-light border rounded-circle p-1.5" 
                              data-bs-toggle="dropdown"
                              title="Super Admin: Change Status"
                            >
                              <i class="bi bi-arrow-repeat"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                              <li><h6 class="dropdown-header small text-uppercase">Update Status (Super Admin)</h6></li>
                              <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'selected')"><i class="bi bi-check-circle text-success me-2"></i> Mark as Selected</button></li>
                              <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'in_training')"><i class="bi bi-mortarboard text-info me-2"></i> Mark In Training</button></li>
                              <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'completed')"><i class="bi bi-award text-primary me-2"></i> Mark Completed / Graduated</button></li>
                              <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'applied')"><i class="bi bi-clock text-warning me-2"></i> Reset to Pending</button></li>
                              <li><hr class="dropdown-divider"></li>
                              <li><button class="dropdown-item small text-danger" (click)="updateStatus(student.id, 'rejected')"><i class="bi bi-x-circle me-2"></i> Reject</button></li>
                            </ul>
                          </div>
                        }

                        <!-- SUPER ADMIN ONLY: Edit Details -->
                        @if (isSuperAdmin()) {
                          <button 
                            type="button" 
                            class="btn btn-sm btn-light border rounded-circle p-1.5"
                            (click)="openEditModal(student)"
                            title="Super Admin: Edit Student Details"
                          >
                            <i class="bi bi-pencil-fill text-muted"></i>
                          </button>
                        }

                        <!-- SUPER ADMIN ONLY: Delete -->
                        @if (isSuperAdmin()) {
                          <button 
                            type="button" 
                            class="btn btn-sm btn-light border rounded-circle p-1.5"
                            (click)="deleteStudent(student)"
                            title="Super Admin: Delete Student"
                          >
                            <i class="bi bi-trash-fill text-danger"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- ADD / EDIT MODAL -->
      <div class="modal fade" [class.show]="showFormModal" [style.display]="showFormModal ? 'block' : 'none'" tabindex="-1" *ngIf="showFormModal">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow-lg rounded-4">
            <div class="modal-header border-bottom px-4 py-3 bg-light">
              <h5 class="modal-title fw-bold" style="color: #0F3D63;">
                <i class="bi bi-person-fill-gear me-2"></i>
                {{ isEditing ? 'Edit Tailoring Student' : 'Add New Tailoring Student' }}
              </h5>
              <button type="button" class="btn-close" (click)="showFormModal = false"></button>
            </div>
            
            <div class="modal-body p-4">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Student Full Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.full_name" placeholder="e.g. Sameeha">
                </div>

                <div class="col-md-6">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <label class="form-label small fw-semibold text-secondary mb-0">Date of Birth (DOB)</label>
                    <span *ngIf="calculateAge(studentForm.dob) as currentAge" class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size: 11px;">
                      <i class="bi bi-clock-history me-1"></i> Current Age: {{ currentAge }} yrs
                    </span>
                  </div>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.dob" (input)="onDobChange()" (blur)="onDobChange()" placeholder="e.g. 16/04/2002">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Mobile Number *</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.phone" placeholder="e.g. 6655778899">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Email Address</label>
                  <input type="email" class="form-control" [(ngModel)]="studentForm.email" placeholder="e.g. sameeha@gmail.com">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Marital Status</label>
                  <select class="form-select" [(ngModel)]="studentForm.marital_status">
                    <option value="">Select Marital Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Age</label>
                  <input type="number" class="form-control" [(ngModel)]="studentForm.age" placeholder="Auto-calculated from DOB or enter age">
                </div>

                <div class="col-md-4">
                  <label class="form-label small fw-semibold text-secondary">Father Name</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.father_name" placeholder="Father's full name">
                </div>

                <div class="col-md-4">
                  <label class="form-label small fw-semibold text-secondary">Mother Name</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.mother_name" placeholder="Mother's full name">
                </div>

                <div class="col-md-4">
                  <label class="form-label small fw-semibold text-secondary">Spouse Name</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.spouse_name" placeholder="Husband / Spouse name">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Father / Spouse Occupation</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.father_spouse_occupation" placeholder="e.g. Coolie, Daily Wage, Tailor">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Preferred Batch</label>
                  <select class="form-select" [(ngModel)]="studentForm.batch_preference">
                    <option value="Morning">Morning Batch (9:30 AM - 12:30 PM)</option>
                    <option value="Afternoon">Afternoon Batch (2:00 PM - 5:00 PM)</option>
                    <option value="Evening">Evening Batch (5:00 PM - 7:00 PM)</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label small fw-semibold text-secondary">Aadhar Card Document Link (Google Drive / URL)</label>
                  <div class="input-group">
                    <span class="input-group-text bg-light"><i class="bi bi-file-earmark-person text-danger"></i></span>
                    <input type="text" class="form-control" [(ngModel)]="studentForm.aadhar_card_url" placeholder="https://drive.google.com/open?id=...">
                    <a *ngIf="studentForm.aadhar_card_url" [href]="studentForm.aadhar_card_url" target="_blank" class="btn btn-outline-secondary">
                      <i class="bi bi-box-arrow-up-right"></i> Open Link
                    </a>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Assigned Batch Number</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.batch_number" placeholder="e.g. Batch 1, Batch 2">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Assigned Batch Timing</label>
                  <select class="form-select" [(ngModel)]="studentForm.batch_timing">
                    <option value="">-- Match Preferred Timing --</option>
                    <option value="Morning (9:30 AM - 12:30 PM)">Morning (9:30 AM - 12:30 PM)</option>
                    <option value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</option>
                    <option value="Evening (5:00 PM - 7:00 PM)">Evening (5:00 PM - 7:00 PM)</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Status</label>
                  <select class="form-select" [(ngModel)]="studentForm.status">
                    <option value="applied">Applied (Pending Review)</option>
                    <option value="selected">Selected for Batch</option>
                    <option value="in_training">In Training</option>
                    <option value="completed">Completed / Graduated</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Residential Address / Village</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.address" placeholder="e.g. Small Mosque Street, Pernambut">
                </div>

                <div class="col-12">
                  <label class="form-label small fw-semibold text-secondary">Admin Notes / Remarks</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="studentForm.notes" placeholder="Interview remarks, attendance notes, machine assignment..."></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer border-top px-4 py-3 bg-light">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" (click)="showFormModal = false">Cancel</button>
              <button 
                type="button" 
                class="btn btn-trust-primary rounded-pill px-4 fw-semibold"
                [disabled]="isSaving || !studentForm.full_name || !studentForm.phone"
                (click)="saveStudent()"
              >
                <i class="bi bi-check-circle me-1" *ngIf="!isSaving"></i>
                <span class="spinner-border spinner-border-sm me-1" *ngIf="isSaving"></span>
                <span>{{ isEditing ? 'Save Changes' : 'Register Student' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showFormModal"></div>

      <!-- ASSIGN BATCH MODAL (FOR TAILORING CLASS STAFF & SUPER ADMIN) -->
      <div class="modal fade" [class.show]="showAssignBatchModal" [style.display]="showAssignBatchModal ? 'block' : 'none'" tabindex="-1" *ngIf="showAssignBatchModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="modal-header border-bottom px-4 py-3 bg-light">
              <div class="d-flex align-items-center gap-2">
                <div class="avatar-circle bg-primary text-white" style="width: 36px; height: 36px; font-size: 14px;">
                  <i class="bi bi-clock-history"></i>
                </div>
                <div>
                  <h5 class="modal-title fw-bold text-navy mb-0">Assign Student to Batch</h5>
                  <div class="text-muted small" style="font-size: 11px;">Cohort Allocation & Training Schedule</div>
                </div>
              </div>
              <button type="button" class="btn-close" (click)="showAssignBatchModal = false"></button>
            </div>

            <div class="modal-body p-4" *ngIf="selectedStudentForBatch">
              <!-- Student Summary Card -->
              <div class="p-3 bg-light rounded-3 mb-3 border">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1.5">
                  <div class="fw-bold text-dark fs-6">{{ selectedStudentForBatch.full_name }}</div>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1">
                    {{ selectedStudentForBatch.student_code || '#' + selectedStudentForBatch.id }}
                  </span>
                </div>
                <div class="small text-muted d-flex flex-wrap gap-3" style="font-size: 12px;">
                  <span><i class="bi bi-telephone text-success me-1"></i> {{ selectedStudentForBatch.phone }}</span>
                  <span *ngIf="selectedStudentForBatch.dob"><i class="bi bi-calendar-event text-primary me-1"></i> DOB: {{ selectedStudentForBatch.dob }}</span>
                  <span><i class="bi bi-bookmark-star text-warning me-1"></i> Pref: {{ selectedStudentForBatch.batch_preference || 'Morning' }}</span>
                </div>
              </div>

              <!-- Batch Number / Cohort Selection -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">
                  Batch Number / Cohort <span class="text-danger">*</span>
                </label>
                <div class="input-group mb-1.5">
                  <span class="input-group-text bg-light"><i class="bi bi-tag-fill text-primary"></i></span>
                  <select class="form-select" [(ngModel)]="assignBatchForm.batch_number">
                    <option value="">-- Choose Batch Number --</option>
                    <option value="Batch 1">Batch 1</option>
                    <option value="Batch 2">Batch 2</option>
                    <option value="Batch 3">Batch 3</option>
                    <option value="Batch 4">Batch 4</option>
                    <option value="Batch 5">Batch 5</option>
                    <option value="Batch 6">Batch 6</option>
                    <option value="custom">Other / Custom Batch Number...</option>
                  </select>
                </div>
                <input 
                  *ngIf="assignBatchForm.batch_number === 'custom' || (!['Batch 1','Batch 2','Batch 3','Batch 4','Batch 5','Batch 6',''].includes(assignBatchForm.batch_number))"
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="customBatchNumber"
                  (ngModelChange)="onCustomBatchChange($event)"
                  placeholder="Enter batch number (e.g. Batch 7 or Cohort 2026-A)"
                >
              </div>

              <!-- Batch Timing Selection -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">
                  Batch Timing <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light"><i class="bi bi-clock-fill text-info"></i></span>
                  <select class="form-select" [(ngModel)]="assignBatchForm.batch_timing">
                    <option value="Morning (9:30 AM - 12:30 PM)">Morning (9:30 AM - 12:30 PM)</option>
                    <option value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</option>
                    <option value="Evening (5:00 PM - 7:00 PM)">Evening (5:00 PM - 7:00 PM)</option>
                  </select>
                </div>
              </div>

              <!-- Training Status -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Training Status</label>
                <select class="form-select" [(ngModel)]="assignBatchForm.status">
                  <option value="in_training">In Training (Active Student)</option>
                  <option value="selected">Selected (Scheduled for Batch)</option>
                  <option value="completed" *ngIf="isSuperAdmin()">Completed / Graduated</option>
                </select>
              </div>

              <!-- Machine / Staff Notes -->
              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Sewing Machine / Instructor Remarks</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="assignBatchForm.notes" 
                  placeholder="e.g. Assigned Machine #3, Instructor: Sis Fatima"
                >
              </div>
            </div>

            <div class="modal-footer border-top px-4 py-3 bg-light">
              <button type="button" class="btn btn-outline-secondary rounded-pill px-4" (click)="showAssignBatchModal = false">Cancel</button>
              <button 
                type="button" 
                class="btn btn-trust-primary rounded-pill px-4 fw-semibold"
                [disabled]="isSavingBatch || !assignBatchForm.batch_number"
                (click)="saveBatchAssignment()"
              >
                <span class="spinner-border spinner-border-sm me-1" *ngIf="isSavingBatch"></span>
                <i class="bi bi-check-circle me-1" *ngIf="!isSavingBatch"></i>
                <span>Save Batch Assignment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showAssignBatchModal"></div>

      <!-- GOOGLE FORM INTEGRATION MODAL -->
      <div class="modal fade" [class.show]="showWebhookModal" [style.display]="showWebhookModal ? 'block' : 'none'" tabindex="-1" *ngIf="showWebhookModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-4">
            <div class="modal-header border-bottom px-4 py-3 bg-light">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-google text-danger fs-5"></i>
                <h5 class="modal-title fw-bold text-navy mb-0">Google Form Integration</h5>
              </div>
              <button type="button" class="btn-close" (click)="showWebhookModal = false"></button>
            </div>

            <div class="modal-body p-4">
              <!-- STEP 1: CREATE GOOGLE FORM -->
              <div class="p-3 bg-light rounded-3 mb-3 border">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <div class="fw-bold text-dark small">
                    <i class="bi bi-plus-circle-fill text-danger me-1"></i> Don't have a Google Form yet?
                  </div>
                  <a 
                    href="https://forms.new" 
                    target="_blank" 
                    class="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                  >
                    <i class="bi bi-box-arrow-up-right"></i>
                    <span>Create Google Form Now</span>
                  </a>
                </div>
                <p class="text-muted small mb-2" style="font-size: 12px;">
                  Click the button above to instantly open a new Google Form in your Google account.
                </p>
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1 border-top">
                  <span class="text-secondary" style="font-size: 11px;">10 Question Fields: Name, DOB, Mobile, Email, Marital Status, Family, Occupation, Aadhar</span>
                  <button type="button" class="btn btn-xs btn-light border py-0.5 px-2 rounded-pill small" style="font-size: 11px;" (click)="copyRecommendedFields()">
                    <i class="bi" [class.bi-check-lg]="copiedType === 'fields'" [class.bi-clipboard]="copiedType !== 'fields'"></i>
                    {{ copiedType === 'fields' ? 'Copied 10 Fields!' : 'Copy 10 Question Names' }}
                  </button>
                </div>
              </div>

              <!-- STEP 2: LINK & SYNC -->
              <div class="p-3 bg-light rounded-3 mb-3 border small">
                <div class="fw-bold text-dark mb-1.5"><i class="bi bi-arrow-repeat text-success me-1"></i> How to Connect Your Form:</div>
                <ol class="mb-0 ps-3 text-muted">
                  <li class="mb-1">In your Google Form, click the <strong>Responses</strong> tab and click the green <strong>"Link to Sheets"</strong> icon.</li>
                  <li class="mb-1">In the opened Google Sheet, click the top-right <strong>Share</strong> button and set to <strong>"Anyone with the link can view"</strong> (Viewer).</li>
                  <li>Copy that Google Sheet URL, paste it below, and click <strong>"Sync Responses"</strong>!</li>
                </ol>
              </div>

              <label class="form-label small fw-semibold text-dark mb-1">Your Google Sheet URL:</label>
              <div class="input-group mb-2">
                <span class="input-group-text bg-white"><i class="bi bi-file-earmark-spreadsheet-fill text-success"></i></span>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="googleSheetUrl" 
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                >
                <button 
                  type="button" 
                  class="btn btn-success d-inline-flex align-items-center gap-1.5 fw-semibold px-3"
                  [disabled]="isSyncingSheet || !googleSheetUrl"
                  (click)="syncFromGoogleSheet()"
                >
                  <i class="bi bi-arrow-repeat" [class.spin-icon]="isSyncingSheet"></i>
                  <span>{{ isSyncingSheet ? 'Syncing...' : 'Sync Responses' }}</span>
                </button>
              </div>

              @if (syncStatusMessage) {
                <div class="alert small py-2 px-3 mt-3 mb-0" [class.alert-success]="syncSuccess" [class.alert-danger]="!syncSuccess">
                  <i class="bi" [class.bi-check-circle-fill]="syncSuccess" [class.bi-exclamation-triangle-fill]="!syncSuccess"></i>
                  {{ syncStatusMessage }}
                </div>
              }
            </div>

            <div class="modal-footer border-top px-4 py-3 bg-light">
              <button type="button" class="btn btn-trust-primary rounded-pill px-4" (click)="showWebhookModal = false">Close</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showWebhookModal"></div>

      <!-- VIEW STUDENT DETAILS MODAL (FOR TAILORING CLASS STAFF & ADMIN) -->
      <div 
        class="modal fade" 
        [class.show]="showViewModal" 
        [style.display]="showViewModal ? 'block' : 'none'" 
        tabindex="-1" 
        *ngIf="showViewModal && viewingStudent"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden" id="printable-student-modal">
            <!-- Modal Header -->
            <div class="modal-header border-bottom px-4 py-3 bg-light text-dark">
              <div class="d-flex align-items-center gap-3">
                <div class="avatar-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center shadow-xs" style="width: 44px; height: 44px; font-size: 18px; border-radius: 50%;">
                  <i class="bi bi-person-fill"></i>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <h5 class="modal-title fw-bold text-navy mb-0" style="color: #0F3D63;">{{ viewingStudent.full_name }}</h5>
                    <span class="badge bg-light text-dark border font-monospace px-2.5 py-1" style="font-size: 11px;">
                      {{ viewingStudent.student_code || ('#' + viewingStudent.id) }}
                    </span>
                    <!-- Status Badge -->
                    @if (viewingStudent.status === 'applied') {
                      <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2.5 py-1 small">
                        <i class="bi bi-clock me-1"></i> Pending Review
                      </span>
                    } @else if (viewingStudent.status === 'selected') {
                      <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 small">
                        <i class="bi bi-check-circle-fill me-1"></i> Selected
                      </span>
                    } @else if (viewingStudent.status === 'in_training') {
                      <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1 small">
                        <i class="bi bi-mortarboard me-1"></i> In Training
                      </span>
                    } @else if (viewingStudent.status === 'completed') {
                      <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 small">
                        <i class="bi bi-award-fill me-1"></i> Completed
                      </span>
                    } @else if (viewingStudent.status === 'rejected') {
                      <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-2.5 py-1 small">
                        Rejected
                      </span>
                    }
                  </div>
                  <div class="text-muted small mt-0.5" style="font-size: 11px;">
                    Registered on {{ viewingStudent.created_at | date:'dd MMM yyyy, hh:mm a' }} &bull; Source: <span class="text-capitalize">{{ (viewingStudent.source || 'Google Form').replace('_', ' ') }}</span>
                  </div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-none d-sm-inline-flex align-items-center gap-1.5 no-print" 
                  (click)="printStudentDetails()" 
                  title="Print student details"
                >
                  <i class="bi bi-printer"></i>
                  <span>Print</span>
                </button>
                <button type="button" class="btn-close no-print" (click)="closeViewModal()"></button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4">
              <!-- Fast Highlights Strip -->
              <div class="row g-2 mb-4">
                <div class="col-6 col-md-3">
                  <div class="p-2.5 bg-light rounded-3 border text-center h-100">
                    <div class="text-muted small fw-medium" style="font-size: 10px; letter-spacing: 0.5px;">PREFERRED BATCH</div>
                    <div class="fw-bold text-dark mt-0.5">{{ viewingStudent.batch_preference || 'Morning' }}</div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="p-2.5 bg-light rounded-3 border text-center h-100">
                    <div class="text-muted small fw-medium" style="font-size: 10px; letter-spacing: 0.5px;">ASSIGNED BATCH</div>
                    <div class="fw-bold mt-0.5" [class.text-primary]="viewingStudent.batch_number" [class.text-secondary]="!viewingStudent.batch_number">
                      {{ viewingStudent.batch_number || 'Not Assigned' }}
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="p-2.5 bg-light rounded-3 border text-center h-100">
                    <div class="text-muted small fw-medium" style="font-size: 10px; letter-spacing: 0.5px;">AGE & DOB</div>
                    <div class="fw-bold text-dark mt-0.5">
                      {{ getStudentAge(viewingStudent) ? (getStudentAge(viewingStudent) + ' yrs') : 'N/A' }}
                      <span *ngIf="viewingStudent.dob" class="text-muted fw-normal small">({{ viewingStudent.dob }})</span>
                    </div>
                  </div>
                </div>
                <div class="col-6 col-md-3">
                  <div class="p-2.5 bg-light rounded-3 border text-center h-100">
                    <div class="text-muted small fw-medium" style="font-size: 10px; letter-spacing: 0.5px;">MOBILE NUMBER</div>
                    <div class="fw-bold text-success mt-0.5">{{ viewingStudent.phone }}</div>
                  </div>
                </div>
              </div>

              <!-- Section 1: Personal & Demographic Information -->
              <div class="card border mb-3 shadow-none rounded-3">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                  <i class="bi bi-person-vcard text-primary"></i>
                  <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px; color: #0F3D63;">Personal & Demographic Information</span>
                </div>
                <div class="card-body p-3">
                  <div class="row g-3">
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">FULL NAME</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.full_name }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">DATE OF BIRTH (DOB)</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.dob || 'Not specified' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">CURRENT AGE</div>
                      <div class="fw-semibold text-dark">
                        {{ getStudentAge(viewingStudent) ? (getStudentAge(viewingStudent) + ' Years') : (viewingStudent.age ? viewingStudent.age + ' Years' : 'Not recorded') }}
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">MARITAL STATUS</div>
                      <div class="fw-semibold text-dark">
                        <span *ngIf="viewingStudent.marital_status" class="badge bg-light text-secondary border px-2 py-0.5">
                          {{ viewingStudent.marital_status }}
                        </span>
                        <span *ngIf="!viewingStudent.marital_status" class="text-muted">Not specified</span>
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">EDUCATIONAL QUALIFICATION</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.qualification || 'Not provided' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">PRIOR TAILORING EXPERIENCE</div>
                      <div class="fw-semibold text-dark">
                        <span class="badge" [class.bg-success-subtle]="viewingStudent.has_prior_experience === 'Yes'" [class.text-success]="viewingStudent.has_prior_experience === 'Yes'" [class.bg-light]="viewingStudent.has_prior_experience !== 'Yes'" [class.text-muted]="viewingStudent.has_prior_experience !== 'Yes'">
                          {{ viewingStudent.has_prior_experience || 'No' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 2: Contact & Address Information -->
              <div class="card border mb-3 shadow-none rounded-3">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                  <i class="bi bi-geo-alt text-danger"></i>
                  <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px; color: #0F3D63;">Contact & Residence</span>
                </div>
                <div class="card-body p-3">
                  <div class="row g-3">
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">MOBILE NUMBER</div>
                      <div class="d-flex align-items-center gap-2 mt-0.5">
                        <span class="fw-semibold text-dark">{{ viewingStudent.phone }}</span>
                        <a [href]="'tel:' + viewingStudent.phone" class="btn btn-xs btn-outline-primary py-0 px-1.5 rounded" title="Call">
                          <i class="bi bi-telephone-fill" style="font-size: 10px;"></i>
                        </a>
                        <button type="button" class="btn btn-xs btn-light border py-0 px-1.5 rounded" (click)="copyToClipboard(viewingStudent.phone, 'view_phone')" title="Copy Phone">
                          <i class="bi" [class.bi-check-lg]="copiedType === 'view_phone'" [class.bi-clipboard]="copiedType !== 'view_phone'" style="font-size: 10px;"></i>
                        </button>
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">WHATSAPP NUMBER</div>
                      <div class="fw-semibold text-dark mt-0.5">
                        {{ viewingStudent.whatsapp_number || viewingStudent.phone }}
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">EMAIL ADDRESS</div>
                      <div class="fw-semibold text-dark mt-0.5">
                        <a *ngIf="viewingStudent.email" [href]="'mailto:' + viewingStudent.email" class="text-decoration-none">
                          {{ viewingStudent.email }}
                        </a>
                        <span *ngIf="!viewingStudent.email" class="text-muted">Not provided</span>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="text-muted small" style="font-size: 11px;">RESIDENTIAL ADDRESS / VILLAGE</div>
                      <div class="fw-medium text-dark mt-0.5">
                        <i class="bi bi-pin-map text-danger me-1"></i>
                        {{ viewingStudent.address || 'Address not recorded' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 3: Family & Background Information -->
              <div class="card border mb-3 shadow-none rounded-3">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                  <i class="bi bi-people text-info"></i>
                  <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px; color: #0F3D63;">Family & Background</span>
                </div>
                <div class="card-body p-3">
                  <div class="row g-3">
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">FATHER'S NAME</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.father_name || '-' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">MOTHER'S NAME</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.mother_name || '-' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">SPOUSE / HUSBAND NAME</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.spouse_name || '-' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4" *ngIf="viewingStudent.guardian_name">
                      <div class="text-muted small" style="font-size: 11px;">GUARDIAN NAME</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.guardian_name }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4">
                      <div class="text-muted small" style="font-size: 11px;">FATHER / SPOUSE OCCUPATION</div>
                      <div class="fw-semibold text-primary">
                        <i class="bi bi-briefcase me-1" *ngIf="viewingStudent.father_spouse_occupation"></i>
                        {{ viewingStudent.father_spouse_occupation || '-' }}
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-4" *ngIf="viewingStudent.family_income">
                      <div class="text-muted small" style="font-size: 11px;">MONTHLY FAMILY INCOME</div>
                      <div class="fw-semibold text-dark">{{ viewingStudent.family_income }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 4: Training, Batch & Allocation Details -->
              <div class="card border mb-3 shadow-none rounded-3">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                  <i class="bi bi-clock-history text-primary"></i>
                  <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px; color: #0F3D63;">Batch Schedule & Class Operations</span>
                </div>
                <div class="card-body p-3">
                  <div class="row g-3">
                    <div class="col-sm-6 col-md-3">
                      <div class="text-muted small" style="font-size: 11px;">PREFERRED BATCH TIMING</div>
                      <div class="fw-semibold text-dark mt-0.5">{{ viewingStudent.batch_preference || 'Morning' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                      <div class="text-muted small" style="font-size: 11px;">ASSIGNED BATCH NUMBER</div>
                      <div class="mt-0.5">
                        <span *ngIf="viewingStudent.batch_number" class="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-semibold">
                          <i class="bi bi-tag-fill me-1"></i> {{ viewingStudent.batch_number }}
                        </span>
                        <span *ngIf="!viewingStudent.batch_number" class="badge bg-light text-secondary border rounded-pill px-2 py-0.5">
                          Not Assigned Yet
                        </span>
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                      <div class="text-muted small" style="font-size: 11px;">ASSIGNED BATCH TIMING</div>
                      <div class="fw-semibold text-dark mt-0.5">
                        <i class="bi bi-clock me-1 text-secondary" *ngIf="viewingStudent.batch_timing"></i>
                        {{ viewingStudent.batch_timing || '-' }}
                      </div>
                    </div>
                    <div class="col-sm-6 col-md-3">
                      <div class="text-muted small" style="font-size: 11px;">CURRENT STATUS</div>
                      <div class="fw-semibold text-dark mt-0.5 text-capitalize">{{ viewingStudent.status.replace('_', ' ') }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4" *ngIf="viewingStudent.selected_date">
                      <div class="text-muted small" style="font-size: 11px;">ADMISSION SELECTED DATE</div>
                      <div class="fw-semibold text-success mt-0.5">{{ viewingStudent.selected_date | date:'dd MMM yyyy, hh:mm a' }}</div>
                    </div>
                    <div class="col-sm-6 col-md-4" *ngIf="viewingStudent.completed_date">
                      <div class="text-muted small" style="font-size: 11px;">COURSE COMPLETED DATE</div>
                      <div class="fw-semibold text-primary mt-0.5">{{ viewingStudent.completed_date | date:'dd MMM yyyy, hh:mm a' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 5: Aadhar Card Document -->
              <div class="card border mb-3 shadow-none rounded-3">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                  <i class="bi bi-file-earmark-person text-danger"></i>
                  <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px; color: #0F3D63;">Identity Document (Aadhar Card)</span>
                </div>
                <div class="card-body p-3">
                  @if (viewingStudent.aadhar_card_url) {
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 bg-light rounded-3 border">
                      <div class="d-flex align-items-center gap-2.5">
                        <i class="bi bi-file-earmark-pdf-fill text-danger fs-2"></i>
                        <div>
                          <div class="fw-bold text-dark small">Aadhar Card Document Link</div>
                          <div class="text-muted text-truncate small" style="max-width: 400px; font-size: 11px;">
                            {{ viewingStudent.aadhar_card_url }}
                          </div>
                        </div>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <button type="button" class="btn btn-sm btn-light border rounded-pill px-3 py-1" (click)="copyToClipboard(viewingStudent.aadhar_card_url, 'view_aadhar')" title="Copy Document Link">
                          <i class="bi" [class.bi-check-lg]="copiedType === 'view_aadhar'" [class.bi-clipboard]="copiedType !== 'view_aadhar'"></i>
                          <span>{{ copiedType === 'view_aadhar' ? 'Copied' : 'Copy Link' }}</span>
                        </button>
                        <a 
                          [href]="viewingStudent.aadhar_card_url" 
                          target="_blank" 
                          class="btn btn-sm btn-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5 shadow-xs fw-semibold"
                        >
                          <i class="bi bi-box-arrow-up-right"></i>
                          <span>Open Document</span>
                        </a>
                      </div>
                    </div>
                  } @else {
                    <div class="p-3 bg-light rounded-3 text-center text-muted small">
                      <i class="bi bi-info-circle me-1"></i> No Aadhar card or identity proof has been uploaded for this student.
                    </div>
                  }
                </div>
              </div>

              <!-- Section 6: Notes & Remarks -->
              <div class="card border mb-0 shadow-none rounded-3">
                <div class="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center gap-2">
                  <i class="bi bi-chat-left-text text-secondary"></i>
                  <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px; color: #0F3D63;">Staff & Admin Remarks</span>
                </div>
                <div class="card-body p-3">
                  <div *ngIf="viewingStudent.notes" class="p-3 bg-light rounded-3 border text-dark small" style="white-space: pre-wrap;">
                    {{ viewingStudent.notes }}
                  </div>
                  <div *ngIf="!viewingStudent.notes" class="text-muted small fst-italic">
                    No notes or remarks entered for this student.
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer border-top px-4 py-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-2 no-print">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-light text-secondary border small py-1 px-2.5">
                  <i class="bi bi-shield-check text-primary me-1"></i> Visible to Tailoring Staff & Admin
                </span>
              </div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <!-- Close Button -->
                <button type="button" class="btn btn-outline-secondary rounded-pill px-3.5 py-1.5 small fw-semibold" (click)="closeViewModal()">
                  Close
                </button>

                <!-- Assign Batch Button (Tailoring Staff & Super Admin) -->
                @if (viewingStudent.status === 'selected' || viewingStudent.status === 'in_training' || isSuperAdmin()) {
                  <button 
                    type="button" 
                    class="btn btn-primary rounded-pill px-3.5 py-1.5 small d-inline-flex align-items-center gap-1.5 shadow-xs fw-semibold"
                    (click)="openAssignBatchFromView()"
                  >
                    <i class="bi bi-clock-history"></i>
                    <span>{{ viewingStudent.batch_number ? 'Update Batch' : 'Assign Batch' }}</span>
                  </button>
                }

                <!-- Edit Student Button (Super Admin Only) -->
                @if (isSuperAdmin()) {
                  <button 
                    type="button" 
                    class="btn btn-trust-primary rounded-pill px-3.5 py-1.5 small d-inline-flex align-items-center gap-1.5 shadow-xs fw-semibold"
                    (click)="openEditFromView()"
                  >
                    <i class="bi bi-pencil-fill"></i>
                    <span>Edit Student</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showViewModal"></div>

    </div>
  `,
  styles: [`
    .students-page {
      padding-bottom: 2rem;
    }
    .metric-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(15, 61, 99, 0.08);
    }
    .metric-icon-box {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-trust-primary {
      background: #0F3D63;
      color: #ffffff;
      border: 1px solid #0F3D63;
    }
    .btn-trust-primary:hover {
      background: #0a2740;
      color: #ffffff;
      border-color: #0a2740;
    }
    .btn-purple {
      background: #8b5cf6;
      color: #ffffff;
      border: 1px solid #8b5cf6;
    }
    .btn-purple:hover {
      background: #7c3aed;
      color: #ffffff;
    }
    .shadow-xs {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .spin-icon {
      display: inline-block;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
    .student-name-link {
      cursor: pointer;
      transition: color 0.15s ease-in-out;
    }
    .student-name-link:hover {
      color: #0d6efd !important;
      text-decoration: underline;
    }
    .student-code-badge {
      cursor: pointer;
      transition: all 0.15s ease-in-out;
    }
    .student-code-badge:hover {
      background-color: #e0f2fe !important;
      border-color: #38bdf8 !important;
      color: #0369a1 !important;
    }
    .action-view-btn {
      transition: all 0.15s ease-in-out;
    }
    .action-view-btn:hover {
      background-color: #e0f2fe !important;
      border-color: #0284c7 !important;
      color: #0369a1 !important;
      transform: scale(1.08);
    }
    .btn-xs {
      padding: 0.15rem 0.45rem;
      font-size: 0.75rem;
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      #printable-student-modal, #printable-student-modal * {
        visibility: visible !important;
      }
      #printable-student-modal {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 20px !important;
        background: white !important;
        box-shadow: none !important;
      }
      .modal-backdrop, .btn-close, .modal-footer, .no-print {
        display: none !important;
      }
    }
  `]
})
export class StudentsComponent implements OnInit {
  students = signal<TailoringStudent[]>([]);
  stats = signal<StudentStats>({ total: 0, applied: 0, selected: 0, in_training: 0, completed: 0, rejected: 0 });
  isLoading = signal(false);

  selectedStatus = signal<string>('all');
  selectedBatch = 'all';
  searchQuery = '';

  // View Details Modal State (Available for Both Tailoring Class Staff & Admin)
  showViewModal = false;
  viewingStudent: TailoringStudent | null = null;

  // Form Modal
  showFormModal = false;
  isEditing = false;
  isSaving = false;
  editingStudentId?: number;

  studentForm: Partial<TailoringStudent> = {
    full_name: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    dob: '',
    age: undefined,
    marital_status: '',
    father_name: '',
    mother_name: '',
    spouse_name: '',
    father_spouse_occupation: '',
    aadhar_card_url: '',
    address: '',
    qualification: '',
    batch_preference: 'Morning',
    batch_number: '',
    batch_timing: '',
    has_prior_experience: 'No',
    status: 'applied',
    notes: ''
  };

  // Assign Batch Modal State (For Tailoring Class Staff & Super Admin)
  showAssignBatchModal = false;
  isSavingBatch = false;
  selectedStudentForBatch: TailoringStudent | null = null;
  customBatchNumber = '';

  assignBatchForm = {
    batch_number: 'Batch 1',
    batch_timing: 'Morning (9:30 AM - 12:30 PM)',
    status: 'in_training',
    notes: ''
  };

  calculateAge(dobStr?: string): number | null {
    if (!dobStr) return null;
    const trimmed = String(dobStr).trim();
    let birthDate: Date | null = null;

    // DD/MM/YYYY or DD-MM-YYYY or D/M/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      birthDate = new Date(year, month, day);
    } else {
      // YYYY-MM-DD or YYYY/MM/DD
      const ymdMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        birthDate = new Date(year, month, day);
      } else {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          birthDate = parsed;
        }
      }
    }

    if (!birthDate || isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 10 && age <= 100 ? age : null;
  }

  getStudentAge(student: TailoringStudent): number | null {
    if (student.dob) {
      const calc = this.calculateAge(student.dob);
      if (calc !== null) return calc;
    }
    if (student.age !== undefined && student.age !== null) {
      const n = Number(student.age);
      if (!isNaN(n) && n >= 10 && n <= 100) return n;
    }
    return null;
  }

  onDobChange(dob?: string): void {
    const val = dob !== undefined ? dob : this.studentForm.dob;
    const age = this.calculateAge(val);
    if (age !== null) {
      this.studentForm.age = age;
    }
  }

  // Google Form Integration Modal
  showWebhookModal = false;
  copiedType = '';

  // Google Sheet Direct Sync (No Coding / No Apps Script)
  googleSheetUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem('tailoring_google_sheet_url') || '') : '';
  isSyncingSheet = false;
  syncStatusMessage = '';
  syncSuccess = false;

  async syncFromGoogleSheet(): Promise<void> {
    const url = this.googleSheetUrl?.trim();
    if (!url) return;

    this.isSyncingSheet = true;
    this.syncStatusMessage = '';

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tailoring_google_sheet_url', url);
      }
      this.api.saveTailoringSheetUrl(url).subscribe({ next: () => {}, error: () => {} });

      // Extract Sheet ID
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match || !match[1]) {
        throw new Error('Invalid Google Sheet URL. Please copy the full link from your browser.');
      }
      const sheetId = match[1];

      // Extract GID if present
      const gidMatch = url.match(/[#&]gid=([0-9]+)/);
      const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;

      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error('Could not access Google Sheet. Please ensure Sheet Sharing is set to "Anyone with the link can view".');
      }

      const csvText = await res.text();
      const rows = this.parseCSV(csvText);

      if (rows.length < 2) {
        throw new Error('Google Sheet is empty or contains only the header row.');
      }

      // Headers (Row 0)
      const headers = rows[0].map(h => h.trim().toLowerCase());
      
      let nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('father') && !h.includes('mother') && !h.includes('spouse'));
      let dobIdx = headers.findIndex(h => h.includes('birth') || h.includes('dob') || h.includes('date of birth'));
      let phoneIdx = headers.findIndex(h => h.includes('mobile') || h.includes('phone') || h.includes('contact') || h.includes('whatsapp') || h.includes('number'));
      let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
      let maritalIdx = headers.findIndex(h => h.includes('marital') || h.includes('marriage'));
      let fatherIdx = headers.findIndex(h => h.includes('father') && !h.includes('occupation'));
      let motherIdx = headers.findIndex(h => h.includes('mother'));
      let spouseIdx = headers.findIndex(h => (h.includes('spouse') || h.includes('husband')) && !h.includes('occupation'));
      let occIdx = headers.findIndex(h => h.includes('occupation') || h.includes('father/spouse') || h.includes('job') || h.includes('work'));
      let aadharIdx = headers.findIndex(h => h.includes('aadhar') || h.includes('adhaar') || h.includes('aadhaar') || h.includes('card') || h.includes('proof'));
      let ageIdx = headers.findIndex(h => h.includes('age') && !h.includes('marriage') && !h.includes('village'));
      let addrIdx = headers.findIndex(h => h.includes('address') || h.includes('place') || h.includes('village') || h.includes('area') || h.includes('city'));
      let batchIdx = headers.findIndex(h => h.includes('batch') || h.includes('time') || h.includes('preference'));
      let qualIdx = headers.findIndex(h => h.includes('qualification') || h.includes('education') || h.includes('study'));

      // Positional fallbacks based on Google Form column order (0: Timestamp, 1: Name, 2: DOB, 3: Phone...)
      if (nameIdx === -1 && rows[0].length >= 2) nameIdx = 1;
      if (dobIdx === -1 && rows[0].length >= 3) dobIdx = 2;
      if (phoneIdx === -1 && rows[0].length >= 4) phoneIdx = 3;

      const existingPhones = new Set(this.students().map(s => this.cleanPhoneForWa(s.phone || '')));
      let newCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rawName = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
        const rawPhone = phoneIdx !== -1 ? row[phoneIdx]?.trim() : '';

        if (!rawName || !rawPhone) continue;

        const cleanPhone = this.cleanPhoneForWa(rawPhone);
        if (existingPhones.has(cleanPhone)) {
          skippedCount++;
          continue;
        }

        const rawDob = dobIdx !== -1 ? row[dobIdx]?.trim() : '';
        const rawEmail = emailIdx !== -1 ? row[emailIdx]?.trim() : '';
        const rawMarital = maritalIdx !== -1 ? row[maritalIdx]?.trim() : '';
        const rawFather = fatherIdx !== -1 ? row[fatherIdx]?.trim() : '';
        const rawMother = motherIdx !== -1 ? row[motherIdx]?.trim() : '';
        const rawSpouse = spouseIdx !== -1 ? row[spouseIdx]?.trim() : '';
        const rawOcc = occIdx !== -1 ? row[occIdx]?.trim() : '';
        const rawAadhar = aadharIdx !== -1 ? (row[aadharIdx]?.trim()?.split(',')?.[0]?.trim() || '') : '';
        const rawAddr = addrIdx !== -1 ? row[addrIdx]?.trim() : '';
        const rawQual = qualIdx !== -1 ? row[qualIdx]?.trim() : '';

        let calcAge = rawDob ? this.calculateAge(rawDob) : null;
        if (calcAge === null && ageIdx !== -1 && row[ageIdx]) {
          const parsed = parseInt(row[ageIdx], 10);
          if (!isNaN(parsed) && parsed >= 10 && parsed <= 100) {
            calcAge = parsed;
          }
        }

        const rawBatch = batchIdx !== -1 ? (row[batchIdx] || '').trim().toLowerCase() : '';
        let batchPref = 'Morning';
        if (rawBatch.includes('afternoon') || rawBatch.includes('noon')) batchPref = 'Afternoon';
        else if (rawBatch.includes('eve')) batchPref = 'Evening';

        const studentData: Partial<TailoringStudent> = {
          full_name: rawName,
          phone: rawPhone,
          whatsapp_number: rawPhone,
          email: rawEmail || undefined,
          dob: rawDob || undefined,
          age: calcAge ?? undefined,
          marital_status: rawMarital || undefined,
          father_name: rawFather || undefined,
          mother_name: rawMother || undefined,
          spouse_name: rawSpouse || undefined,
          father_spouse_occupation: rawOcc || undefined,
          aadhar_card_url: rawAadhar || undefined,
          address: rawAddr || undefined,
          batch_preference: batchPref,
          qualification: rawQual || undefined,
          source: 'google_form',
          status: 'applied'
        };

        try {
          await new Promise<void>((resolve, reject) => {
            this.api.createStudent(studentData).subscribe({
              next: () => resolve(),
              error: (e) => reject(e)
            });
          });
          existingPhones.add(cleanPhone);
          newCount++;
        } catch (e) {
          console.warn('Failed to import student row', row, e);
        }
      }

      this.isSyncingSheet = false;
      this.syncSuccess = true;
      this.syncStatusMessage = `Sync successful! Imported ${newCount} new student${newCount === 1 ? '' : 's'}${skippedCount > 0 ? ` (${skippedCount} already in database skipped)` : ''}.`;
      this.loadStudents();
      this.loadStats();
    } catch (err: any) {
      this.isSyncingSheet = false;
      this.syncSuccess = false;
      this.syncStatusMessage = err.message || 'Sync failed. Please check your sheet link and sharing permissions.';
    }
  }

  parseCSV(text: string): string[][] {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (insideQuotes && next === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((c === '\r' || c === '\n') && !insideQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        currentRow.push(currentCell);
        if (currentRow.some(cell => cell.trim().length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += c;
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      if (currentRow.some(cell => cell.trim().length > 0)) {
        lines.push(currentRow);
      }
    }

    return lines;
  }

  constructor(private api: ApiService, public authService: AuthService) {}

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadStats();
    this.loadSheetUrl();
  }

  loadSheetUrl(): void {
    this.api.getTailoringSheetUrl().subscribe({
      next: (res) => {
        if (res?.url) {
          this.googleSheetUrl = res.url;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('tailoring_google_sheet_url', res.url);
          }
        }
      },
      error: () => {}
    });
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.api.getStudents().subscribe({
      next: (res) => {
        this.students.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load students:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadStats(): void {
    this.api.getStudentStats().subscribe({
      next: (res) => {
        if (res?.data) {
          this.stats.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load student stats:', err)
    });
  }

  filteredStudents = computed(() => {
    const list = this.students();
    const st = this.selectedStatus();
    const batch = this.selectedBatch;
    const q = this.searchQuery.trim().toLowerCase();

    return list.filter(s => {
      // Status filter
      if (st !== 'all' && s.status !== st) return false;

      // Batch filter
      if (batch !== 'all' && s.batch_preference !== batch && s.batch_timing !== batch) return false;

      // Search query
      if (q) {
        const matchName = s.full_name?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q) || s.whatsapp_number?.includes(q);
        const matchCode = s.student_code?.toLowerCase().includes(q);
        const matchAddr = s.address?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        const matchDob = s.dob?.includes(q);
        const matchFather = s.father_name?.toLowerCase().includes(q);
        const matchSpouse = s.spouse_name?.toLowerCase().includes(q);
        const matchOcc = s.father_spouse_occupation?.toLowerCase().includes(q);
        const matchMarital = s.marital_status?.toLowerCase().includes(q);
        const matchBatch = s.batch_number?.toLowerCase().includes(q) || s.batch_timing?.toLowerCase().includes(q);
        return matchName || matchPhone || matchCode || matchAddr || matchEmail || matchDob || matchFather || matchSpouse || matchOcc || matchMarital || matchBatch;
      }

      return true;
    });
  });

  setStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  // View Student Details Modal Operations (Tailoring Class Staff & Admin)
  openViewModal(student: TailoringStudent): void {
    this.viewingStudent = student;
    this.showViewModal = true;
    if (student.id) {
      this.api.getStudent(student.id).subscribe({
        next: (res) => {
          if (res?.data && this.viewingStudent?.id === student.id) {
            this.viewingStudent = res.data;
          }
        },
        error: () => {}
      });
    }
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewingStudent = null;
  }

  openAssignBatchFromView(): void {
    if (!this.viewingStudent) return;
    const st = this.viewingStudent;
    this.closeViewModal();
    this.openAssignBatchModal(st);
  }

  openEditFromView(): void {
    if (!this.viewingStudent) return;
    const st = this.viewingStudent;
    this.closeViewModal();
    this.openEditModal(st);
  }

  printStudentDetails(): void {
    window.print();
  }

  // Assign Batch Modal Operations (Tailoring Class Staff & Super Admin)
  openAssignBatchModal(student: TailoringStudent): void {
    this.selectedStudentForBatch = student;
    this.customBatchNumber = '';
    const existingNum = student.batch_number || 'Batch 1';
    const isStandard = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6'].includes(existingNum);
    
    this.assignBatchForm = {
      batch_number: isStandard ? existingNum : (existingNum ? 'custom' : 'Batch 1'),
      batch_timing: student.batch_timing || (student.batch_preference ? `${student.batch_preference} Batch` : 'Morning (9:30 AM - 12:30 PM)'),
      status: student.status === 'selected' ? 'in_training' : student.status,
      notes: student.notes || ''
    };
    if (!isStandard && existingNum) {
      this.customBatchNumber = existingNum;
    }
    this.showAssignBatchModal = true;
  }

  onCustomBatchChange(val: string): void {
    this.customBatchNumber = val;
  }

  saveBatchAssignment(): void {
    if (!this.selectedStudentForBatch) return;
    const finalBatchNum = this.assignBatchForm.batch_number === 'custom' 
      ? this.customBatchNumber.trim() 
      : this.assignBatchForm.batch_number;

    if (!finalBatchNum) {
      alert('Please enter or select a Batch Number.');
      return;
    }

    this.isSavingBatch = true;
    const student = this.selectedStudentForBatch;
    const payload = {
      batch_number: finalBatchNum,
      batch_timing: this.assignBatchForm.batch_timing,
      status: this.assignBatchForm.status,
      notes: this.assignBatchForm.notes
    };

    this.api.assignStudentBatch(student.id, payload).subscribe({
      next: () => {
        this.isSavingBatch = false;
        this.showAssignBatchModal = false;
        this.loadStudents();
        this.loadStats();

        if (this.viewingStudent && this.viewingStudent.id === student.id) {
          this.viewingStudent = {
            ...this.viewingStudent,
            batch_number: finalBatchNum,
            batch_timing: this.assignBatchForm.batch_timing,
            status: this.assignBatchForm.status,
            notes: this.assignBatchForm.notes
          };
        }
      },
      error: (err) => {
        this.isSavingBatch = false;
        alert('Failed to assign batch: ' + (err.error?.message || err.message));
      }
    });
  }

  quickSelectStudent(student: TailoringStudent): void {
    if (!this.isSuperAdmin()) {
      alert('Permission denied: Only Super Admin can select students for admission.');
      return;
    }
    this.api.updateStudentStatus(student.id, 'selected').subscribe({
      next: () => {
        this.students.update(list => list.map(s => s.id === student.id ? { ...s, status: 'selected' } : s));
        this.loadStats();
        if (this.viewingStudent && this.viewingStudent.id === student.id) {
          this.viewingStudent = { ...this.viewingStudent, status: 'selected' };
        }
        alert(`🎉 Student "${student.full_name}" is now SELECTED for ${student.batch_preference || 'Morning'} Batch!`);
      },
      error: (err) => alert('Failed to select student: ' + (err.error?.message || err.message))
    });
  }

  updateStatus(id: number, status: string): void {
    if (!this.isSuperAdmin()) {
      alert('Permission denied: Only Super Admin has authority to change student admission status.');
      return;
    }
    this.api.updateStudentStatus(id, status).subscribe({
      next: () => {
        // Optimistic update
        this.students.update(list => list.map(s => s.id === id ? { ...s, status } : s));
        this.loadStats();
        if (this.viewingStudent && this.viewingStudent.id === id) {
          this.viewingStudent = { ...this.viewingStudent, status };
        }
      },
      error: (err) => alert('Failed to update status: ' + (err.error?.message || err.message))
    });
  }

  cleanPhoneForWa(phone: string): string {
    return String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  }

  openAddModal(): void {
    if (!this.isSuperAdmin()) {
      alert('Permission denied: Only Super Admin can register or add students.');
      return;
    }
    this.isEditing = false;
    this.editingStudentId = undefined;
    this.studentForm = {
      full_name: '',
      phone: '',
      whatsapp_number: '',
      email: '',
      dob: '',
      age: undefined,
      marital_status: '',
      father_name: '',
      mother_name: '',
      spouse_name: '',
      father_spouse_occupation: '',
      aadhar_card_url: '',
      address: '',
      qualification: '',
      batch_preference: 'Morning',
      batch_number: '',
      batch_timing: '',
      has_prior_experience: 'No',
      status: 'applied',
      notes: ''
    };
    this.showFormModal = true;
  }

  openEditModal(student: TailoringStudent): void {
    if (!this.isSuperAdmin()) {
      alert('Permission denied: Only Super Admin can edit student details.');
      return;
    }
    this.isEditing = true;
    this.editingStudentId = student.id;
    this.studentForm = { ...student };
    this.showFormModal = true;
  }

  saveStudent(): void {
    if (!this.studentForm.full_name || !this.studentForm.phone) return;
    this.isSaving = true;

    if (this.isEditing && this.editingStudentId) {
      this.api.updateStudent(this.editingStudentId, this.studentForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.showFormModal = false;
          this.loadStudents();
          this.loadStats();
          if (this.viewingStudent && this.viewingStudent.id === this.editingStudentId) {
            this.viewingStudent = { ...this.viewingStudent, ...this.studentForm } as TailoringStudent;
          }
        },
        error: (err) => {
          this.isSaving = false;
          alert('Failed to update student: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.api.createStudent(this.studentForm).subscribe({
        next: () => {
          this.isSaving = false;
          this.showFormModal = false;
          this.loadStudents();
          this.loadStats();
        },
        error: (err) => {
          this.isSaving = false;
          alert('Failed to register student: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  deleteStudent(student: TailoringStudent): void {
    if (!this.isSuperAdmin()) {
      alert('Permission denied: Only Super Admin can delete student records.');
      return;
    }
    if (confirm(`Are you sure you want to delete student "${student.full_name}" (${student.student_code})?`)) {
      this.api.deleteStudent(student.id).subscribe({
        next: () => {
          this.students.update(list => list.filter(s => s.id !== student.id));
          this.loadStats();
          if (this.viewingStudent && this.viewingStudent.id === student.id) {
            this.closeViewModal();
          }
        },
        error: (err) => alert('Failed to delete student: ' + (err.error?.message || err.message))
      });
    }
  }

  exportToCSV(): void {
    const list = this.filteredStudents();
    if (list.length === 0) return;

    const headers = [
      'Student Code',
      'Name',
      'Date Of Birth',
      'Age',
      'Mobile Number',
      'Email',
      'Marital Status',
      'Father Name',
      'Mother Name',
      'Spouse Name',
      'Father/Spouse Occupation',
      'Aadhar Card URL',
      'Address',
      'Preferred Batch',
      'Assigned Batch Number',
      'Assigned Batch Timing',
      'Status',
      'Date Applied'
    ];
    const rows = list.map(s => [
      s.student_code || '',
      `"${(s.full_name || '').replace(/"/g, '""')}"`,
      s.dob || '',
      this.getStudentAge(s) !== null ? this.getStudentAge(s) : '',
      s.phone || '',
      s.email || '',
      s.marital_status || '',
      `"${(s.father_name || '').replace(/"/g, '""')}"`,
      `"${(s.mother_name || '').replace(/"/g, '""')}"`,
      `"${(s.spouse_name || '').replace(/"/g, '""')}"`,
      `"${(s.father_spouse_occupation || '').replace(/"/g, '""')}"`,
      `"${(s.aadhar_card_url || '').replace(/"/g, '""')}"`,
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.batch_preference || '',
      `"${(s.batch_number || '').replace(/"/g, '""')}"`,
      `"${(s.batch_timing || '').replace(/"/g, '""')}"`,
      s.status || '',
      s.created_at ? s.created_at.slice(0, 10) : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tailoring_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  copyRecommendedFields(): void {
    const fields = 
`1. Name (Short answer, Required)
2. Date Of Birth (Short answer / Date, Required)
3. Mobile Number (Short answer, Required)
4. Email (Short answer, Optional)
5. Marital Status (Multiple choice: Single, Married, Divorced, Widowed)
6. Father Name (Short answer, Optional)
7. Mother Name (Short answer, Optional)
8. Spouse Name (Short answer, Optional)
9. Father/Spouse Occupation (Short answer, Optional)
10. Aadhar Card (File upload or Drive link, Optional)`;
    navigator.clipboard.writeText(fields).then(() => {
      this.copiedType = 'fields';
      setTimeout(() => this.copiedType = '', 2500);
    });
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedType = type;
      setTimeout(() => this.copiedType = '', 2500);
    });
  }
}
