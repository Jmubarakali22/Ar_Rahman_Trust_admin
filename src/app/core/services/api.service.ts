import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Donation, Cause, GalleryItem, Volunteer, ContactInquiry, DashboardStats, Expense, ExpenseSummary, TailoringStudent, StudentStats } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // 1. Dashboard
  getDashboardStats(): Observable<{ success: boolean; stats: DashboardStats; recentDonations: Donation[]; recentExpenses?: Expense[]; monthlyTrends: any[]; typeBreakdown: any[]; recentActivity: any[] }> {
    return this.http.get<any>(`${this.base}/dashboard/stats`);
  }

  // 2. Donations
  getDonations(params: any = {}): Observable<{ success: boolean; data: Donation[]; pagination: any }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/donations`, { params: httpParams });
  }

  getDonation(id: number): Observable<{ success: boolean; donation: Donation }> {
    return this.http.get<any>(`${this.base}/donations/${id}`);
  }

  createDonation(data: Partial<Donation>): Observable<any> {
    return this.http.post<any>(`${this.base}/donations`, data);
  }

  updateDonation(id: number, data: Partial<Donation>): Observable<any> {
    return this.http.put<any>(`${this.base}/donations/${id}`, data);
  }

  deleteDonation(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/donations/${id}`);
  }

  sendDonationReceipt(id: number, email?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/donations/${id}/send-receipt`, { email });
  }

  // 3. Causes
  getCauses(params: any = {}): Observable<{ success: boolean; data: Cause[] }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/causes`, { params: httpParams });
  }

  getCause(id: number): Observable<{ success: boolean; data: Cause }> {
    return this.http.get<any>(`${this.base}/causes/${id}`);
  }

  createCause(formData: FormData | any): Observable<any> {
    return this.http.post<any>(`${this.base}/causes`, formData);
  }

  updateCause(id: number, formData: FormData | any): Observable<any> {
    return this.http.put<any>(`${this.base}/causes/${id}`, formData);
  }

  deleteCause(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/causes/${id}`);
  }

  // 4. Gallery
  getGallery(params: any = {}): Observable<{ success: boolean; data: GalleryItem[] }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/gallery`, { params: httpParams });
  }

  createGallery(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/gallery`, data);
  }

  updateGallery(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/gallery/${id}`, data);
  }

  deleteGallery(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/gallery/${id}`);
  }

  // 5. Volunteers
  getVolunteers(params: any = {}): Observable<{ success: boolean; data: Volunteer[] }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/volunteers`, { params: httpParams });
  }

  createVolunteer(data: Partial<Volunteer>): Observable<any> {
    return this.http.post<any>(`${this.base}/volunteers`, data);
  }

  updateVolunteerStatus(id: number, status: string, notes?: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/volunteers/${id}/status`, { status, notes });
  }

  deleteVolunteer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/volunteers/${id}`);
  }

  // 6. Contact Inquiries
  getContacts(params: any = {}): Observable<{ success: boolean; data: ContactInquiry[] }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/contacts`, { params: httpParams });
  }

  updateContactStatus(id: number, status: string, admin_notes?: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/contacts/${id}/status`, { status, admin_notes });
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/contacts/${id}`);
  }

  // 7. Settings
  getSettings(): Observable<{ success: boolean; settings: any; rows: any[] }> {
    return this.http.get<any>(`${this.base}/settings`);
  }

  updateSettings(data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/settings`, data);
  }

  getActivityLogs(): Observable<{ success: boolean; logs: any[] }> {
    return this.http.get<any>(`${this.base}/settings/activity-logs`);
  }

  // 8. Expenses Tracking
  getExpenses(params: any = {}): Observable<{ success: boolean; data: Expense[]; pagination: any; summary: ExpenseSummary }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/expenses`, { params: httpParams });
  }

  getExpenseStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/expenses/stats`);
  }

  getExpense(id: number): Observable<{ success: boolean; data: Expense }> {
    return this.http.get<any>(`${this.base}/expenses/${id}`);
  }

  createExpense(data: any, receiptFile?: File): Observable<any> {
    if (receiptFile) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      formData.append('receipt', receiptFile);
      return this.http.post<any>(`${this.base}/expenses`, formData);
    }
    return this.http.post<any>(`${this.base}/expenses`, data);
  }

  updateExpense(id: number, data: any, receiptFile?: File): Observable<any> {
    if (receiptFile) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      formData.append('receipt', receiptFile);
      return this.http.put<any>(`${this.base}/expenses/${id}`, formData);
    }
    return this.http.put<any>(`${this.base}/expenses/${id}`, data);
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/expenses/${id}`);
  }

  // 9. Tailoring Students
  getStudents(params: any = {}): Observable<{ success: boolean; data: TailoringStudent[] }> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(`${this.base}/students`, { params: httpParams });
  }

  getStudentStats(): Observable<{ success: boolean; data: StudentStats }> {
    return this.http.get<any>(`${this.base}/students/stats`);
  }

  getStudent(id: number): Observable<{ success: boolean; data: TailoringStudent }> {
    return this.http.get<any>(`${this.base}/students/${id}`);
  }

  createStudent(data: Partial<TailoringStudent>): Observable<any> {
    return this.http.post<any>(`${this.base}/students`, data);
  }

  updateStudent(id: number, data: Partial<TailoringStudent>): Observable<any> {
    return this.http.put<any>(`${this.base}/students/${id}`, data);
  }

  updateStudentStatus(id: number, status: string, notes?: string): Observable<any> {
    return this.http.patch<any>(`${this.base}/students/${id}/status`, { status, notes });
  }

  assignStudentBatch(id: number, data: { batch_number?: string; batch_timing?: string; notes?: string; status?: string }): Observable<any> {
    return this.http.patch<any>(`${this.base}/students/${id}/assign-batch`, data);
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/students/${id}`);
  }
}
