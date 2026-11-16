import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { GalleryItem } from '../../core/models/models';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gallery-page">
      <!-- Top Page Header -->
      <div class="page-header-wrap mb-4">
        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
          <div>
            <div class="d-flex align-items-center gap-2.5">
              <div class="header-icon-box shadow-2xs">
                <i class="bi bi-images"></i>
              </div>
              <div>
                <div class="d-flex align-items-center gap-2">
                  <h2 class="h4 fw-bold mb-0 text-navy">Gallery Photos</h2>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-0.5 small fw-semibold">
                    {{ photos().length }} Photos
                  </span>
                </div>
                <p class="text-muted small mb-0 mt-0.5">
                  Organize program outreach photos, manage categories, and sync directly with ImageKit.
                </p>
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <a 
              href="https://arrahmantrust.netlify.app/gallery-full" 
              target="_blank" 
              class="btn btn-outline-success btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-semibold"
              title="Open Live Netlify Gallery in new tab"
            >
              <i class="bi bi-box-arrow-up-right"></i>
              <span>Live Website</span>
            </a>

            <button class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold" (click)="openAddModal()">
              <i class="bi bi-cloud-arrow-up-fill"></i>
              <span>Upload Photo</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Metric KPI Row -->
      <div class="row g-2.5 g-md-3 mb-4">
        <div class="col-6 col-md-3">
          <div 
            class="stat-kpi-card" 
            [class.kpi-active]="activeCategory === ''"
            (click)="selectCategory('')"
            role="button"
            title="Show All Photos"
          >
            <div>
              <span class="stat-kpi-label">Total Photos</span>
              <span class="stat-kpi-value text-navy">{{ photos().length }}</span>
            </div>
            <div class="kpi-icon-wrap bg-primary-subtle text-primary">
              <i class="bi bi-images"></i>
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div 
            class="stat-kpi-card" 
            [class.kpi-active]="activeCategory === 'Ration Kits'"
            (click)="selectCategory('Ration Kits')"
            role="button"
            title="Filter by Ration Kits"
          >
            <div>
              <span class="stat-kpi-label">Ration Kits</span>
              <span class="stat-kpi-value text-danger">{{ countByCategory('Ration Kits') }}</span>
            </div>
            <div class="kpi-icon-wrap bg-danger-subtle text-danger">
              <i class="bi bi-box2-heart-fill"></i>
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div 
            class="stat-kpi-card" 
            [class.kpi-active]="activeCategory === 'Tailoring Classes'"
            (click)="selectCategory('Tailoring Classes')"
            role="button"
            title="Filter by Tailoring Classes"
          >
            <div>
              <span class="stat-kpi-label">Tailoring Classes</span>
              <span class="stat-kpi-value text-warning-emphasis">{{ countByCategory('Tailoring Classes') }}</span>
            </div>
            <div class="kpi-icon-wrap bg-warning-subtle text-warning-emphasis">
              <i class="bi bi-scissors"></i>
            </div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div 
            class="stat-kpi-card" 
            [class.kpi-active]="activeCategory === 'Free Medicine & Medical Camp'"
            (click)="selectCategory('Free Medicine & Medical Camp')"
            role="button"
            title="Filter by Medical Camps"
          >
            <div>
              <span class="stat-kpi-label">Medical Camps</span>
              <span class="stat-kpi-value text-success">{{ countByCategory('Free Medicine & Medical Camp') }}</span>
            </div>
            <div class="kpi-icon-wrap bg-success-subtle text-success">
              <i class="bi bi-heart-pulse-fill"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="gallery-toolbar-card p-3 mb-4 rounded-3 bg-white border">
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <!-- Dynamic Category Filter Pills -->
          <div class="category-pills-wrap d-flex flex-wrap gap-1.5 align-items-center">
            <button 
              type="button"
              class="category-chip" 
              [class.chip-active]="activeCategory === ''"
              (click)="selectCategory('')"
            >
              <span>All</span>
              <span class="chip-count">{{ photos().length }}</span>
            </button>

            @for (cat of dynamicCategories(); track cat) {
              <button 
                type="button"
                class="category-chip" 
                [class.chip-active]="activeCategory === cat"
                (click)="selectCategory(cat)"
              >
                <i [class]="getCategoryIcon(cat)"></i>
                <span>{{ getCategoryDisplayName(cat) }}</span>
                <span class="chip-count">{{ countByCategory(cat) }}</span>
              </button>
            }

            <button 
              type="button" 
              class="category-chip-dashed"
              (click)="openAddCategoryModal()"
              title="Create a new custom gallery category"
            >
              <i class="bi bi-plus-circle-fill"></i>
              <span>+ Category</span>
            </button>
          </div>

          <!-- Sort Controls -->
          <div class="d-flex align-items-center gap-2 ms-lg-auto">
            <span class="small text-muted fw-semibold d-none d-sm-inline">Sort:</span>
            <select class="form-select form-select-sm sort-select" [(ngModel)]="sortBy" (ngModelChange)="applyFilter()">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="order">Custom Order</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="spinner-container py-5 text-center">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="small text-muted mt-2">Loading gallery photos...</div>
        </div>
      } @else {
        <!-- Summary & Pagination Controls Bar -->
        <div class="d-flex justify-content-between align-items-center mb-3 text-muted small flex-wrap gap-2 px-1">
          <div>
            Showing <strong class="text-dark">{{ paginationInfo().start }} &ndash; {{ paginationInfo().end }}</strong> of <strong class="text-dark">{{ paginationInfo().total }}</strong> photos
            @if (activeCategory) {
              <span> in <strong class="text-navy">{{ getCategoryDisplayName(activeCategory) }}</strong></span>
            }
            
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted">Per page:</span>
            <select class="form-select form-select-sm per-page-select" [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
              <option [ngValue]="12">12</option>
              <option [ngValue]="24">24</option>
              <option [ngValue]="48">48</option>
              <option [ngValue]="999">All Photos</option>
            </select>
          </div>
        </div>

        <!-- Photos Grid -->
        <div class="row g-3 g-xl-3.5 mb-4">
          @for (photo of pagedPhotos(); track photo.id) {
            <div class="col-6 col-md-4 col-xl-3">
              <div class="photo-card shadow-2xs">
                <!-- Thumbnail Image Wrap -->
                <div class="photo-thumb-wrapper" (click)="openLightbox(photo)">
                  <img 
                    [src]="resolveImageUrl(photo.image_url)" 
                    [alt]="getCategoryDisplayName(photo.category)"
                    loading="lazy"
                    decoding="async"
                    class="photo-thumb"
                    (error)="onImageError($event)"
                  >
                  <!-- Zoom overlay on Hover -->
                  <div class="thumb-hover-overlay">
                    <span class="zoom-pill">
                      <i class="bi bi-arrows-fullscreen me-1.5"></i> View Photo
                    </span>
                  </div>

                  <!-- Recent Upload Badge -->
                  @if (isRecent(photo)) {
                    <span class="recent-badge">
                      <i class="bi bi-stars me-1"></i>NEW
                    </span>
                  }

                  <!-- Visibility Badge Toggle -->
                  <span 
                    class="photo-status-pill position-absolute top-0 end-0 m-2 cursor-pointer"
                    [ngClass]="photo.is_visible ? 'status-live' : 'status-hidden'"
                    (click)="$event.stopPropagation(); toggleVisibility(photo)"
                    title="Click to toggle live website visibility"
                  >
                    <span class="status-indicator-dot" [class.dot-pulsing]="photo.is_visible"></span>
                    {{ photo.is_visible ? 'Live on Site' : 'Hidden' }}
                  </span>
                </div>

                <!-- Clean Card Footer -->
                <div class="photo-card-footer">
                  <span class="badge-category" [ngClass]="getCategoryBadgeClass(photo.category)" [title]="getCategoryDisplayName(photo.category)">
                    {{ getCategoryDisplayName(photo.category) }}
                  </span>
                  
                  <div class="action-btn-group">
                    <button 
                      type="button"
                      class="action-icon-btn btn-view" 
                      (click)="openLightbox(photo)" 
                      title="View Full Resolution"
                    >
                      <i class="bi bi-eye"></i>
                    </button>
                    <button 
                      type="button"
                      class="action-icon-btn btn-edit" 
                      (click)="openEditModal(photo)"
                      title="Edit Category or Change Photo"
                    >
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                      type="button"
                      class="action-icon-btn btn-delete" 
                      (click)="deletePhoto(photo.id)"
                      title="Delete Photo"
                    >
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="col-12">
              <div class="empty-state-card text-center py-5 px-4 bg-white rounded-3 border">
                <div class="empty-state-icon mb-3">
                  <i class="bi bi-images text-muted" style="font-size: 2.5rem;"></i>
                </div>
                <h5 class="fw-bold text-navy mb-1">No photos found</h5>
                <p class="text-muted small mb-3">Try choosing another category tab or uploading a new photo.</p>
                <button class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5" (click)="openAddModal()">
                  <i class="bi bi-cloud-arrow-up-fill me-1.5"></i> Upload Photo Now
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Pagination Controls -->
        @if (totalPages() > 1 || filteredPhotos().length > 0) {
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
            <div class="d-flex align-items-center gap-3 flex-wrap">
              <span class="small text-muted">
                Showing <strong>{{ paginationInfo().start }} &ndash; {{ paginationInfo().end }}</strong> of <strong>{{ paginationInfo().total }}</strong> photos
                &bull; Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages() }}</strong>
              </span>

              <div class="d-flex align-items-center gap-1.5 small text-muted">
                <span>Per page:</span>
                <select class="form-select form-select-sm per-page-select" [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
                  <option [ngValue]="12">12</option>
                  <option [ngValue]="24">24</option>
                  <option [ngValue]="48">48</option>
                  <option [ngValue]="96">96</option>
                </select>
              </div>
            </div>

            <div class="d-flex align-items-center gap-1.5 flex-wrap justify-content-center">
              <!-- First Page Button -->
              <button 
                type="button"
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === 1"
                (click)="goToPage(1)"
                title="First Page"
              >
                <i class="bi bi-chevron-double-left"></i>
              </button>

              <!-- Prev Page Button -->
              <button 
                type="button"
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
                title="Previous Page"
              >
                <i class="bi bi-chevron-left"></i>
              </button>

              <!-- Numbered Page Buttons -->
              @for (p of visiblePages(); track p) {
                <button 
                  type="button"
                  class="btn btn-sm page-num-btn"
                  [ngClass]="currentPage() === p ? 'active-page' : ''"
                  (click)="goToPage(p)"
                >
                  {{ p }}
                </button>
              }

              <!-- Next Page Button -->
              <button 
                type="button"
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
                title="Next Page"
              >
                <i class="bi bi-chevron-right"></i>
              </button>

              <!-- Last Page Button -->
              <button 
                type="button"
                class="btn btn-sm page-nav-btn" 
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(totalPages())"
                title="Last Page"
              >
                <i class="bi bi-chevron-double-right"></i>
              </button>

              <!-- Scroll to Top Button -->
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
      }
    </div>

    <!-- LIGHTBOX / FULLSCREEN PREVIEW MODAL -->
    @if (lightboxPhoto()) {
      <div class="lightbox-overlay" (click)="closeLightbox()">
        <div class="lightbox-dialog" (click)="$event.stopPropagation()">
          <div class="lightbox-header d-flex justify-content-between align-items-center p-3 text-white">
            <div>
              <span class="badge bg-primary px-3 py-1.5 fs-6">{{ getCategoryDisplayName(lightboxPhoto()?.category || '') }}</span>
            </div>
            <button type="button" class="btn-close btn-close-white" (click)="closeLightbox()"></button>
          </div>

          <div class="lightbox-body text-center p-2 bg-black">
            <img 
              [src]="resolveImageUrl(lightboxPhoto()?.image_url)" 
              [alt]="getCategoryDisplayName(lightboxPhoto()?.category || '')" 
              class="img-fluid rounded lightbox-full-img"
              (error)="onImageError($event)"
            >
          </div>

          <div class="lightbox-footer p-3 bg-dark text-white-50 small d-flex justify-content-between align-items-center">
            <div>{{ getCategoryDisplayName(lightboxPhoto()?.category || '') }} &bull; Ar Rahman Trust Archives</div>
            <a [href]="resolveImageUrl(lightboxPhoto()?.image_url)" target="_blank" class="btn btn-sm btn-outline-light rounded-pill px-3">
              <i class="bi bi-box-arrow-up-right me-1"></i> Open Raw Image
            </a>
          </div>
        </div>
      </div>
    }

    <!-- ADD / EDIT PHOTO MODAL -->
    @if (showModal()) {
      <div class="modal fade show d-block" style="background: rgba(0,0,0,0.65); backdrop-filter: blur(5px);" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 560px;">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <!-- Modal Header -->
            <div class="modal-header px-4 py-3" style="background-color: #0F3D63; color: #fff;">
              <div class="d-flex align-items-center gap-2.5">
                <div class="modal-icon-badge">
                  <i class="bi" [class.bi-cloud-arrow-up-fill]="!isEditing()" [class.bi-pencil-square]="isEditing()"></i>
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0 text-white fs-6">
                    {{ isEditing() ? 'Edit Gallery Photo' : 'Upload Gallery Photo' }}
                  </h5>
                  <span class="small text-white-50" style="font-size: 11px;">Ar Rahman Trust Gallery System</span>
                </div>
              </div>
              <button type="button" class="btn-close btn-close-white" (click)="showModal.set(false)"></button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4">
              <form (ngSubmit)="savePhoto()">
                <div class="row g-3">
                  <!-- CATEGORY SELECTION & NEW CATEGORY OPTION -->
                  <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-1.5">
                      <label class="form-label small fw-bold mb-0 text-navy">Category *</label>
                      <button 
                        type="button" 
                        class="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                        (click)="toggleNewCategoryMode()"
                        style="color: #0F3D63; font-size: 0.8rem;"
                      >
                        @if (isCreatingNewCategory) {
                          <i class="bi bi-arrow-left-circle me-1"></i> Choose Existing Category
                        } @else {
                          <i class="bi bi-plus-circle-fill me-1 text-success"></i> + Add New Category
                        }
                      </button>
                    </div>

                    <!-- If choosing existing category -->
                    @if (!isCreatingNewCategory) {
                      <div class="input-group">
                        <select class="form-select" [(ngModel)]="formData.category" (ngModelChange)="onCategoryChange($event)" name="category">
                          @for (cat of dynamicCategories(); track cat) {
                            <option [value]="cat">{{ getCategoryDisplayName(cat) }}</option>
                          }
                          <option value="General">General</option>
                        </select>
                        <button 
                          type="button" 
                          class="btn btn-outline-primary btn-sm"
                          (click)="toggleNewCategoryMode()"
                          title="Type a new category name"
                        >
                          <i class="bi bi-plus-lg"></i> New
                        </button>
                      </div>
                      <div class="form-text small text-muted d-flex align-items-center justify-content-between mt-1.5">
                        <span style="font-size: 11.5px;">ImageKit Destination:</span>
                        <span class="badge bg-light text-primary border font-monospace" style="font-size: 10px;">
                          {{ targetImageKitFolder }}
                        </span>
                      </div>
                    } @else {
                      <!-- If creating a brand new category -->
                      <div class="new-category-box p-3 rounded-3 border bg-light">
                        <div class="d-flex align-items-center gap-2 mb-2">
                          <i class="bi bi-folder-plus text-primary fs-5"></i>
                          <span class="small fw-bold text-navy">Enter New Category Name:</span>
                        </div>
                        <div class="input-group">
                          <input 
                            type="text" 
                            class="form-control" 
                            [(ngModel)]="newCategoryName" 
                            (ngModelChange)="onNewCategoryNameChange($event)"
                            name="newCategoryName" 
                            placeholder="e.g. Ramadan Relief, Drinking Water, Orphan Care..."
                            autofocus
                          >
                          <button 
                            type="button" 
                            class="btn btn-secondary btn-sm"
                            (click)="toggleNewCategoryMode()"
                          >
                            Cancel
                          </button>
                        </div>
                        <div class="small text-muted mt-1.5 d-flex align-items-center justify-content-between">
                          <span style="font-size: 11px;">Category will be created automatically.</span>
                          <span class="badge bg-white text-success border font-monospace" style="font-size: 10px;">
                            {{ targetImageKitFolder }}
                          </span>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- IMAGE INPUT METHOD (FILE UPLOAD OR URL) -->
                  <div class="col-12">
                    <label class="form-label small fw-bold d-block mb-2 text-navy">Photo Source *</label>

                    <!-- Segmented Source Selector Tabs -->
                    <div class="segmented-source-tabs mb-3">
                      <button 
                        type="button" 
                        class="segmented-tab" 
                        [class.tab-active]="imageSourceMode === 'upload'"
                        (click)="imageSourceMode = 'upload'"
                      >
                        <i class="bi bi-cloud-arrow-up me-1.5"></i> Upload from Device
                      </button>
                      <button 
                        type="button" 
                        class="segmented-tab" 
                        [class.tab-active]="imageSourceMode === 'url'"
                        (click)="imageSourceMode = 'url'"
                      >
                        <i class="bi bi-link-45deg me-1.5"></i> Image URL / ImageKit
                      </button>
                    </div>

                    <!-- 1. FILE UPLOAD BOX -->
                    @if (imageSourceMode === 'upload') {
                      <div class="file-dropzone p-3 text-center border-dashed rounded-3">
                        <input 
                          type="file" 
                          id="galleryFileInput" 
                          class="d-none" 
                          accept="image/*"
                          (change)="onFileSelected($event)"
                          #fileInput
                        >

                        @if (filePreviewUrl) {
                          <!-- Selected File Preview -->
                          <div class="preview-container position-relative d-inline-block">
                            <img [src]="filePreviewUrl" alt="Upload preview" class="rounded-3 shadow-sm file-preview-img mb-2">
                            <button 
                              type="button" 
                              class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle p-1"
                              (click)="clearSelectedFile(fileInput)"
                              title="Remove selected image"
                            >
                              <i class="bi bi-x-lg"></i>
                            </button>
                            @if (selectedFileName) {
                              <div class="small text-muted">
                                <strong>{{ selectedFileName }}</strong> ({{ selectedFileSize }})
                              </div>
                            }
                            <button 
                              type="button" 
                              class="btn btn-sm btn-outline-primary mt-2 rounded-pill px-3"
                              (click)="fileInput.click()"
                            >
                              <i class="bi bi-arrow-repeat me-1"></i> Change Photo
                            </button>
                          </div>
                        } @else {
                          <!-- Dropzone Placeholder -->
                          <div class="py-3 cursor-pointer" (click)="fileInput.click()">
                            <i class="bi bi-cloud-arrow-up text-primary display-6 mb-2 d-block"></i>
                            <div class="fw-bold text-dark">Click to Choose Photo from Device</div>
                            <div class="small text-muted mt-1">Supports JPG, PNG, WEBP, GIF (Up to 10 MB)</div>
                            <button type="button" class="btn btn-sm btn-trust-primary rounded-pill mt-3 px-3.5">
                              <i class="bi bi-folder2-open me-1"></i> Browse Files
                            </button>
                          </div>
                        }

                        <!-- ImageKit Destination Folder Pill -->
                        <div class="mt-3 p-2.5 bg-white border rounded-3 text-start shadow-2xs">
                          <div class="d-flex align-items-center justify-content-between mb-1.5">
                            <span class="small fw-semibold text-navy">
                              <i class="bi bi-cloud-check-fill text-primary me-1"></i> Destination Folder:
                            </span>
                            <span class="badge bg-success-subtle text-success border border-success-subtle font-monospace" style="font-size: 10px;">
                              Auto-synced
                            </span>
                          </div>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light text-muted font-monospace small" style="font-size: 11px;">ik.imagekit.io/baaidzoik</span>
                            <input 
                              type="text" 
                              class="form-control font-monospace text-primary fw-semibold" 
                              [(ngModel)]="targetImageKitFolder" 
                              name="targetImageKitFolder" 
                              placeholder="/assets/gallery-full/..."
                              style="font-size: 11.5px;"
                            >
                          </div>
                        </div>
                      </div>
                    } @else {
                      <!-- 2. DIRECT IMAGE URL INPUT -->
                      <div class="url-input-box p-3 border rounded-3 bg-light">
                        <div class="input-group">
                          <span class="input-group-text bg-white"><i class="bi bi-link-45deg"></i></span>
                          <input 
                            type="text" 
                            class="form-control" 
                            [(ngModel)]="formData.image_url" 
                            name="image_url" 
                            placeholder="https://ik.imagekit.io/baaidzoik/assets/..."
                          >
                        </div>
                        @if (formData.image_url) {
                          <div class="mt-2.5 text-center bg-white p-2.5 rounded-3 border">
                            <img 
                              [src]="formData.image_url" 
                              alt="URL preview" 
                              class="rounded" 
                              style="max-height: 130px; max-width: 100%; object-fit: contain;"
                              (error)="onImageError($event)"
                            >
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Public Visibility Switch -->
                  <div class="col-12">
                    <div class="form-check form-switch p-3 ps-5 bg-light rounded-3 border">
                      <input 
                        class="form-check-input ms-n4 me-2" 
                        type="checkbox" 
                        id="visibleCheck" 
                        [(ngModel)]="formData.is_visible" 
                        name="is_visible"
                        style="cursor: pointer; transform: scale(1.15);"
                      >
                      <label class="form-check-label fw-semibold text-dark user-select-none" for="visibleCheck" style="cursor: pointer;">
                        Display Live on Public Website
                      </label>
                      <div class="small text-muted mt-0.5" style="font-size: 11.5px;">
                        When checked, this photo will be published and visible to visitors on the live website.
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Modal Actions -->
                <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" class="btn btn-light rounded-pill px-4" (click)="showModal.set(false)">Cancel</button>
                  <button 
                    type="submit" 
                    class="btn btn-trust-primary rounded-pill px-4" 
                    [disabled]="isSubmitting() || (!selectedFile && !formData.image_url && !filePreviewUrl)"
                  >
                    @if (isSubmitting()) {
                      <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                      <span>Uploading & Saving...</span>
                    } @else {
                      <i class="bi bi-check-lg me-1"></i>
                      <span>{{ isEditing() ? 'Update Photo' : 'Save Photo to Gallery' }}</span>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- QUICK CATEGORY CREATOR MODAL -->
    @if (showCategoryModal()) {
      <div class="modal fade show d-block" style="background: rgba(0,0,0,0.65);" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            <div class="modal-header px-4 py-3" style="background-color: #0F3D63; color: #fff;">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-folder-plus fs-5"></i>
                <h5 class="modal-title fw-bold mb-0 fs-6">Create New Gallery Category</h5>
              </div>
              <button type="button" class="btn-close btn-close-white" (click)="showCategoryModal.set(false)"></button>
            </div>
            <div class="modal-body p-4">
              <p class="small text-muted mb-3">
                Create a dedicated category (e.g., <em>Ramadan Ration</em>, <em>Clean Water Borewells</em>, <em>Orphan Care</em>) to organize your photos.
              </p>
              <div class="mb-3">
                <label class="form-label small fw-bold text-navy">Category Name *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  [(ngModel)]="standaloneCategoryName" 
                  placeholder="e.g. Ramadan Relief 2026"
                  autofocus
                >
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button type="button" class="btn btn-light rounded-pill px-3" (click)="showCategoryModal.set(false)">Cancel</button>
                <button 
                  type="button" 
                  class="btn btn-trust-primary rounded-pill px-4" 
                  [disabled]="!standaloneCategoryName.trim()"
                  (click)="confirmCreateCategory()"
                >
                  Create & Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .text-navy {
      color: #0F3D63 !important;
    }

    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #eff6ff;
      color: #0F3D63;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }

    .shadow-2xs {
      box-shadow: 0 1px 3px rgba(15, 61, 99, 0.05);
    }

    /* Stat KPI Cards */
    .stat-kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.85rem 1.1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .stat-kpi-card:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 61, 99, 0.08);
    }
    .stat-kpi-card.kpi-active {
      border-color: #0F3D63;
      background: #f8fafc;
      box-shadow: 0 4px 12px rgba(15, 61, 99, 0.1);
    }
    .stat-kpi-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .stat-kpi-value {
      display: block;
      font-size: 1.45rem;
      font-weight: 700;
      line-height: 1.2;
    }
    .kpi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    /* Toolbar & Filter Chips */
    .gallery-toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(15, 61, 99, 0.04);
    }

    .category-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.38rem 0.85rem;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .category-chip:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #0F3D63;
    }
    .category-chip.chip-active {
      background: #0F3D63 !important;
      border-color: #0F3D63 !important;
      color: #ffffff !important;
      box-shadow: 0 2px 8px rgba(15, 61, 99, 0.25);
    }
    .chip-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.05rem 0.45rem;
      border-radius: 10px;
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(0, 0, 0, 0.08);
      color: inherit;
    }
    .category-chip.chip-active .chip-count {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }

    .category-chip-dashed {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.38rem 0.85rem;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      border: 1.5px dashed #0F3D63;
      background: #ffffff;
      color: #0F3D63;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .category-chip-dashed:hover {
      background: #eff6ff;
      border-color: #0b2f4c;
    }

    /* Search and Sort */
    .search-input-wrapper {
      position: relative;
      min-width: 250px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
    }
    .search-field {
      padding-left: 32px;
      padding-right: 30px;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
    }
    .search-field:focus {
      border-color: #0F3D63;
      box-shadow: 0 0 0 3px rgba(15, 61, 99, 0.12);
    }
    .clear-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      padding: 0 4px;
      background: none;
      border: none;
    }
    .sort-select {
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      padding-left: 0.85rem;
      padding-right: 1.8rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
    }

    /* Photo Cards */
    .photo-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .photo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(15, 61, 99, 0.12);
      border-color: #cbd5e1;
    }
    .photo-thumb-wrapper {
      position: relative;
      height: 195px;
      background: #f1f5f9;
      overflow: hidden;
      cursor: pointer;
    }
    .photo-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }
    .photo-card:hover .photo-thumb {
      transform: scale(1.04);
    }
    .thumb-hover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 61, 99, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      backdrop-filter: blur(2px);
    }
    .photo-card:hover .thumb-hover-overlay {
      opacity: 1;
    }
    .zoom-pill {
      background: #ffffff;
      color: #0F3D63;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }

    .recent-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #f59e0b;
      color: #000;
      font-weight: 800;
      font-size: 0.68rem;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      z-index: 2;
    }

    .photo-status-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      backdrop-filter: blur(6px);
      transition: all 0.2s ease;
      z-index: 2;
    }
    .photo-status-pill.status-live {
      background: rgba(16, 185, 129, 0.92);
      color: #ffffff;
    }
    .photo-status-pill.status-hidden {
      background: rgba(30, 41, 59, 0.85);
      color: #cbd5e1;
    }
    .photo-status-pill:hover {
      transform: scale(1.05);
    }
    .status-indicator-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ffffff;
      display: inline-block;
    }
    .status-indicator-dot.dot-pulsing {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
    }

    /* Card Footer & Action Buttons */
    .photo-card-footer {
      padding: 0.55rem 0.75rem;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      min-width: 0;
    }
    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 0.28rem;
      flex-shrink: 0;
      margin-left: auto;
    }
    .action-icon-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.78rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
    .action-icon-btn:hover {
      background: #e2e8f0;
      color: #0F3D63;
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .action-icon-btn.btn-edit:hover {
      background: #eff6ff;
      color: #0F3D63;
      border-color: #bfdbfe;
    }
    .action-icon-btn.btn-delete:hover {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    .badge-category {
      font-size: 0.69rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      padding: 0.22rem 0.5rem;
      border-radius: 6px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1 1 auto;
      min-width: 0;
      max-width: 100%;
    }
    .badge-food { background: #fee2e2; color: #991b1b; }
    .badge-skill { background: #fef3c7; color: #92400e; }
    .badge-medical { background: #d1fae5; color: #065f46; }
    .badge-general { background: #e0f2fe; color: #0369a1; }
    .badge-custom { background: #ede9fe; color: #5b21b6; }

    /* Segmented source tabs in modal */
    .segmented-source-tabs {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 10px;
      gap: 3px;
    }
    .segmented-tab {
      flex: 1;
      border: none;
      background: transparent;
      padding: 0.45rem 0.75rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .segmented-tab.tab-active {
      background: #0F3D63;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    .modal-icon-badge {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      color: #ffffff;
    }

    .file-dropzone {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      transition: all 0.2s ease;
    }
    .file-dropzone:hover {
      border-color: #0F3D63;
      background: #eff6ff;
    }

    .file-preview-img {
      max-height: 180px;
      max-width: 100%;
      object-fit: contain;
    }

    .page-nav-btn {
      width: 32px;
      height: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 0.75rem;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
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
      border-color: #e2e8f0;
      color: #94a3b8;
    }

    .page-num-btn {
      min-width: 34px;
      height: 32px;
      padding: 0 8px;
      font-weight: 600;
      font-size: 0.82rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .page-num-btn:hover:not(.active-page) {
      background: #eff6ff;
      border-color: #0F3D63;
      color: #0F3D63;
    }

    .active-page {
      background: #0F3D63 !important;
      border-color: #0F3D63 !important;
      color: #ffffff !important;
      box-shadow: 0 2px 6px rgba(15, 61, 99, 0.3);
      cursor: default;
    }

    .per-page-select {
      width: auto;
      display: inline-block;
      padding: 0.2rem 1.6rem 0.2rem 0.55rem;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 8px;
      border-color: #cbd5e1;
      color: #0F3D63;
      background-color: #ffffff;
    }

    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(5, 18, 30, 0.92);
      backdrop-filter: blur(10px);
      z-index: 1060;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeInLightbox 0.2s ease-out;
    }

    @keyframes fadeInLightbox {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .lightbox-dialog {
      max-width: 900px;
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
    }

    .lightbox-header {
      background: #0F3D63;
    }

    .lightbox-full-img {
      max-height: 70vh;
      width: auto;
      margin: auto;
      object-fit: contain;
    }
  `]
})
export class GalleryComponent implements OnInit {
  isLoading = signal(true);
  isSubmitting = signal(false);
  photos = signal<GalleryItem[]>([]);
  filteredPhotos = signal<GalleryItem[]>([]);
  activeCategory = '';
  searchQuery = '';
  sortBy: 'newest' | 'order' | 'oldest' = 'newest';

  isRecent(photo: GalleryItem): boolean {
    if (!photo) return false;
    if (photo.id && photo.id >= 1000) return true;
    if (photo.created_at) {
      const created = new Date(photo.created_at).getTime();
      const diffHours = (Date.now() - created) / (1000 * 60 * 60);
      return diffHours <= 72; // within last 3 days
    }
    return false;
  }

  // Dynamic Categories tracking
  userAddedCategories = signal<string[]>([]);
  dynamicCategories = computed(() => {
    const list = this.photos();
    const defaults = ['Ration Kits', 'Tailoring Classes', 'Free Medicine & Medical Camp'];
    const extracted = list.map(p => this.getCategoryDisplayName(p.category)).filter(Boolean);
    const combined = Array.from(new Set([...defaults, ...extracted, ...this.userAddedCategories().map(c => this.getCategoryDisplayName(c))]));
    return combined;
  });

  // Pagination
  currentPage = signal(1);
  pageSize = signal(24);

  pagedPhotos = computed(() => {
    const list = this.filteredPhotos();
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  totalPages = computed(() => {
    const total = this.filteredPhotos().length;
    const size = this.pageSize();
    return Math.ceil(total / size) || 1;
  });

  paginationInfo = computed(() => {
    const total = this.filteredPhotos().length;
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return { start, end, total };
  });

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  // Lightbox
  lightboxPhoto = signal<GalleryItem | null>(null);

  // Modal State
  showModal = signal(false);
  showCategoryModal = signal(false);
  isEditing = signal(false);
  formData: any = {};

  // Category in modal
  isCreatingNewCategory = false;
  newCategoryName = '';
  standaloneCategoryName = '';

  // File Upload vs URL
  imageSourceMode: 'upload' | 'url' = 'upload';
  selectedFile: File | null = null;
  selectedFileName = '';
  selectedFileSize = '';
  filePreviewUrl: string | null = null;
  targetImageKitFolder = '/assets/gallery-full/ration-kit-food-dist';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.isLoading.set(true);
    this.apiService.getGallery().subscribe({
      next: (res) => {
        if (res.success) {
          this.photos.set(res.data);
          this.applyFilter();
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  resolveImageUrl(url: string | undefined): string {
    if (!url) return 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  getCategoryDisplayName(category: string): string {
    const c = (category || '').toLowerCase().trim();
    if (c === 'food distribution' || c.includes('ration')) {
      return 'Ration Kits';
    }
    if (c === 'education & skill' || c.includes('tailor')) {
      return 'Tailoring Classes';
    }
    if (c === 'healthcare' || c.includes('medic') || c.includes('camp')) {
      return 'Free Medicine & Medical Camp';
    }
    return category;
  }

  getFolderForCategory(category: string): string {
    const cat = (category || '').toLowerCase().trim();
    if (cat.includes('food') || cat.includes('ration')) {
      return '/assets/gallery-full/ration-kit-food-dist';
    }
    if (cat.includes('tailor') || cat.includes('skill') || cat.includes('education')) {
      return '/assets/gallery-full/tailoring-class';
    }
    if (cat.includes('health') || cat.includes('medic') || cat.includes('camp')) {
      return '/assets/gallery-full/medical-help';
    }
    const slug = cat
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'general';
    return `/assets/gallery-full/${slug}`;
  }

  onCategoryChange(newCategory: string): void {
    if (!this.isCreatingNewCategory) {
      this.targetImageKitFolder = this.getFolderForCategory(newCategory);
    }
  }

  onNewCategoryNameChange(name: string): void {
    if (this.isCreatingNewCategory) {
      this.targetImageKitFolder = this.getFolderForCategory(name || 'new-category');
    }
  }

  countByCategory(category: string): number {
    const c = (category || '').toLowerCase();
    return this.photos().filter(p => {
      const pc = (p.category || '').toLowerCase();
      if (c.includes('food') || c.includes('ration')) return pc.includes('food') || pc.includes('ration');
      if (c.includes('tailor') || c.includes('skill') || c.includes('education')) return pc.includes('tailor') || pc.includes('skill') || pc.includes('education');
      if (c.includes('health') || c.includes('medic') || c.includes('camp')) return pc.includes('health') || pc.includes('medic') || pc.includes('camp');
      return pc === c;
    }).length;
  }

  getCategoryIcon(category: string): string {
    const c = (category || '').toLowerCase();
    if (c.includes('food') || c.includes('ration')) return 'bi bi-box2-heart text-danger';
    if (c.includes('tailor') || c.includes('skill') || c.includes('education')) return 'bi bi-scissors text-warning';
    if (c.includes('health') || c.includes('medic') || c.includes('camp')) return 'bi bi-heart-pulse-fill text-success';
    return 'bi bi-tag-fill text-primary';
  }

  getCategoryBadgeClass(category: string): string {
    const c = (category || '').toLowerCase();
    if (c.includes('food') || c.includes('ration')) return 'badge-food';
    if (c.includes('tailor') || c.includes('skill') || c.includes('education')) return 'badge-skill';
    if (c.includes('health') || c.includes('medic') || c.includes('camp')) return 'badge-medical';
    if (c === 'general') return 'badge-general';
    return 'badge-custom';
  }

  selectCategory(cat: string): void {
    this.activeCategory = cat;
    this.currentPage.set(1);
    this.applyFilter();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.applyFilter();
  }

  applyFilter(): void {
    let list = [...this.photos()];

    // Category filter
    if (this.activeCategory) {
      const ac = this.activeCategory.toLowerCase();
      list = list.filter(p => {
        const pc = (p.category || '').toLowerCase();
        if (ac.includes('food') || ac.includes('ration')) return pc.includes('food') || pc.includes('ration');
        if (ac.includes('tailor') || ac.includes('skill') || ac.includes('education')) return pc.includes('tailor') || pc.includes('skill') || pc.includes('education');
        if (ac.includes('health') || ac.includes('medic') || ac.includes('camp')) return pc.includes('health') || pc.includes('medic') || pc.includes('camp');
        return pc === ac;
      });
    }

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.caption && p.caption.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.image_url && p.image_url.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (this.sortBy === 'newest') {
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else if (this.sortBy === 'oldest') {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
    } else if (this.sortBy === 'order') {
      list.sort((a, b) => {
        const orderDiff = (a.order_num || 0) - (b.order_num || 0);
        if (orderDiff !== 0) return orderDiff;
        return (b.id || 0) - (a.id || 0);
      });
    }

    this.filteredPhotos.set(list);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.scrollToTop();
    }
  }

  onPageSizeChange(newSize: any): void {
    const size = Number(newSize) || 24;
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  scrollToTop(): void {
    const pageBody = document.querySelector('.page-body');
    if (pageBody) {
      pageBody.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  openLightbox(photo: GalleryItem): void {
    this.lightboxPhoto.set(photo);
  }

  closeLightbox(): void {
    this.lightboxPhoto.set(null);
  }

  toggleVisibility(photo: GalleryItem): void {
    const updated = { ...photo, is_visible: !photo.is_visible };
    this.apiService.updateGallery(photo.id, updated).subscribe({
      next: () => {
        this.photos.update(items => items.map(p => p.id === photo.id ? updated : p));
        this.applyFilter();
      }
    });
  }

  toggleNewCategoryMode(): void {
    this.isCreatingNewCategory = !this.isCreatingNewCategory;
    if (this.isCreatingNewCategory) {
      this.newCategoryName = '';
      this.targetImageKitFolder = '/assets/gallery-full/new-category';
    } else {
      this.targetImageKitFolder = this.getFolderForCategory(this.formData.category);
    }
  }

  openAddCategoryModal(): void {
    this.standaloneCategoryName = '';
    this.showCategoryModal.set(true);
  }

  confirmCreateCategory(): void {
    const trimmed = this.standaloneCategoryName.trim();
    if (trimmed) {
      if (!this.userAddedCategories().includes(trimmed)) {
        this.userAddedCategories.update(c => [...c, trimmed]);
      }
      this.activeCategory = trimmed;
      this.showCategoryModal.set(false);
      this.applyFilter();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      this.selectedFileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearSelectedFile(inputElem?: HTMLInputElement): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedFileSize = '';
    this.filePreviewUrl = null;
    if (inputElem) {
      inputElem.value = '';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'https://ik.imagekit.io/baaidzoik/assets/gallery/AR_food_dist.png';
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.isCreatingNewCategory = false;
    this.newCategoryName = '';
    this.clearSelectedFile();
    this.imageSourceMode = 'upload';

    // If currently filtered by category, default to it
    const defaultCat = this.activeCategory ? this.getCategoryDisplayName(this.activeCategory) : 'Ration Kits';
    this.targetImageKitFolder = this.getFolderForCategory(defaultCat);

    this.formData = {
      title: defaultCat,
      category: defaultCat,
      image_url: '',
      caption: '',
      is_visible: true,
      order_num: 1
    };
    this.showModal.set(true);
  }

  openEditModal(item: GalleryItem): void {
    this.isEditing.set(true);
    this.isCreatingNewCategory = false;
    this.newCategoryName = '';
    this.clearSelectedFile();

    const normalizedCategory = this.getCategoryDisplayName(item.category);
    this.formData = {
      ...item,
      category: normalizedCategory,
      is_visible: Boolean(item.is_visible)
    };
    this.targetImageKitFolder = this.getFolderForCategory(normalizedCategory);
    this.imageSourceMode = 'url';
    this.filePreviewUrl = item.image_url || null;
    this.showModal.set(true);
  }

  savePhoto(): void {
    // Determine the category to use
    let targetCategory = this.formData.category;
    if (this.isCreatingNewCategory && this.newCategoryName.trim()) {
      targetCategory = this.newCategoryName.trim();
      if (!this.userAddedCategories().includes(targetCategory)) {
        this.userAddedCategories.update(c => [...c, targetCategory]);
      }
    }

    const finalFolder = this.targetImageKitFolder || this.getFolderForCategory(targetCategory);
    const finalTitle = this.formData.title || targetCategory || 'Gallery Photo';

    this.isSubmitting.set(true);

    if (this.imageSourceMode === 'upload' && this.selectedFile) {
      // Build FormData for multipart upload
      const fd = new FormData();
      fd.append('title', finalTitle);
      fd.append('category', targetCategory);
      fd.append('caption', this.formData.caption || '');
      fd.append('order_num', (this.formData.order_num || 0).toString());
      fd.append('is_visible', this.formData.is_visible ? '1' : '0');
      fd.append('folder', finalFolder);
      fd.append('image', this.selectedFile);

      if (this.isEditing()) {
        this.apiService.updateGallery(this.formData.id, fd).subscribe({
          next: () => this.handleSaveSuccess(targetCategory),
          error: (err) => this.handleSaveError(err)
        });
      } else {
        this.apiService.createGallery(fd).subscribe({
          next: () => this.handleSaveSuccess(targetCategory),
          error: (err) => this.handleSaveError(err)
        });
      }
    } else {
      // Standard JSON update / create with image_url
      const payload = {
        ...this.formData,
        title: finalTitle,
        category: targetCategory,
        is_visible: this.formData.is_visible ? 1 : 0
      };

      if (this.isEditing()) {
        this.apiService.updateGallery(this.formData.id, payload).subscribe({
          next: () => this.handleSaveSuccess(targetCategory),
          error: (err) => this.handleSaveError(err)
        });
      } else {
        this.apiService.createGallery(payload).subscribe({
          next: () => this.handleSaveSuccess(targetCategory),
          error: (err) => this.handleSaveError(err)
        });
      }
    }
  }

  private handleSaveSuccess(category: string): void {
    this.isSubmitting.set(false);
    this.showModal.set(false);
    // Switch to that category and jump to Page 1 so user sees their new upload immediately at the top
    this.activeCategory = category;
    this.currentPage.set(1);
    this.loadPhotos();
  }

  private handleSaveError(err: any): void {
    this.isSubmitting.set(false);
    const msg = err.error?.message || 'Failed to save photo. Please try again.';
    alert(msg);
  }

  deletePhoto(id: number): void {
    if (confirm('Are you sure you want to delete this photo from the gallery?')) {
      this.apiService.deleteGallery(id).subscribe({
        next: () => this.loadPhotos()
      });
    }
  }
}
