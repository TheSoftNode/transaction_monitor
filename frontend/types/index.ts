// API Base URL
// Relative path so requests hit the Vercel origin over HTTPS and are
// proxied to the backend server-side (see rewrites in next.config.ts).
export const API_URL = "/api/v1"

// Auth types
export interface User {
  id: string
  username: string
  email: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// Customer types
export interface Customer {
  id: string
  customer_reference: string
  full_name: string
  email: string
  phone?: string
  country_code: string
  risk_level: "low" | "medium" | "high"
  is_blacklisted: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CustomerListItem {
  id: string
  customer_reference: string
  full_name: string
  email: string
  country_code: string
  risk_level: "low" | "medium" | "high"
  is_blacklisted: boolean
  created_at: string
}

// Transaction types
export interface Transaction {
  id: string
  transaction_reference: string
  customer: string
  customer_details?: CustomerListItem
  amount: string
  currency: string
  transaction_type: "deposit" | "withdrawal" | "transfer"
  status: "pending" | "approved" | "rejected" | "under_review"
  risk_score: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  processed_at?: string
}

export interface TransactionListItem {
  id: string
  transaction_reference: string
  customer: string
  customer_name: string
  amount: string
  currency: string
  transaction_type: "deposit" | "withdrawal" | "transfer"
  status: "pending" | "approved" | "rejected" | "under_review"
  risk_score: number
  created_at: string
}

// Alert types
export interface Alert {
  id: string
  transaction: string
  transaction_details?: TransactionListItem
  transaction_reference?: string
  rule_name: string
  severity: "low" | "medium" | "high" | "critical"
  message: string
  status: "active" | "resolved" | "false_positive"
  resolved_by?: string
  resolved_by_username?: string
  triggered_at: string
  resolved_at?: string
}

export interface AlertListItem {
  id: string
  transaction: string
  transaction_reference: string
  rule_name: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "false_positive"
  triggered_at: string
}

// Audit Log types
export interface AuditLog {
  id: string
  transaction: string
  transaction_reference: string
  event_type: string
  actor?: string
  actor_username?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: string
}

// Pagination
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
