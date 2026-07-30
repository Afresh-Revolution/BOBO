export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "registered"
  | "submitted";

export type Application = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  age?: number;
  city?: string;
  state?: string;
  stateOfResidence?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt?: string;
  videoUrl?: string;
  birthCertUrl?: string;
  healthInfo?: string;
  reason?: string;
  nin?: string;
  motherMaidenName?: string;
  tiktokUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  facebookUrl?: string;
  promptChoice?: string;
};

export type DashboardStats = {
  applications: number;
  pending: number;
  approved: number;
  registered: number;
  payments: number;
  revenue?: number;
};

export type Payment = {
  id: string;
  applicationId?: string;
  contestantName: string;
  email: string;
  phone?: string;
  age?: number;
  stateOfResidence?: string;
  nin?: string;
  amount: number;
  amountCbc?: number;
  currency?: string;
  status: "pending" | "success" | "failed" | "refunded";
  reference?: string;
  createdAt: string;
  receiptUrl?: string;
  submittedFullName?: string;
};

export type EmailLog = {
  id: string;
  to: string;
  subject: string;
  template?: string;
  status: "sent" | "failed" | "queued";
  createdAt: string;
  error?: string;
};

export type CmsSection = {
  key: string;
  title: string;
  content: Record<string, unknown>;
  updatedAt?: string;
};

export type MediaItem = {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  createdAt: string;
};

export type SiteSetting = {
  key: string;
  label: string;
  value: string | boolean | number;
  type?: "text" | "boolean" | "number" | "textarea";
};

export type AnalyticsData = {
  applicationsByDay?: { date: string; count: number }[];
  statusBreakdown?: { status: string; count: number }[];
  paymentsByDay?: { date: string; amount: number }[];
  totals?: {
    views?: number;
    applications?: number;
    conversions?: number;
  };
};

export type ApiListResponse<T> = {
  ok?: boolean;
  data?: T[];
  items?: T[];
  total?: number;
  error?: string;
};

export type ApiResponse<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
} & T;
