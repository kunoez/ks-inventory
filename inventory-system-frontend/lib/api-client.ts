import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip auth header for login endpoints
        const isAuthEndpoint = config.url?.includes('/auth/login') || 
                               config.url?.includes('/auth/azure-login') ||
                               config.url?.includes('/auth/refresh');
        
        if (!isAuthEndpoint) {
          const token = this.getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Skip token refresh for auth endpoints
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                               originalRequest?.url?.includes('/auth/azure-login') ||
                               originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private getRefreshTokenValue(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshTokenValue();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        this.setTokens(accessToken, newRefreshToken);
        return accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth methods
  async login(email: string, password: string) {
    // Use axios directly without interceptors for auth endpoints
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { accessToken, refreshToken, user } = response.data;
    
    this.setTokens(accessToken, refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  }

  async logout() {
    const refreshToken = this.getRefreshTokenValue();
    if (refreshToken) {
      try {
        await this.client.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.clearTokens();
  }

  async loginWithAzure(azureData: any) {
    // Use axios directly without interceptors for auth endpoints
    const response = await axios.post(`${API_BASE_URL}/auth/azure-login`, azureData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const { accessToken, refreshToken, user } = response.data;
    
    this.setTokens(accessToken, refreshToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async getCurrentUserStats() {
    const response = await this.client.get('/auth/me/stats');
    return response.data;
  }

  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async getUser(userId: string) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async createUser(data: any) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async updateUser(userId: string, data: any) {
    const response = await this.client.patch(`/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete(`/users/${userId}`);
    return response.data;
  }

  // Company methods
  async getCompanies() {
    const response = await this.client.get('/companies');
    return response.data;
  }

  async getCompany(id: string) {
    const response = await this.client.get(`/companies/${id}`);
    return response.data;
  }

  async createCompany(data: { name: string; code: string; description?: string; address?: string; contactEmail?: string; contactPhone?: string }) {
    const response = await this.client.post('/companies', data);
    return response.data;
  }

  async updateCompany(id: string, data: Partial<{ name: string; code: string; description?: string; address?: string; contactEmail?: string; contactPhone?: string }>) {
    const response = await this.client.patch(`/companies/${id}`, data);
    return response.data;
  }

  async deleteCompany(id: string) {
    await this.client.delete(`/companies/${id}`);
  }

  // Employee methods
  async getEmployees(params?: any) {
    const response = await this.client.get('/employees', { params });
    return response.data;
  }

  async getEmployee(id: string) {
    const response = await this.client.get(`/employees/${id}`);
    return response.data;
  }

  async createEmployee(data: any) {
    const response = await this.client.post('/employees', data);
    return response.data;
  }

  async updateEmployee(id: string, data: any) {
    const response = await this.client.patch(`/employees/${id}`, data);
    return response.data;
  }

  async deleteEmployee(id: string) {
    await this.client.delete(`/employees/${id}`);
  }

  async getEmployeeAssignments(id: string) {
    const response = await this.client.get(`/employees/${id}/assignments`);
    return response.data;
  }

  // Device methods
  async getDevices(params?: any) {
    const response = await this.client.get('/devices', { params });
    return response.data;
  }

  async getDevice(id: string) {
    const response = await this.client.get(`/devices/${id}`);
    return response.data;
  }

  async createDevice(data: any) {
    const response = await this.client.post('/devices', data);
    return response.data;
  }

  async updateDevice(id: string, data: any) {
    const response = await this.client.patch(`/devices/${id}`, data);
    return response.data;
  }

  async deleteDevice(id: string) {
    await this.client.delete(`/devices/${id}`);
  }

  async getDeviceHistory(id: string) {
    const response = await this.client.get(`/devices/${id}/history`);
    return response.data;
  }

  async bulkUploadDevices(devices: any[]) {
    const response = await this.client.post('/devices/bulk-upload', { devices });
    return response.data;
  }

  // License methods
  async getLicenses(params?: any) {
    const response = await this.client.get('/licenses', { params });
    return response.data;
  }

  async getLicense(id: string) {
    const response = await this.client.get(`/licenses/${id}`);
    return response.data;
  }

  async createLicense(data: any) {
    const response = await this.client.post('/licenses', data);
    return response.data;
  }

  async updateLicense(id: string, data: any) {
    const response = await this.client.patch(`/licenses/${id}`, data);
    return response.data;
  }

  async deleteLicense(id: string) {
    await this.client.delete(`/licenses/${id}`);
  }

  async getExpiringLicenses(days: number = 30) {
    const response = await this.client.get(`/licenses/expiring`, { params: { days } });
    return response.data;
  }

  // Phone contract methods
  async getPhoneContracts(params?: any) {
    const response = await this.client.get('/phone-contracts', { params });
    return response.data;
  }

  async getPhoneContract(id: string) {
    const response = await this.client.get(`/phone-contracts/${id}`);
    return response.data;
  }

  async createPhoneContract(data: any) {
    const response = await this.client.post('/phone-contracts', data);
    return response.data;
  }

  async updatePhoneContract(id: string, data: any) {
    const response = await this.client.patch(`/phone-contracts/${id}`, data);
    return response.data;
  }

  async deletePhoneContract(id: string) {
    await this.client.delete(`/phone-contracts/${id}`);
  }

  // Assignment methods
  async getRecentActivity(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/assignments/activity', { params });
    return response.data;
  }

  async assignDevice(data: { deviceId: string; employeeId: string; assignedBy: string }) {
    const response = await this.client.post('/assignments/device', data);
    return response.data;
  }

  async unassignDevice(deviceId: string, returnedBy: string, notes?: string) {
    const response = await this.client.post('/assignments/device/unassign', {
      deviceId,
      returnedBy,
      notes,
    });
    return response.data;
  }

  async assignLicense(data: { licenseId: string; employeeId: string; assignedBy: string }) {
    const response = await this.client.post('/assignments/license', data);
    return response.data;
  }

  async unassignLicense(licenseId: string, returnedBy: string) {
    const response = await this.client.post('/assignments/license/unassign', {
      licenseId,
      returnedBy,
    });
    return response.data;
  }

  async assignPhoneContract(data: { phoneContractId: string; employeeId: string; assignedBy: string }) {
    const response = await this.client.post('/assignments/phone', data);
    return response.data;
  }

  async unassignPhoneContract(phoneContractId: string, returnedBy: string) {
    const response = await this.client.post('/assignments/phone/return', {
      phoneContractId,
      returnedBy,
    });
    return response.data;
  }

  async bulkAssign(data: {
    employeeId: string;
    deviceIds?: string[];
    licenseIds?: string[];
    phoneContractIds?: string[];
    assignedBy: string;
  }) {
    const response = await this.client.post('/assignments/bulk', data);
    return response.data;
  }

  async getDeviceAssignments(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/assignments/devices', { params });
    return response.data;
  }

  async getLicenseAssignments(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/assignments/licenses', { params });
    return response.data;
  }

  async getPhoneAssignments(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/assignments/phones', { params });
    return response.data;
  }

  // Dashboard/Statistics methods
  async getDashboardStats(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/dashboard/stats', { params });
    return response.data;
  }

  async getResourceUtilization(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/dashboard/resource-utilization', { params });
    return response.data;
  }

  async getDashboardAlerts(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/dashboard/alerts', { params });
    return response.data;
  }

  async getAvailableDevices(companyId?: string, limit?: number) {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    if (limit) params.limit = limit;
    const response = await this.client.get('/dashboard/available-devices', { params });
    return response.data;
  }

  async getAvailableLicenses(companyId?: string, limit?: number) {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    if (limit) params.limit = limit;
    const response = await this.client.get('/dashboard/available-licenses', { params });
    return response.data;
  }

  async getDeviceStats(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/devices/stats', { params });
    return response.data;
  }

  // Azure AD methods
  async getAzureConfig() {
    const response = await this.client.get('/azure-ad/config');
    return response.data;
  }

  async fetchAzureUsers(credentials?: { tenantId?: string; clientId?: string; clientSecret?: string }) {
    const response = await this.client.post('/azure-ad/fetch-users', credentials || {});
    return response.data;
  }

  async syncAzureEmployee(employeeData: {
    companyId: string;
    azureUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    position: string;
    employeeId: string;
    officeLocation?: string;
    mobilePhone?: string;
  }) {
    const response = await this.client.post('/azure-ad/sync-employee', employeeData);
    return response.data;
  }

  async validateAzureCredentials(credentials: { tenantId: string; clientId: string; clientSecret: string }) {
    const response = await this.client.post('/azure-ad/validate-credentials', credentials);
    return response.data;
  }

  // Report Activity methods
  async getRecentReportActivity(companyId?: string, limit?: number) {
    const params: any = {};
    if (companyId) params.companyId = companyId;
    if (limit) params.limit = limit;
    const response = await this.client.get('/report-activity/recent', { params });
    return response.data;
  }

  async getReportActivityByUser(userId: string, limit?: number) {
    const params: any = { userId };
    if (limit) params.limit = limit;
    const response = await this.client.get('/report-activity/by-user', { params });
    return response.data;
  }

  async getReportActivityByType(type: string, companyId?: string, limit?: number) {
    const params: any = { type };
    if (companyId) params.companyId = companyId;
    if (limit) params.limit = limit;
    const response = await this.client.get('/report-activity/by-type', { params });
    return response.data;
  }

  async getReportStatistics(companyId?: string) {
    const params = companyId ? { companyId } : {};
    const response = await this.client.get('/report-activity/statistics', { params });
    return response.data;
  }

  async logReportActivity(data: {
    reportType: string;
    reportName: string;
    format: string;
    generatedBy: string;
    generatedByEmail?: string;
    generatedByUserId?: string;
    description?: string;
    parameters?: any;
    filePath?: string;
    fileSize?: number;
    recordCount?: number;
    success?: boolean;
    errorMessage?: string;
    companyId?: string;
  }) {
    const response = await this.client.post('/report-activity', data);
    return response.data;
  }

  // Notification methods
  async getNotifications(limit?: number) {
    const params = limit ? { limit } : {};
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async getUnreadNotifications() {
    const response = await this.client.get('/notifications/unread');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async getNotificationsByCategory(category: string) {
    const response = await this.client.get(`/notifications/category/${category}`);
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.patch('/notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(id: string) {
    await this.client.delete(`/notifications/${id}`);
  }

  async deleteAllNotifications() {
    await this.client.delete('/notifications');
  }

  async createNotification(data: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    category?: 'device' | 'license' | 'employee' | 'system' | 'expiry' | 'assignment' | 'maintenance';
    userId: string;
    entityId?: string;
    entityType?: string;
    actionUrl?: string;
  }) {
    const response = await this.client.post('/notifications', data);
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();
export default apiClient;