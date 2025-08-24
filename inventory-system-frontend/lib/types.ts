// Core entity types for the inventory management system

export interface User {
  id: string
  email: string
  name: string
  username?: string
  firstName?: string
  lastName?: string
  role: "admin" | "manager" | "user"
  department?: string
  authMethod?: "local" | "azure"
  azureId?: string | null
  companyId?: string
  company?: Company
  selectedCompanyIds?: string | null
  isActive: boolean
  password?: string // Only used for creation/updates, not returned from API
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  employeeId: string
  startDate: string
  status: "active" | "inactive" | "terminated"
  createdAt: string
  updatedAt: string
  companyId?: string // Added company association
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string
  warrantyExpiry?: string
  cost: number
  status: DeviceStatus
  condition: DeviceCondition
  location?: string
  notes?: string
  createdAt: string
  updatedAt: string
  companyId?: string // Added company association
}

export interface License {
  id: string
  name: string
  type: LicenseType
  vendor: string
  version?: string
  licenseKey?: string
  purchaseDate: string
  expiryDate?: string
  cost: number
  maxUsers: number
  currentUsers: number
  status: LicenseStatus
  notes?: string
  createdAt: string
  updatedAt: string
  companyId?: string // Added company association
}

export interface DeviceAssignment {
  id: string
  deviceId: string
  employeeId: string
  assignedDate: string
  returnDate?: string
  status: AssignmentStatus
  notes?: string
  assignedBy: string
  createdAt: string
  updatedAt: string
}

export interface LicenseAssignment {
  id: string
  licenseId: string
  employeeId: string
  assignedDate: string
  revokedDate?: string
  status: AssignmentStatus
  notes?: string
  assignedBy: string
  createdAt: string
  updatedAt: string
}

// Enum types
export type DeviceType =
  | "laptop"
  | "desktop"
  | "monitor"
  | "phone"
  | "tablet"
  | "printer"
  | "keyboard"
  | "mouse"
  | "headset"
  | "dock"
  | "other"

export type DeviceStatus = "available" | "assigned" | "maintenance" | "retired" | "lost" | "damaged"

export type DeviceCondition = "excellent" | "good" | "fair" | "poor"

export type LicenseType = "software" | "subscription" | "perpetual" | "volume" | "oem"

export type LicenseStatus = "active" | "expired" | "suspended" | "cancelled"

export type AssignmentStatus = "active" | "returned" | "revoked" | "lost"

export type ContractStatus = "active" | "suspended" | "cancelled" | "expired"

// Dashboard statistics type
export interface DashboardStats {
  totalDevices: number
  assignedDevices: number
  availableDevices: number
  totalLicenses: number
  usedLicenseSeats: number
  availableLicenseSeats: number
  totalEmployees: number
  activeEmployees: number
  totalPhoneContracts: number
  assignedPhoneContracts: number
  availablePhoneContracts: number
  upcomingExpirations: number
}

// Filter and search types
export interface DeviceFilters {
  type?: DeviceType[]
  status?: DeviceStatus[]
  condition?: DeviceCondition[]
  assignedTo?: string
  search?: string
}

export interface LicenseFilters {
  type?: LicenseType[]
  status?: LicenseStatus[]
  vendor?: string[]
  expiringWithin?: number // days
  search?: string
}

export interface EmployeeFilters {
  department?: string[]
  status?: ("active" | "inactive" | "terminated")[]
  search?: string
}

export interface PhoneContract {
  id: string
  phoneNumber: string
  carrier: string
  plan: string
  monthlyFee: number
  contractStartDate: string
  contractEndDate?: string
  pin: string
  puk: string
  status: ContractStatus
  dataLimit?: string
  minutes?: string
  sms?: string
  notes?: string
  createdAt: string
  updatedAt: string
  companyId?: string // Added company association
}

export interface PhoneAssignment {
  id: string
  phoneContractId: string
  employeeId: string
  assignedDate: string
  returnDate?: string
  status: AssignmentStatus
  notes?: string
  assignedBy: string
  createdAt: string
  updatedAt: string
}

export interface PhoneContractFilters {
  carrier?: string[]
  status?: ContractStatus[]
  assignedTo?: string
  expiringWithin?: number // days
  search?: string
}

// Added Company interface
export interface Company {
  id: string
  name: string
  code: string // Short code like "ACME", "TECH", etc.
  description?: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface Assignment {
  id: string
  deviceId?: string
  licenseId?: string
  employeeId: string
  assignedAt: string
  returnedAt?: string
  status: AssignmentStatus
  notes?: string
  assignedBy: string
  createdAt: string
  updatedAt: string
  companyId?: string // Added company association
}
