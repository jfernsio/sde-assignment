import axios, { AxiosInstance } from 'axios';

// ============ TYPE DEFINITIONS ============

export type UserRole = 'ADMIN' | 'CREW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type DrillStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  token?: string;
}

export interface MaintenanceTask {
  id: number;
  shipId: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SafeDrill {
  id: number;
  shipId: number;
  title: string;
  description: string;
  status: DrillStatus;
  scheduledDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrillAttendance {
  id: number;
  drillId: number;
  crewId: number;
  attended: boolean;
  recordedAt?: string;
}

export interface ShipCompliance {
  shipId: number;
  complianceScore: number;
  pendingTasks: number;
  completedTasks: number;
  missedDrills: number;
  lastUpdated: string;
}

export interface ComplianceDashboard {
  ships: ShipCompliance[];
  overallScore: number;
  totalPendingTasks: number;
  upcomingDrills: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
}

// ============ API CLIENT ============

class MaritimeApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          this.token = null;
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );

    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // ---- AUTH ----
  async register(email: string, password: string, role: UserRole): Promise<ApiResponse<User>> {
    return this.client.post('/api/auth/register', { email, password, role });
  }

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    return this.client.post('/api/auth/login', { email, password });
  }

  // ---- MAINTENANCE TASKS ----
  async createTask(
    shipId: number,
    title: string,
    description: string,
    dueDate: string
  ): Promise<ApiResponse<MaintenanceTask>> {
    return this.client.post('/api/maintenance', {
      shipId,
      title,
      description,
      dueDate
    });
  }

  async listTasks(shipId?: number, status?: TaskStatus): Promise<ApiResponse<MaintenanceTask[]>> {
    const params = new URLSearchParams();
    if (shipId) params.append('shipId', shipId.toString());
    if (status) params.append('status', status);
    return this.client.get(`/api/maintenance?${params}`);
  }

  async getTask(id: number): Promise<ApiResponse<MaintenanceTask>> {
    return this.client.get(`/api/maintenance/${id}`);
  }

  async updateTask(id: number, updates: Partial<MaintenanceTask>): Promise<ApiResponse<MaintenanceTask>> {
    return this.client.put(`/api/maintenance/${id}`, updates);
  }

  async deleteTask(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.delete(`/api/maintenance/${id}`);
  }

  // ---- SAFETY DRILLS ----
  async createDrill(
    shipId: number,
    title: string,
    description: string,
    scheduledDate: string
  ): Promise<ApiResponse<SafeDrill>> {
    return this.client.post('/api/drills', {
      shipId,
      title,
      description,
      scheduledDate
    });
  }

  async listDrills(): Promise<ApiResponse<SafeDrill[]>> {
    return this.client.get('/api/drills');
  }

  async getDrill(id: number): Promise<ApiResponse<SafeDrill>> {
    return this.client.get(`/api/drills/${id}`);
  }

  async recordAttendance(
    drillId: number,
    crewId: number,
    attended: boolean
  ): Promise<ApiResponse<DrillAttendance>> {
    return this.client.post(`/api/drills/${drillId}/attendance`, {
      crewId,
      attended
    });
  }

  async getAttendance(drillId: number): Promise<ApiResponse<DrillAttendance[]>> {
    return this.client.get(`/api/drills/${drillId}/attendance`);
  }

  async deleteDrill(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.client.delete(`/api/drills/${id}`);
  }

  // ---- COMPLIANCE ----
  async getShipCompliance(shipId: number): Promise<ApiResponse<ShipCompliance>> {
    return this.client.get(`/api/compliance/ships/${shipId}`);
  }

  async getDashboard(): Promise<ApiResponse<ComplianceDashboard>> {
    return this.client.get('/api/compliance/dashboard');
  }
}

export const apiClient = new MaritimeApiClient();
