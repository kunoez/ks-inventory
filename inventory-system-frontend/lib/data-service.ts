// Data service layer for managing inventory data
import type {
  Employee,
  Device,
  License,
  DeviceAssignment,
  LicenseAssignment,
  PhoneContract,
  PhoneAssignment,
  DashboardStats,
  DeviceFilters,
  LicenseFilters,
  EmployeeFilters,
  PhoneContractFilters,
  Company,
} from "./types"
import apiClient from "@/lib/api-client"

// Helper to get current company ID from localStorage
const getCurrentCompanyId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // First check if there's a selected company
  const selectedCompany = localStorage.getItem('selectedCompanyId');
  if (selectedCompany) {
    return selectedCompany;
  }
  
  // Fall back to user's default company
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.companyId || null;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper to set current company ID
export const setCurrentCompanyId = (companyId: string | null): void => {
  if (typeof window === 'undefined') return;
  if (companyId) {
    localStorage.setItem('selectedCompanyId', companyId);
  } else {
    localStorage.removeItem('selectedCompanyId');
  }
};

// Employee operations
export const employeeService = {
  getAll: async (filters?: EmployeeFilters): Promise<Employee[]> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        // Return empty array if no company ID (user not logged in)
        return [];
      }
      const params = {
        ...filters,
        companyId,
      };
      return await apiClient.getEmployees(params);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Employee | undefined> => {
    try {
      return await apiClient.getEmployee(id);
    } catch (error) {
      console.error('Error fetching employee:', error);
      return undefined;
    }
  },

  create: async (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">): Promise<Employee> => {
    const companyId = getCurrentCompanyId();
    // If no company ID and employee doesn't have one, we need to handle this
    if (!companyId && !employee.companyId) {
      throw new Error("No company selected. Please select a company first.");
    }
    // Use the employee's companyId if provided, otherwise use the current one
    const finalCompanyId = employee.companyId || companyId;
    return await apiClient.createEmployee({ ...employee, companyId: finalCompanyId });
  },

  update: async (id: string, updates: Partial<Employee>): Promise<Employee | undefined> => {
    try {
      return await apiClient.updateEmployee(id, updates);
    } catch (error) {
      console.error('Error updating employee:', error);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiClient.deleteEmployee(id);
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      return false;
    }
  },

  getAssignments: async (employeeId: string) => {
    try {
      return await apiClient.getEmployeeAssignments(employeeId);
    } catch (error) {
      console.error('Error fetching employee assignments:', error);
      return {
        devices: [],
        licenses: [],
        phoneContracts: [],
        totalAssignments: 0,
      };
    }
  },
}

// Device operations
export const deviceService = {
  getAll: async (filters?: DeviceFilters): Promise<Device[]> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        // Return empty array if no company ID (user not logged in)
        return [];
      }
      const params = {
        ...filters,
        companyId,
      };
      return await apiClient.getDevices(params);
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Device | undefined> => {
    try {
      return await apiClient.getDevice(id);
    } catch (error) {
      console.error('Error fetching device:', error);
      return undefined;
    }
  },

  create: async (device: Omit<Device, "id" | "createdAt" | "updatedAt">): Promise<Device> => {
    const companyId = getCurrentCompanyId();
    // If no company ID and device doesn't have one, we need to handle this
    if (!companyId && !device.companyId) {
      throw new Error("No company selected. Please select a company first.");
    }
    // Use the device's companyId if provided, otherwise use the current one
    const finalCompanyId = device.companyId || companyId;
    return await apiClient.createDevice({ ...device, companyId: finalCompanyId });
  },

  update: async (id: string, updates: Partial<Device>): Promise<Device | undefined> => {
    try {
      return await apiClient.updateDevice(id, updates);
    } catch (error) {
      console.error('Error updating device:', error);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiClient.deleteDevice(id);
      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      return false;
    }
  },

  bulkImport: async (devices: Omit<Device, "id" | "createdAt" | "updatedAt">[]): Promise<{ success: Device[]; failed: any[] }> => {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error("No company selected. Please select a company first.");
    }
    const devicesWithCompany = devices.map(d => ({ ...d, companyId: d.companyId || companyId }));
    return await apiClient.bulkUploadDevices(devicesWithCompany);
  },

  getHistory: async (deviceId: string): Promise<DeviceAssignment[]> => {
    try {
      return await apiClient.getDeviceHistory(deviceId);
    } catch (error) {
      console.error('Error fetching device history:', error);
      return [];
    }
  },
}

// License operations
export const licenseService = {
  getAll: async (filters?: LicenseFilters): Promise<License[]> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        // Return empty array if no company ID (user not logged in)
        return [];
      }
      const params = {
        ...filters,
        companyId,
      };
      return await apiClient.getLicenses(params);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<License | undefined> => {
    try {
      return await apiClient.getLicense(id);
    } catch (error) {
      console.error('Error fetching license:', error);
      return undefined;
    }
  },

  create: async (license: Omit<License, "id" | "createdAt" | "updatedAt">): Promise<License> => {
    const companyId = getCurrentCompanyId();
    // If no company ID and license doesn't have one, we need to handle this
    if (!companyId && !license.companyId) {
      throw new Error("No company selected. Please select a company first.");
    }
    // Use the license's companyId if provided, otherwise use the current one
    const finalCompanyId = license.companyId || companyId;
    return await apiClient.createLicense({ ...license, companyId: finalCompanyId });
  },

  update: async (id: string, updates: Partial<License>): Promise<License | undefined> => {
    try {
      return await apiClient.updateLicense(id, updates);
    } catch (error) {
      console.error('Error updating license:', error);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiClient.deleteLicense(id);
      return true;
    } catch (error) {
      console.error('Error deleting license:', error);
      return false;
    }
  },

  bulkImport: async (licenses: Omit<License, "id" | "createdAt" | "updatedAt">[]): Promise<{ success: License[]; failed: any[] }> => {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error("No company selected. Please select a company first.");
    }
    const results = { success: [] as License[], failed: [] as any[] };
    
    for (const license of licenses) {
      try {
        const created = await apiClient.createLicense({ ...license, companyId: license.companyId || companyId });
        results.success.push(created);
      } catch (error: any) {
        results.failed.push({ data: license, error: error.message });
      }
    }
    
    return results;
  },

  getExpiring: async (days: number = 30): Promise<License[]> => {
    try {
      return await apiClient.getExpiringLicenses(days);
    } catch (error) {
      console.error('Error fetching expiring licenses:', error);
      return [];
    }
  },
}

// Phone contract operations
export const phoneContractService = {
  getAll: async (filters?: PhoneContractFilters): Promise<PhoneContract[]> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        // Return empty array if no company ID (user not logged in)
        return [];
      }
      const params = {
        ...filters,
        companyId,
      };
      return await apiClient.getPhoneContracts(params);
    } catch (error) {
      console.error('Error fetching phone contracts:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<PhoneContract | undefined> => {
    try {
      return await apiClient.getPhoneContract(id);
    } catch (error) {
      console.error('Error fetching phone contract:', error);
      return undefined;
    }
  },

  create: async (contract: Omit<PhoneContract, "id" | "createdAt" | "updatedAt">): Promise<PhoneContract> => {
    const companyId = getCurrentCompanyId();
    // If no company ID and contract doesn't have one, we need to handle this
    if (!companyId && !contract.companyId) {
      throw new Error("No company selected. Please select a company first.");
    }
    // Use the contract's companyId if provided, otherwise use the current one
    const finalCompanyId = contract.companyId || companyId;
    return await apiClient.createPhoneContract({ ...contract, companyId: finalCompanyId });
  },

  update: async (id: string, updates: Partial<PhoneContract>): Promise<PhoneContract | undefined> => {
    try {
      return await apiClient.updatePhoneContract(id, updates);
    } catch (error) {
      console.error('Error updating phone contract:', error);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiClient.deletePhoneContract(id);
      return true;
    } catch (error) {
      console.error('Error deleting phone contract:', error);
      return false;
    }
  },
}

// Assignment operations
export const assignmentService = {
  assignDevice: async (deviceId: string, employeeId: string): Promise<DeviceAssignment | null> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return await apiClient.assignDevice({
        deviceId,
        employeeId,
        assignedBy: user.id || 'system',
      });
    } catch (error) {
      console.error('Error assigning device:', error);
      return null;
    }
  },

  unassignDevice: async (deviceId: string, notes?: string): Promise<boolean> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await apiClient.unassignDevice(deviceId, user.id || 'system', notes);
      return true;
    } catch (error) {
      console.error('Error unassigning device:', error);
      return false;
    }
  },

  assignLicense: async (licenseId: string, employeeId: string): Promise<LicenseAssignment | null> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return await apiClient.assignLicense({
        licenseId,
        employeeId,
        assignedBy: user.id || 'system',
      });
    } catch (error) {
      console.error('Error assigning license:', error);
      return null;
    }
  },

  unassignLicense: async (licenseId: string): Promise<boolean> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await apiClient.unassignLicense(licenseId, user.id || 'system');
      return true;
    } catch (error) {
      console.error('Error unassigning license:', error);
      return false;
    }
  },

  assignPhoneContract: async (phoneContractId: string, employeeId: string): Promise<PhoneAssignment | null> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return await apiClient.assignPhoneContract({
        phoneContractId,
        employeeId,
        assignedBy: user.id || 'system',
      });
    } catch (error) {
      console.error('Error assigning phone contract:', error);
      return null;
    }
  },

  unassignPhoneContract: async (phoneContractId: string): Promise<boolean> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await apiClient.unassignPhoneContract(phoneContractId, user.id || 'system');
      return true;
    } catch (error) {
      console.error('Error unassigning phone contract:', error);
      return false;
    }
  },

  bulkAssign: async (
    employeeId: string,
    items: {
      deviceIds?: string[]
      licenseIds?: string[]
      phoneContractIds?: string[]
    }
  ): Promise<{ success: boolean; assigned: any; failed: any[] }> => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const result = await apiClient.bulkAssign({
        employeeId,
        ...items,
        assignedBy: user.id || 'system',
      });
      return {
        success: true,
        assigned: result,
        failed: [],
      };
    } catch (error) {
      console.error('Error bulk assigning:', error);
      return {
        success: false,
        assigned: { devices: [], licenses: [], phoneContracts: [] },
        failed: [],
      };
    }
  },

  getDeviceAssignments: async (): Promise<DeviceAssignment[]> => {
    try {
      const companyId = getCurrentCompanyId();
      const response = await apiClient.getDeviceAssignments(companyId || undefined);
      return response;
    } catch (error) {
      console.error('Error fetching device assignments:', error);
      return [];
    }
  },

  getLicenseAssignments: async (): Promise<LicenseAssignment[]> => {
    try {
      const companyId = getCurrentCompanyId();
      const response = await apiClient.getLicenseAssignments(companyId || undefined);
      return response;
    } catch (error) {
      console.error('Error fetching license assignments:', error);
      return [];
    }
  },

  getPhoneAssignments: async (): Promise<PhoneAssignment[]> => {
    try {
      const companyId = getCurrentCompanyId();
      const response = await apiClient.getPhoneAssignments(companyId || undefined);
      return response;
    } catch (error) {
      console.error('Error fetching phone assignments:', error);
      return [];
    }
  },
}

// Company operations
export const companyService = {
  getAll: async (): Promise<Company[]> => {
    return await apiClient.getCompanies();
  },

  getById: async (id: string): Promise<Company | undefined> => {
    try {
      return await apiClient.getCompany(id);
    } catch (error) {
      console.error('Error fetching company:', error);
      return undefined;
    }
  },
}

// Dashboard operations
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const companyId = getCurrentCompanyId();
      const stats = await apiClient.getDashboardStats(companyId || undefined);
      
      // Transform backend response to match frontend DashboardStats type
      return {
        totalEmployees: stats.totalEmployees || 0,
        activeEmployees: stats.activeEmployees || 0,
        totalDevices: stats.totalDevices || 0,
        assignedDevices: stats.assignedDevices || 0,
        totalLicenses: stats.totalLicenses || 0,
        activeLicenses: stats.activeLicenses || 0,
        phoneContracts: stats.phoneContracts || 0,
        activePhoneContracts: stats.activePhoneContracts || 0,
        recentActivity: stats.recentActivity || [],
        devicesByType: stats.devicesByType || {},
        licensesByType: stats.licensesByType || {},
        expiringLicenses: stats.expiringLicenses || [],
        maintenanceDevices: stats.maintenanceDevices || [],
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats on error
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalDevices: 0,
        assignedDevices: 0,
        totalLicenses: 0,
        activeLicenses: 0,
        phoneContracts: 0,
        activePhoneContracts: 0,
        recentActivity: [],
        devicesByType: {},
        licensesByType: {},
        expiringLicenses: [],
        maintenanceDevices: [],
      };
    }
  },
}

// Unified data service export for backward compatibility
export const dataService = {
  employees: employeeService,
  devices: deviceService,
  licenses: licenseService,
  phoneContracts: phoneContractService,
  assignments: assignmentService,
  dashboard: dashboardService,
  companies: companyService,
  // Add method aliases for backward compatibility
  getCompanies: () => companyService.getAll(),
  getPhoneContracts: () => phoneContractService.getAll(),
  getPhoneAssignments: () => assignmentService.getPhoneAssignments(),
  getEmployees: () => employeeService.getAll(),
}