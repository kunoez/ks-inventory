"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Employee, Company } from "@/lib/types"
import { dataService } from "@/lib/data-service"
import { useAuth } from "@/contexts/auth-context"

interface EmployeeFormProps {
  employee?: Employee
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => void
}

const departments = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "IT",
  "Legal",
  "Customer Support",
  "Product",
]

const employeeStatuses: Employee["status"][] = ["active", "inactive", "terminated"]

export function EmployeeForm({ employee, open, onOpenChange, onSubmit }: EmployeeFormProps) {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "Engineering",
    position: "",
    employeeId: "",
    startDate: "",
    status: "active" as Employee["status"],
    companyId: "",
  })

  // Update form data when employee prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (employee) {
        // Format date for input field (YYYY-MM-DD format)
        const formatDateForInput = (dateString: string | undefined) => {
          if (!dateString) return ""
          const date = new Date(dateString)
          return date.toISOString().split('T')[0]
        }

        setFormData({
          firstName: employee.firstName || "",
          lastName: employee.lastName || "",
          email: employee.email || "",
          department: employee.department || "Engineering",
          position: employee.position || "",
          employeeId: employee.employeeId || "",
          startDate: formatDateForInput(employee.startDate),
          status: employee.status || "active",
          companyId: employee.companyId || "",
        })
      } else {
        // Reset form for new employee
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          department: "Engineering",
          position: "",
          employeeId: "",
          startDate: "",
          status: "active",
          companyId: user?.companyId || "", // Auto-select user's company for new employees
        })
      }
    }
  }, [open, employee, user])

  useEffect(() => {
    const loadCompanies = async () => {
      const data = await dataService.getCompanies()
      setCompanies(data || [])
    }
    loadCompanies()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Prepare the data based on whether we're creating or updating
    const employeeData = employee 
      ? {
          // For updates, exclude companyId and employeeId as backend doesn't allow updating these
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          department: formData.department,
          position: formData.position,
          startDate: formData.startDate,
          status: formData.status,
        }
      : {
          // For creation, include all fields
          ...formData,
          companyId: formData.companyId || undefined,
        }

    onSubmit(employeeData)
    onOpenChange(false)

    // Reset form if creating new employee
    if (!employee) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        department: "Engineering",
        position: "",
        employeeId: "",
        startDate: "",
        status: "active",
        companyId: "",
      })
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update employee information" : "Enter the details for the new employee"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="john.smith@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => updateField("employeeId", e.target.value)}
                placeholder="EMP001"
                required
                disabled={!!employee} // Make read-only when editing
                className={employee ? "bg-gray-50" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => updateField("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employeeStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => updateField("position", e.target.value)}
                placeholder="Senior Developer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select 
                value={formData.companyId} 
                onValueChange={(value) => updateField("companyId", value)}
                disabled={!!employee} // Make read-only when editing
              >
                <SelectTrigger className={employee ? "bg-gray-50" : ""}>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-company">No Company</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{employee ? "Update Employee" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
