export interface Admin {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'moderator' | string;
  permissions?: string[];
  avatar?: string;
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  user_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserRoleItem {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  custom_permissions?: string[] | null;
  effective_permissions: string[];
  is_superadmin: boolean;
  created_at?: string;
}

export interface AvailablePage {
  key: string;
  name: string;
  description: string;
}

export interface Donation {
  id: number;
  donor_name: string;
  donor_email?: string;
  donor_phone: string;
  amount: number;
  donation_type: 'zakat' | 'sadaqah' | 'monthly_contribution' | 'monthly_donation' | string;
  payment_method: 'upi' | 'bank_transfer' | 'cash' | 'card';
  transaction_id?: string;
  status: 'verified' | 'pending' | 'failed' | 'completed' | string;
  notes?: string;
  receipt_number?: string;
  created_at: string;
}

export interface Cause {
  id: number;
  title: string;
  category: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  image_url: string;
  status: 'active' | 'completed' | 'paused';
  featured: boolean | number;
  created_at: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  caption?: string;
  category: string;
  image_url: string;
  order_num: number;
  is_visible: boolean | number;
  created_at: string;
}

export interface Volunteer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  occupation?: string;
  availability: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
}

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  admin_notes?: string;
  created_at: string;
}

export interface DashboardStats {
  totalDonationsAmount: number;
  totalDonationsCount: number;
  totalZakat: number;
  totalSadaqah: number;
  totalMonthly?: number;
  totalMonthlyCount?: number;
  pendingDonationsCount: number;
  totalCauses: number;
  activeCauses: number;
  totalTarget: number;
  totalRaised: number;
  totalPhotos: number;
  totalVolunteers: number;
  approvedVolunteers: number;
  pendingVolunteers: number;
  totalInquiries: number;
  unreadInquiries: number;
  totalExpensesAmount?: number;
  totalExpensesCount?: number;
  tailoringExpenses?: number;
  rationKitExpenses?: number;
  medicalAidExpenses?: number;
  monthlyRationKitExpenses?: number;
  netBalance?: number;
}

export interface Expense {
  id: number;
  title: string;
  category: 'Tailoring' | 'Ration Kit' | 'Medical Aid' | 'Monthly Ration Kit' | string;
  amount: number;
  expense_date: string;
  payment_method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | string;
  vendor_payee?: string;
  voucher_number?: string;
  receipt_url?: string;
  status: 'Paid' | 'Pending' | 'Verified' | string;
  notes?: string;
  recorded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseSummary {
  overall_total: number;
  tailoring_total: number;
  ration_kit_total: number;
  medical_aid_total?: number;
  monthly_ration_kit_total: number;
  current_month_total: number;
  total_count: number;
}

export interface TailoringStudent {
  id: number;
  student_code: string;
  full_name: string;
  phone: string;
  whatsapp_number?: string;
  email?: string;
  age?: number;
  dob?: string;
  marital_status?: string;
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  father_spouse_occupation?: string;
  aadhar_card_url?: string;
  address?: string;
  qualification?: string;
  batch_preference: 'Morning' | 'Afternoon' | 'Evening' | string;
  has_prior_experience?: string;
  family_income?: string;
  guardian_name?: string;
  status: 'applied' | 'selected' | 'in_training' | 'completed' | 'rejected' | string;
  selected_date?: string;
  completed_date?: string;
  notes?: string;
  source?: string;
  created_at: string;
  updated_at?: string;
}

export interface StudentStats {
  total: number;
  applied: number;
  selected: number;
  in_training: number;
  completed: number;
  rejected: number;
}
