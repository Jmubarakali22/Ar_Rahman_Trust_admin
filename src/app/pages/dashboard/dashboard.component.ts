import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats, Donation, Expense, ExpenseSummary } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Banner -->
      <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-4 gap-3">
        <div>
          <h2 class="h4 fw-bold mb-1" style="color: #0F3D63;">
            Ar Rahman Trust Overview
          </h2>
          <p class="text-muted small mb-0">
            Charity Operations &bull; Pernambut &amp; Surrounding Rural Villages (Reg: 04/16/2020)
          </p>
        </div>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5" 
            (click)="loadDashboard()" 
            [disabled]="isLoading()"
            title="Reload overview data"
          >
            <i class="bi bi-arrow-clockwise" [class.spin-icon]="isLoading()"></i>
            <span>Refresh</span>
          </button>
          <a 
            routerLink="/donations" 
            class="btn btn-trust-primary btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold text-decoration-none"
          >
            <i class="bi bi-plus-circle-fill"></i>
            <span>Record Donation</span>
          </a>
          <a 
            routerLink="/expenses" 
            class="btn btn-outline-danger btn-sm rounded-pill px-3.5 py-1.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold text-decoration-none"
          >
            <i class="bi bi-wallet2"></i>
            <span>Record Expense</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="spinner-container text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="small text-muted mt-2">Loading financial statistics &amp; expenditures...</div>
        </div>
      } @else {
        <!-- 1. Top Donation Receipts KPI Cards Grid -->
        <div class="row g-3 mb-4">
          <!-- Total Donations Raised -->
          <div class="col-sm-6 col-xl-3">
            <div class="stat-card h-100">
              <div class="stat-icon-wrapper" style="background: #e0f2fe; color: #0284c7;">
                <i class="bi bi-wallet2"></i>
              </div>
              <div>
                <div class="stat-label">Total Donations</div>
                <div class="stat-value">₹{{ totalDonations() | number:'1.0-0' }}</div>
                <div class="small text-muted mt-1">{{ stats()?.totalDonationsCount || 0 }} donations received</div>
              </div>
            </div>
          </div>

          <!-- Total Zakat -->
          <div class="col-sm-6 col-xl-3">
            <div class="stat-card h-100">
              <div class="stat-icon-wrapper" style="background: #dcfce7; color: #16a34a;">
                <i class="bi bi-shield-check"></i>
              </div>
              <div>
                <div class="stat-label">Zakat Collected</div>
                <div class="stat-value text-success">₹{{ stats()?.totalZakat | number:'1.0-0' }}</div>
                <div class="small text-muted mt-1">Dedicated Zakat Fund</div>
              </div>
            </div>
          </div>

          <!-- Total Sadaqah -->
          <div class="col-sm-6 col-xl-3">
            <div class="stat-card h-100">
              <div class="stat-icon-wrapper" style="background: #fef3c7; color: #d97706;">
                <i class="bi bi-heart-fill"></i>
              </div>
              <div>
                <div class="stat-label">Sadaqah Collected</div>
                <div class="stat-value" style="color: #d97706;">₹{{ stats()?.totalSadaqah | number:'1.0-0' }}</div>
                <div class="small text-muted mt-1">General Sadaqah &amp; Aid</div>
              </div>
            </div>
          </div>

          <!-- Fitra Contributions -->
          <div class="col-sm-6 col-xl-3">
            <div class="stat-card h-100">
              <div class="stat-icon-wrapper" style="background: #ede9fe; color: #7c3aed;">
                <i class="bi bi-calendar-check-fill"></i>
              </div>
              <div>
                <div class="stat-label">Fitra Contributions</div>
                <div class="stat-value" style="color: #7c3aed;">₹{{ getMonthlyContribution() | number:'1.0-0' }}</div>
                <div class="small text-muted mt-1">{{ getMonthlyDonorsCount() }} Fitra contributors</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. PROMINENT EXPENSE TRACKING & DONATION UTILIZATION DASHBOARD SECTION -->
        <div class="clean-card p-3 p-md-4 mb-4" style="border-left: 5px solid #0F3D63;">
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3 pb-2 border-bottom">
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                  <i class="bi bi-wallet2 me-1"></i> Expenditures Spent From Donations
                </span>
                <span class="small text-muted">&bull; Trust Financial Audit</span>
              </div>
              <h5 class="fw-bold mt-1.5 mb-0" style="color: #0F3D63;">Donation Fund Utilization &amp; Relief Spending Tracker</h5>
            </div>
            <a routerLink="/expenses" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 text-decoration-none fw-semibold">
              <i class="bi bi-file-earmark-spreadsheet"></i>
              <span>View Full Expense Ledger &rarr;</span>
            </a>
          </div>

          <!-- Financial Balance Matrix (Donations vs Expenses vs Remaining Balance) -->
          <div class="row g-2.5 g-md-3 mb-3">
            <!-- 1. Total Raised -->
            <div class="col-6 col-xl-3">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div class="small text-muted fw-semibold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                  <i class="bi bi-cash-stack text-primary me-1"></i> Total Donations
                </div>
                <div class="fw-bold fs-4 text-dark mt-1">₹{{ totalDonations() | number:'1.2-2' }}</div>
                <div class="small text-success mt-1" style="font-size: 11.5px;">
                  <i class="bi bi-arrow-up-circle-fill me-1"></i>{{ stats()?.totalDonationsCount || 0 }} Receipts Collected
                </div>
              </div>
            </div>

            <!-- 2. Total Expenses Spent -->
            <div class="col-6 col-xl-3">
              <div class="p-3 rounded-3 border h-100" style="background-color: #fff1f2; border-color: #fecdd3 !important;">
                <div class="small fw-semibold text-uppercase text-danger" style="font-size: 11px; letter-spacing: 0.5px;">
                  <i class="bi bi-cart-check text-danger me-1"></i> Total Expenses Spent
                </div>
                <div class="fw-bold fs-4 text-danger mt-1">₹{{ totalExpenses() | number:'1.2-2' }}</div>
                <div class="small text-muted mt-1" style="font-size: 11.5px;">
                  <i class="bi bi-arrow-down-circle-fill text-danger me-1"></i>{{ stats()?.totalExpensesCount || expenseSummary()?.total_count || 0 }} Vouchers Audited
                </div>
              </div>
            </div>

            <!-- 3. Net Balance Available -->
            <div class="col-6 col-xl-3">
              <div class="p-3 rounded-3 border h-100" style="background-color: #f0fdf4; border-color: #bbf7d0 !important;">
                <div class="small fw-semibold text-uppercase text-success" style="font-size: 11px; letter-spacing: 0.5px;">
                  <i class="bi bi-piggy-bank text-success me-1"></i> Net Available Balance
                </div>
                <div class="fw-bold fs-4 text-success mt-1">₹{{ netBalance() | number:'1.2-2' }}</div>
                <div class="small text-muted mt-1" style="font-size: 11.5px;">
                  <i class="bi bi-shield-check text-success me-1"></i>Ready for Next Relief Aid
                </div>
              </div>
            </div>

            <!-- 4. Fund Utilization Rate -->
            <div class="col-6 col-xl-3">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div class="small text-muted fw-semibold text-uppercase" style="font-size: 11px; letter-spacing: 0.5px;">
                  <i class="bi bi-pie-chart text-primary me-1"></i> Fund Utilization
                </div>
                <div class="fw-bold fs-4 text-primary mt-1">{{ utilizationPercent() }}%</div>
                <div class="small text-muted mt-1" style="font-size: 11.5px;">
                  {{ utilizationPercent() }}% spent on relief causes
                </div>
              </div>
            </div>
          </div>

          <!-- Progress Bar: Fund Utilization Breakdown -->
          <div class="p-2.5 rounded-3 bg-light border">
            <div class="d-flex justify-content-between align-items-center small mb-1.5 flex-wrap gap-2">
              <span class="fw-semibold text-dark" style="font-size: 12px;">
                <i class="bi bi-bar-chart-fill text-primary me-1"></i> Spend Ratio: 
                <strong class="text-danger">{{ utilizationPercent() }}% Spent</strong> from Donations
              </span>
              <span class="text-muted" style="font-size: 12px;">
                Remaining Trust Reserves: <strong class="text-success">{{ 100 - utilizationPercent() }}% Available</strong>
              </span>
            </div>
            <div class="progress" style="height: 12px; border-radius: 8px; background-color: #e2e8f0; overflow: hidden;">
              <div 
                class="progress-bar bg-danger progress-bar-striped" 
                role="progressbar" 
                [style.width.%]="utilizationPercent()" 
                [attr.aria-valuenow]="utilizationPercent()" 
                aria-valuemin="0" 
                aria-valuemax="100"
                title="Expenses Spent on Relief"
              ></div>
              <div 
                class="progress-bar bg-success" 
                role="progressbar" 
                [style.width.%]="100 - utilizationPercent()" 
                [attr.aria-valuenow]="100 - utilizationPercent()" 
                aria-valuemin="0" 
                aria-valuemax="100"
                title="Remaining Funds Available"
              ></div>
            </div>
          </div>
        </div>

        <!-- 3. Secondary Metrics Grid -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
              <i class="bi bi-people text-primary fs-3"></i>
              <div>
                <div class="small text-muted fw-semibold">Volunteers</div>
                <div class="fw-bold fs-5 text-dark">{{ stats()?.totalVolunteers || 0 }} Registered</div>
              </div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
              <i class="bi bi-images text-info fs-3"></i>
              <div>
                <div class="small text-muted fw-semibold">Gallery Photos</div>
                <div class="fw-bold fs-5 text-dark">{{ stats()?.totalPhotos || 0 }} Photos</div>
              </div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
              <i class="bi bi-chat-left-dots text-warning fs-3"></i>
              <div>
                <div class="small text-muted fw-semibold">Inquiries</div>
                <div class="fw-bold fs-5 text-dark">
                  {{ stats()?.totalInquiries || 0 }} Total
                  @if (stats()?.unreadInquiries) {
                    <span class="badge bg-danger ms-1">{{ stats()?.unreadInquiries }} new</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="p-3 bg-white rounded-3 border d-flex align-items-center gap-3">
              <i class="bi bi-clock-history text-secondary fs-3"></i>
              <div>
                <div class="small text-muted fw-semibold">Pending Verifications</div>
                <div class="fw-bold fs-5 text-dark">{{ stats()?.pendingDonationsCount || 0 }} items</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Main Split View: Tabbed Recent Transactions (Donations vs Expenses) & Quick Management -->
        <div class="row g-4 mb-2">
          <!-- Recent Activity Table with Tab Switcher -->
          <div class="col-lg-8">
            <div class="admin-card h-100 d-flex flex-column">
              <div class="card-header-clean d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="btn-group btn-group-sm p-0.5 bg-light rounded-pill border">
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-pill px-3 py-1 fw-semibold" 
                      [class.btn-trust-primary]="activeTableTab() === 'donations'"
                      [class.btn-light]="activeTableTab() !== 'donations'"
                      (click)="activeTableTab.set('donations')"
                    >
                      <i class="bi bi-cash-coin me-1"></i> Recent Donations
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-pill px-3 py-1 fw-semibold" 
                      [class.btn-danger]="activeTableTab() === 'expenses'"
                      [class.btn-light]="activeTableTab() !== 'expenses'"
                      (click)="activeTableTab.set('expenses')"
                    >
                      <i class="bi bi-wallet2 me-1"></i> Recent Expenses
                    </button>
                  </div>
                </div>

                @if (activeTableTab() === 'donations') {
                  <a routerLink="/donations" class="btn btn-sm btn-link text-decoration-none">View All Donations &rarr;</a>
                } @else {
                  <a routerLink="/expenses" class="btn btn-sm btn-link text-decoration-none text-danger">View All Expenses &rarr;</a>
                }
              </div>

              <!-- View 1: Recent Donations Table -->
              @if (activeTableTab() === 'donations') {
                <div class="table-responsive recent-donations-scroll flex-grow-1">
                  <table class="table admin-table mb-0 align-middle">
                    <thead class="sticky-top bg-light" style="top: 0; z-index: 5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      <tr>
                        <th style="min-width: 100px;">Receipt #</th>
                        <th style="min-width: 130px;">Donor</th>
                        <th style="min-width: 80px;">Type</th>
                        <th style="min-width: 90px;">Amount</th>
                        <th style="min-width: 70px;">Method</th>
                        <th style="min-width: 80px;">Status</th>
                        <th style="min-width: 85px;">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of recentDonations().slice(0, 5); track item.id) {
                        <tr>
                          <td>
                            <span class="badge bg-light text-dark border font-monospace px-1.5 py-0.5" style="font-size: 11px;">
                              {{ formatReceiptNo(item) }}
                            </span>
                          </td>
                          <td>
                            <div class="fw-semibold text-dark text-truncate" style="max-width: 135px;" [title]="item.donor_name">{{ item.donor_name }}</div>
                            <div class="small text-muted font-monospace" style="font-size: 11px;">{{ item.donor_phone }}</div>
                          </td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'bg-success': item.donation_type === 'zakat' || item.donation_type === 'zakath',
                              'bg-primary': item.donation_type === 'sadaqah',
                              'bg-info text-dark': item.donation_type === 'monthly_donation' || item.donation_type === 'monthly_contribution' || item.donation_type === 'monthly' || item.donation_type === 'fitra'
                            }" style="font-size: 10px; padding: 2.5px 5.5px;">
                              {{ (item.donation_type === 'monthly_donation' || item.donation_type === 'monthly_contribution' || item.donation_type === 'monthly' || item.donation_type === 'fitra') ? 'FITRA' : (item.donation_type === 'zakat' ? 'ZAKATH' : (item.donation_type | uppercase)) }}
                            </span>
                          </td>
                          <td class="fw-bold text-dark text-nowrap">₹{{ item.amount | number:'1.2-2' }}</td>
                          <td>
                            <span class="badge bg-secondary text-uppercase" style="font-size: 10px; padding: 2.5px 5px;">{{ item.payment_method }}</span>
                          </td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'badge-soft-success': item.status === 'verified' || item.status === 'completed',
                              'badge-soft-warning': item.status === 'pending',
                              'badge-soft-danger': item.status === 'failed'
                            }" style="font-size: 10px; padding: 2.5px 5.5px;">
                              {{ item.status === 'completed' ? 'verified' : item.status }}
                            </span>
                          </td>
                          <td class="small text-muted text-nowrap" style="font-size: 11.5px;">{{ item.created_at | date:'shortDate' }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="7" class="text-center py-4 text-muted">No donations recorded yet.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- View 2: Recent Expenses Table -->
              @if (activeTableTab() === 'expenses') {
                <div class="table-responsive recent-donations-scroll flex-grow-1">
                  <table class="table admin-table mb-0 align-middle">
                    <thead class="sticky-top bg-light" style="top: 0; z-index: 5; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                      <tr>
                        <th style="min-width: 95px;">Voucher #</th>
                        <th style="min-width: 140px;">Expenditure Title</th>
                        <th style="min-width: 100px;">Category</th>
                        <th style="min-width: 90px;">Amount</th>
                        <th style="min-width: 110px;">Payee / Vendor</th>
                        <th style="min-width: 80px;">Method</th>
                        <th style="min-width: 85px;">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (exp of recentExpenses().slice(0, 5); track exp.id) {
                        <tr>
                          <td>
                            <span class="badge bg-light text-dark border font-monospace px-1.5 py-0.5" style="font-size: 11px;">
                              {{ exp.voucher_number || ('EXP' + exp.id) }}
                            </span>
                          </td>
                          <td>
                            <div class="fw-semibold text-dark text-truncate" style="max-width: 150px;" [title]="exp.title">{{ exp.title }}</div>
                          </td>
                          <td>
                            <span class="badge" [ngClass]="{
                              'bg-purple-subtle text-purple border': exp.category === 'Tailoring',
                              'bg-emerald-subtle text-success border': exp.category === 'Ration Kit',
                              'bg-danger-subtle text-danger border': exp.category === 'Medical Aid' || exp.category === 'Medical',
                              'bg-amber-subtle text-warning border': exp.category === 'Monthly Ration Kit'
                            }" style="font-size: 10px; padding: 2.5px 5.5px;">
                              {{ exp.category }}
                            </span>
                          </td>
                          <td class="fw-bold text-danger text-nowrap">&minus;₹{{ exp.amount | number:'1.2-2' }}</td>
                          <td>
                            <span class="small text-muted text-truncate d-inline-block" style="max-width: 110px;">{{ exp.vendor_payee || '&mdash;' }}</span>
                          </td>
                          <td>
                            <span class="badge bg-secondary text-uppercase" style="font-size: 10px; padding: 2.5px 5px;">{{ exp.payment_method }}</span>
                          </td>
                          <td class="small text-muted text-nowrap" style="font-size: 11.5px;">{{ exp.expense_date | date:'shortDate' }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="7" class="text-center py-4 text-muted">
                            <i class="bi bi-wallet2 fs-2 d-block text-secondary opacity-50 mb-1"></i>
                            No expenses recorded yet. Click "Record Expense" to track relief vouchers.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>

          <!-- Quick Navigation Hub -->
          <div class="col-lg-4">
            <div class="admin-card h-100 d-flex flex-column">
              <div class="card-header-clean">
                <h5 class="card-title-clean">
                  <i class="bi bi-lightning-charge-fill text-warning"></i> Quick Management
                </h5>
              </div>
              <div class="p-3 d-grid gap-2 flex-grow-1 align-content-start">
                <a routerLink="/donations" class="btn btn-outline-primary btn-sm text-start d-flex align-items-center justify-content-between">
                  <span><i class="bi bi-receipt me-2"></i> Manage Donations &amp; Receipts</span>
                  <i class="bi bi-chevron-right"></i>
                </a>
                <a routerLink="/expenses" class="btn btn-outline-danger btn-sm text-start d-flex align-items-center justify-content-between">
                  <span><i class="bi bi-wallet2 me-2"></i> Relief Expenses &amp; Vouchers</span>
                  <i class="bi bi-chevron-right"></i>
                </a>
                <a routerLink="/causes" class="btn btn-outline-success btn-sm text-start d-flex align-items-center justify-content-between">
                  <span><i class="bi bi-plus-square me-2"></i> Create / Update Cause</span>
                  <i class="bi bi-chevron-right"></i>
                </a>
                <a routerLink="/gallery" class="btn btn-outline-secondary btn-sm text-start d-flex align-items-center justify-content-between">
                  <span><i class="bi bi-camera me-2"></i> Upload Activity Photos</span>
                  <i class="bi bi-chevron-right"></i>
                </a>
                <a routerLink="/inquiries" class="btn btn-outline-info btn-sm text-start d-flex align-items-center justify-content-between">
                  <span><i class="bi bi-inbox me-2"></i> Review Website Messages</span>
                  <i class="bi bi-chevron-right"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .recent-donations-scroll {
      max-height: 240px;
      overflow-y: auto;
      overflow-x: auto;
      scrollbar-gutter: stable;
    }
    .recent-donations-scroll::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .recent-donations-scroll::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .recent-donations-scroll::-webkit-scrollbar-thumb {
      background: #0f3d63;
      border-radius: 4px;
    }
    .recent-donations-scroll::-webkit-scrollbar-thumb:hover {
      background: #16568a;
    }
  `]
})
export class DashboardComponent implements OnInit {
  isLoading = signal(true);
  stats = signal<DashboardStats | null>(null);
  recentDonations = signal<Donation[]>([]);
  recentExpenses = signal<Expense[]>([]);
  expenseSummary = signal<ExpenseSummary | null>(null);
  typeBreakdown = signal<any[]>([]);
  activeTableTab = signal<'donations' | 'expenses'>('donations');

  // Financial tracking computed properties
  totalDonations = computed(() => {
    return this.stats()?.totalDonationsAmount || 0;
  });

  totalExpenses = computed(() => {
    return this.stats()?.totalExpensesAmount ?? this.expenseSummary()?.overall_total ?? 0;
  });

  netBalance = computed(() => {
    return this.totalDonations() - this.totalExpenses();
  });

  utilizationPercent = computed(() => {
    const d = this.totalDonations();
    if (d <= 0) return 0;
    return Math.min(100, Math.round((this.totalExpenses() / d) * 100));
  });

  tailoringTotal = computed(() => {
    return this.stats()?.tailoringExpenses ?? this.expenseSummary()?.tailoring_total ?? 0;
  });

  rationKitTotal = computed(() => {
    return this.stats()?.rationKitExpenses ?? this.expenseSummary()?.ration_kit_total ?? 0;
  });

  monthlyRationKitTotal = computed(() => {
    return this.stats()?.monthlyRationKitExpenses ?? this.expenseSummary()?.monthly_ration_kit_total ?? 0;
  });

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  formatReceiptNo(d: any): string {
    if (!d) return 'ART20260001';
    if (d.receipt_number) {
      return String(d.receipt_number).replace(/^ART-(\d{4})-?(\d+)/i, (_match: string, y: string, seq: string) => {
        return `ART${y}${seq.padStart(4, '0')}`;
      });
    }
    const year = new Date().getFullYear();
    return `ART${year}${String(d.id || 1).padStart(4, '0')}`;
  }

  getMonthlyContribution(): number {
    const s = this.stats();
    if (s && s.totalMonthly !== undefined && s.totalMonthly !== null) {
      return s.totalMonthly;
    }
    const item = this.typeBreakdown().find(t => 
      t.donation_type === 'monthly_donation' || 
      t.donation_type === 'monthly' || 
      t.donation_type === 'monthly_contribution' ||
      t.donation_type === 'fitra'
    );
    return item ? parseFloat(item.total_amount || 0) : 0;
  }

  getMonthlyDonorsCount(): number {
    const s = this.stats();
    if (s && s.totalMonthlyCount !== undefined && s.totalMonthlyCount !== null) {
      return s.totalMonthlyCount;
    }
    const item = this.typeBreakdown().find(t => 
      t.donation_type === 'monthly_donation' || 
      t.donation_type === 'monthly' || 
      t.donation_type === 'monthly_contribution' ||
      t.donation_type === 'fitra'
    );
    return item ? parseInt(item.count || 0, 10) : 0;
  }

  loadDashboard(): void {
    this.isLoading.set(true);

    // 1. Load general dashboard stats
    this.apiService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.set(res.stats);
          this.recentDonations.set(res.recentDonations || []);
          this.typeBreakdown.set(res.typeBreakdown || []);
          if (res.recentExpenses && res.recentExpenses.length > 0) {
            this.recentExpenses.set(res.recentExpenses);
          }
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats:', err);
        this.isLoading.set(false);
      }
    });

    // 2. Fetch expenses directly for real-time tracking & summary
    this.apiService.getExpenses({ limit: 5 }).subscribe({
      next: (expRes) => {
        if (expRes.success) {
          if (expRes.summary) {
            this.expenseSummary.set(expRes.summary);
          }
          if (expRes.data && (!this.recentExpenses() || this.recentExpenses().length === 0)) {
            this.recentExpenses.set(expRes.data);
          }
        }
      },
      error: (expErr) => {
        console.warn('Expenses fetch notice:', expErr);
      }
    });
  }
}
