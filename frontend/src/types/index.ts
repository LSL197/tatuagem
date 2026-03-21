export type UserRole = "admin" | "artist" | "receptionist" | "client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  slug?: string;
  commission_pct: number;
  theme_json?: Record<string, unknown>;
  bio?: string;
  styles?: string[];
  avatar_url?: string;
  banner_url?: string;
  social_links?: Record<string, string>;
  is_active: boolean;
  created_at: string;
  portfolio_items: PortfolioItem[];
}

export interface PortfolioItem {
  id: string;
  image_url: string;
  category?: string;
  order_index: number;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  artist_id: string;
  client_name: string;
  client_phone: string;
  service: string;
  datetime: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes?: string;
  price?: number;
  created_at: string;
}

export type LeadSource = "instagram" | "whatsapp" | "link_bio" | "manual";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  tags: string[];
  appointment_id?: string;
  created_at: string;
}

export interface FinancialRecord {
  id: string;
  appointment_id?: string;
  artist_id?: string;
  type: "income" | "expense" | "commission";
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

export interface KPIMetrics {
  leads: number;
  appointments: number;
  avg_ticket: number;
  flows_triggered: number;
}

export interface Automation {
  id: string;
  name: string;
  trigger_type: "keyword_instagram" | "keyword_whatsapp";
  trigger_config: Record<string, unknown>;
  flow_json: FlowJSON;
  active: boolean;
}

export interface FlowJSON {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
