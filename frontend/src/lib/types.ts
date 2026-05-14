export type Role = "ADMIN" | "CREW";

export interface User {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Ship {
  id: number;
  name: string;
}

export type MaintenanceStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface MaintenanceTask {
  id: number;
  shipId: number;
  title: string;
  description: string;
  status: MaintenanceStatus;
  dueDate: string;
  createdAt: string;
  ship?: Ship;
  creator?: { id: number; email: string };
  notes?: string | null;
}

export type DrillStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface AttendanceRecord {
  id: number;
  drillId: number;
  crewId: number;
  attended: boolean;
  crew?: { id: number; email: string };
}

export interface SafetyDrill {
  id: number;
  shipId: number;
  title: string;
  description: string;
  scheduledDate: string;
  status: DrillStatus;
  createdAt: string;
  ship?: Ship;
  creator?: { id: number; email: string };
  attendance?: AttendanceRecord[];
  _count?: { attendance: number };
}

export interface ShipCompliance {
  shipId: number;
  shipName: string;
  maintenanceMetrics: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: string;
  };
  drillMetrics: {
    totalDrills: number;
    totalAttendanceRecords?: number;
    attendedCount?: number;
    attendanceRate: string;
  };
  complianceScore: number;
  status: "Good" | "Fair" | "At Risk";
}

export interface ComplianceDashboard {
  totalShips?: number;
  ships?: ShipCompliance[];
  overallScore?: number;
  pendingMaintenance?: number;
  overdueMaintenance?: number;
  missedDrills?: number;
  [key: string]: unknown;
}

export interface ApiError {
  error?: string;
  message?: string;
  statusCode?: number;
}
