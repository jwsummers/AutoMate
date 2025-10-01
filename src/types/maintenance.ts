export type MaintenanceStatus = 'completed' | 'upcoming' | 'overdue';

export interface MaintenanceLog {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;           // 'YYYY-MM-DD'
  mileage: number | null;
  vendor_name: string | null;
  location: string | null;
  invoice_number: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  taxes: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceItem {
  id: string;
  log_id: string;
  type: string;
  description: string | null;
  status: MaintenanceStatus;
  cost: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceLogWithItems extends MaintenanceLog {
  items: MaintenanceItem[];
  totals: {
    items_count: number;
    items_cost: number;
    grand_total: number; // items_cost + labor_cost + parts_cost + taxes
  };
}
