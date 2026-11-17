import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
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
            Review student applications from Google Form, select candidates, manage training batches, and dispatch WhatsApp alerts.
          </p>
        </div>

        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Google Form Setup Guide Modal Trigger -->
          <button 
            type="button" 
            class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-xs fw-semibold"
            (click)="showWebhookModal = true"
            title="View Google Form Webhook Setup"
          >
            <i class="bi bi-google"></i>
            <span>Google Form Sync</span>
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

          <!-- Add Manual Student -->
          <button 
            type="button" 
            class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold"
            (click)="openAddModal()"
          >
            <i class="bi bi-person-plus-fill"></i>
            <span>Add Student</span>
          </button>
        </div>
      </div>

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
                <th>Batch / Timing</th>
                <th>Education</th>
                <th>Status</th>
                <th class="text-end pe-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (isLoading()) {
                <tr>
                  <td colspan="7" class="text-center py-5">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                    <span class="text-muted small">Loading tailoring students...</span>
                  </td>
                </tr>
              } @else if (filteredStudents().length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-5">
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
                      <span class="badge bg-light text-dark border font-monospace px-2 py-1" style="font-size: 11px;">
                        {{ student.student_code || ('#' + student.id) }}
                      </span>
                      <div class="text-muted mt-1" style="font-size: 11px;">
                        {{ student.created_at | date:'dd MMM yyyy' }}
                      </div>
                    </td>

                    <!-- Name & Age & Address -->
                    <td>
                      <div class="fw-semibold text-dark">{{ student.full_name }}</div>
                      <div class="small text-muted d-flex align-items-center gap-1.5 mt-0.5">
                        <span *ngIf="student.age">{{ student.age }} yrs • </span>
                        <span *ngIf="student.address"><i class="bi bi-geo-alt text-danger"></i> {{ student.address }}</span>
                      </div>
                    </td>

                    <!-- Contact & WhatsApp -->
                    <td>
                      <div class="small fw-semibold text-dark">{{ student.phone }}</div>
                      <div class="d-flex align-items-center gap-1 mt-1">
                        <a 
                          [href]="'https://wa.me/91' + cleanPhoneForWa(student.whatsapp_number || student.phone)" 
                          target="_blank"
                          class="badge text-bg-success text-decoration-none d-inline-flex align-items-center gap-1 px-2 py-0.5"
                          title="Open WhatsApp Chat"
                        >
                          <i class="bi bi-whatsapp"></i> Chat
                        </a>
                      </div>
                    </td>

                    <!-- Batch -->
                    <td>
                      <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-2.5 py-1 small">
                        <i class="bi bi-clock me-1"></i> {{ student.batch_preference || 'Morning' }}
                      </span>
                    </td>

                    <!-- Qualification -->
                    <td>
                      <span class="small text-muted">{{ student.qualification || 'Not Specified' }}</span>
                      <div *ngIf="student.has_prior_experience === 'Yes'" class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill mt-1" style="font-size: 10px;">
                        Has Prior Exp
                      </div>
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
                        <!-- 1-Click "Select" Button if applied -->
                        @if (student.status === 'applied') {
                          <button 
                            type="button" 
                            class="btn btn-sm btn-success rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-xs fw-semibold"
                            (click)="quickSelectStudent(student)"
                            title="Mark Student as Selected"
                          >
                            <i class="bi bi-check-lg"></i>
                            <span>Select</span>
                          </button>
                        }

                        <!-- WhatsApp Selection Dispatch -->
                        <button 
                          type="button" 
                          class="btn btn-sm btn-outline-success rounded-circle p-1.5"
                          (click)="sendSelectionWhatsApp(student)"
                          title="Send WhatsApp Selection Message"
                        >
                          <i class="bi bi-whatsapp"></i>
                        </button>

                        <!-- Change Status Dropdown -->
                        <div class="dropdown d-inline-block">
                          <button 
                            type="button" 
                            class="btn btn-sm btn-light border rounded-circle p-1.5" 
                            data-bs-toggle="dropdown"
                            title="Change Status"
                          >
                            <i class="bi bi-arrow-repeat"></i>
                          </button>
                          <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <li><h6 class="dropdown-header small text-uppercase">Update Status</h6></li>
                            <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'selected')"><i class="bi bi-check-circle text-success me-2"></i> Mark as Selected</button></li>
                            <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'in_training')"><i class="bi bi-mortarboard text-info me-2"></i> Mark In Training</button></li>
                            <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'completed')"><i class="bi bi-award text-primary me-2"></i> Mark Completed / Graduated</button></li>
                            <li><button class="dropdown-item small" (click)="updateStatus(student.id, 'applied')"><i class="bi bi-clock text-warning me-2"></i> Reset to Pending</button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button class="dropdown-item small text-danger" (click)="updateStatus(student.id, 'rejected')"><i class="bi bi-x-circle me-2"></i> Reject</button></li>
                          </ul>
                        </div>

                        <!-- Edit Details -->
                        <button 
                          type="button" 
                          class="btn btn-sm btn-light border rounded-circle p-1.5"
                          (click)="openEditModal(student)"
                          title="View / Edit Details"
                        >
                          <i class="bi bi-pencil-fill text-muted"></i>
                        </button>

                        <!-- Delete -->
                        <button 
                          type="button" 
                          class="btn btn-sm btn-light border rounded-circle p-1.5"
                          (click)="deleteStudent(student)"
                          title="Delete Student"
                        >
                          <i class="bi bi-trash-fill text-danger"></i>
                        </button>
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
                  <input type="text" class="form-control" [(ngModel)]="studentForm.full_name" placeholder="e.g. Ayesha Begum">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Phone Number *</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.phone" placeholder="e.g. 9876543210">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">WhatsApp Number</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.whatsapp_number" placeholder="Leave empty if same as phone">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Age</label>
                  <input type="number" class="form-control" [(ngModel)]="studentForm.age" placeholder="e.g. 24">
                </div>

                <div class="col-12">
                  <label class="form-label small fw-semibold text-secondary">Residential Address / Village</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="studentForm.address" placeholder="e.g. Small Mosque Street, Pernambut"></textarea>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Preferred Batch</label>
                  <select class="form-select" [(ngModel)]="studentForm.batch_preference">
                    <option value="Morning">Morning Batch (9:30 AM - 12:30 PM)</option>
                    <option value="Afternoon">Afternoon Batch (2:00 PM - 5:00 PM)</option>
                    <option value="Evening">Evening Batch (5:00 PM - 7:00 PM)</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Education / Qualification</label>
                  <input type="text" class="form-control" [(ngModel)]="studentForm.qualification" placeholder="e.g. 10th Pass / Higher Secondary">
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold text-secondary">Prior Stitching Experience?</label>
                  <select class="form-select" [(ngModel)]="studentForm.has_prior_experience">
                    <option value="No">No - Complete Beginner</option>
                    <option value="Yes">Yes - Basic Sewing Knowledge</option>
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

      <!-- GOOGLE FORM WEBHOOK HELPER MODAL -->
      <div class="modal fade" [class.show]="showWebhookModal" [style.display]="showWebhookModal ? 'block' : 'none'" tabindex="-1" *ngIf="showWebhookModal">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content border-0 shadow-lg rounded-4">
            <div class="modal-header border-bottom px-4 py-3" style="background: #eef2ff;">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-google text-primary fs-4"></i>
                <h5 class="modal-title fw-bold text-navy mb-0">Google Form Real-Time Sync Setup</h5>
              </div>
              <button type="button" class="btn-close" (click)="showWebhookModal = false"></button>
            </div>

            <div class="modal-body p-4">
              <p class="text-muted small">
                Connect your Google Form so every submission instantly saves into the Ar Rahman Trust database and appears on this screen in real-time.
              </p>

              <!-- Webhook URL Box -->
              <div class="mb-4 p-3 bg-light rounded-3 border">
                <label class="form-label small fw-bold text-dark mb-1">Your Public Webhook URL</label>
                <div class="input-group">
                  <input type="text" class="form-control font-monospace small bg-white" [value]="webhookUrl" readonly #webhookInput>
                  <button type="button" class="btn btn-outline-primary" (click)="copyToClipboard(webhookUrl, 'url')">
                    <i class="bi" [class.bi-check-lg]="copiedType === 'url'" [class.bi-clipboard]="copiedType !== 'url'"></i>
                    {{ copiedType === 'url' ? 'Copied!' : 'Copy URL' }}
                  </button>
                </div>
              </div>

              <!-- Steps -->
              <h6 class="fw-bold mb-3" style="color: #0F3D63;">Follow These 4 Quick Steps:</h6>
              <div class="d-flex flex-column gap-3">
                <div class="d-flex gap-3 align-items-start">
                  <span class="badge rounded-circle bg-primary text-white p-2" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">1</span>
                  <div>
                    <strong>Create your Google Form</strong> with these question fields:
                    <div class="small text-muted mt-1">1. Full Name, 2. Mobile/WhatsApp Number, 3. Age, 4. Address/Village, 5. Preferred Batch (Morning/Afternoon/Evening), 6. Education / Notes.</div>
                  </div>
                </div>

                <div class="d-flex gap-3 align-items-start">
                  <span class="badge rounded-circle bg-primary text-white p-2" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">2</span>
                  <div>
                    <strong>Open the linked Google Sheet:</strong>
                    <div class="small text-muted mt-1">In your Google Form responses tab, click <em>"View in Sheets"</em>. In Google Sheets, click <strong>Extensions &rarr; Apps Script</strong>.</div>
                  </div>
                </div>

                <div class="d-flex gap-3 align-items-start">
                  <span class="badge rounded-circle bg-primary text-white p-2" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">3</span>
                  <div class="w-100">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <strong>Paste this script in Google Apps Script:</strong>
                      <button type="button" class="btn btn-sm btn-outline-secondary py-0.5 px-2.5 rounded-pill" (click)="copyToClipboard(googleScriptCode, 'script')">
                        <i class="bi" [class.bi-check-lg]="copiedType === 'script'" [class.bi-clipboard]="copiedType !== 'script'"></i>
                        {{ copiedType === 'script' ? 'Copied Script!' : 'Copy Code' }}
                      </button>
                    </div>
                    <pre class="p-3 bg-dark text-white rounded-3 small mb-0" style="max-height: 180px; overflow-y: auto;"><code>{{ googleScriptCode }}</code></pre>
                  </div>
                </div>

                <div class="d-flex gap-3 align-items-start">
                  <span class="badge rounded-circle bg-primary text-white p-2" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">4</span>
                  <div>
                    <strong>Save & Add Trigger:</strong>
                    <div class="small text-muted mt-1">
                      In Apps Script, click the <strong>Triggers</strong> icon on the left (alarm clock) &rarr; <em>"Add Trigger"</em> &rarr; Set event type to <strong>"On form submit"</strong> &rarr; Click <strong>Save</strong>!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer border-top px-4 py-3 bg-light">
              <button type="button" class="btn btn-trust-primary rounded-pill px-4" (click)="showWebhookModal = false">Done</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="showWebhookModal"></div>

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
  `]
})
export class StudentsComponent implements OnInit {
  students = signal<TailoringStudent[]>([]);
  stats = signal<StudentStats>({ total: 0, applied: 0, selected: 0, in_training: 0, completed: 0, rejected: 0 });
  isLoading = signal(false);

  selectedStatus = signal<string>('all');
  selectedBatch = 'all';
  searchQuery = '';

  // Form Modal
  showFormModal = false;
  isEditing = false;
  isSaving = false;
  editingStudentId?: number;

  studentForm: Partial<TailoringStudent> = {
    full_name: '',
    phone: '',
    whatsapp_number: '',
    age: undefined,
    address: '',
    qualification: '',
    batch_preference: 'Morning',
    has_prior_experience: 'No',
    status: 'applied',
    notes: ''
  };

  // Google Form Sync Modal
  showWebhookModal = false;
  copiedType = '';
  readonly webhookUrl = 'https://ar-rehman-backend.onrender.com/api/students/public';

  readonly googleScriptCode = `function onFormSubmit(e) {
  var row = e.values; // Form response array
  var payload = {
    full_name: row[1],
    phone: row[2],
    age: row[3] || null,
    address: row[4] || '',
    batch_preference: row[5] || 'Morning',
    qualification: row[6] || '',
    source: 'google_form'
  };

  UrlFetchApp.fetch('${this.webhookUrl}', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}`;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadStats();
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
      if (batch !== 'all' && s.batch_preference !== batch) return false;

      // Search query
      if (q) {
        const matchName = s.full_name?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q) || s.whatsapp_number?.includes(q);
        const matchCode = s.student_code?.toLowerCase().includes(q);
        const matchAddr = s.address?.toLowerCase().includes(q);
        return matchName || matchPhone || matchCode || matchAddr;
      }

      return true;
    });
  });

  setStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  quickSelectStudent(student: TailoringStudent): void {
    this.updateStatus(student.id, 'selected');
  }

  updateStatus(id: number, status: string): void {
    this.api.updateStudentStatus(id, status).subscribe({
      next: () => {
        // Optimistic update
        this.students.update(list => list.map(s => s.id === id ? { ...s, status } : s));
        this.loadStats();
      },
      error: (err) => alert('Failed to update status: ' + (err.error?.message || err.message))
    });
  }

  sendSelectionWhatsApp(student: TailoringStudent): void {
    const cleanPhone = this.cleanPhoneForWa(student.whatsapp_number || student.phone);
    const msg = encodeURIComponent(
      `Assalamu Alaikum wa Rahmatullahi wa Barakatuh ${student.full_name},\n\n` +
      `We are pleased to inform you that you have been SELECTED for the *Ar Rahman Trust Free Tailoring Class* (${student.batch_preference || 'Morning'} Batch).\n\n` +
      `Student Code: *${student.student_code || '#' + student.id}*\n` +
      `Center: Ar Rahman Trust Training Center, Pernambut.\n\n` +
      `Please visit our office to confirm your seat and collect your course materials.\n\n` +
      `For inquiries: +91 80156 65648\n` +
      `Ar Rahman Trust, Pernambut`
    );
    window.open(`https://wa.me/91${cleanPhone}?text=${msg}`, '_blank');
  }

  cleanPhoneForWa(phone: string): string {
    return String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingStudentId = undefined;
    this.studentForm = {
      full_name: '',
      phone: '',
      whatsapp_number: '',
      age: undefined,
      address: '',
      qualification: '',
      batch_preference: 'Morning',
      has_prior_experience: 'No',
      status: 'applied',
      notes: ''
    };
    this.showFormModal = true;
  }

  openEditModal(student: TailoringStudent): void {
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
    if (confirm(`Are you sure you want to delete student "${student.full_name}" (${student.student_code})?`)) {
      this.api.deleteStudent(student.id).subscribe({
        next: () => {
          this.students.update(list => list.filter(s => s.id !== student.id));
          this.loadStats();
        },
        error: (err) => alert('Failed to delete student: ' + (err.error?.message || err.message))
      });
    }
  }

  exportToCSV(): void {
    const list = this.filteredStudents();
    if (list.length === 0) return;

    const headers = ['Student Code', 'Name', 'Phone', 'WhatsApp', 'Age', 'Address', 'Batch', 'Qualification', 'Prior Exp', 'Status', 'Date Applied'];
    const rows = list.map(s => [
      s.student_code || '',
      `"${(s.full_name || '').replace(/"/g, '""')}"`,
      s.phone || '',
      s.whatsapp_number || '',
      s.age || '',
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.batch_preference || '',
      `"${(s.qualification || '').replace(/"/g, '""')}"`,
      s.has_prior_experience || '',
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

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedType = type;
      setTimeout(() => this.copiedType = '', 2500);
    });
  }
}
