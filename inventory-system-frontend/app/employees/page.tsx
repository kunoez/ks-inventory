"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, UserPlus } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { EmployeeTable } from "@/components/employees/employee-table"
import { EmployeeForm } from "@/components/employees/employee-form"
import { EmployeeProfile } from "@/components/employees/employee-profile"
import { HireWizard } from "@/components/employees/hire-wizard"
import { OffboardingModal } from "@/components/employees/offboarding-modal"
import { employeeService } from "@/lib/data-service"
import type { Employee, EmployeeFilters } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [filters, setFilters] = useState<EmployeeFilters>({})
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>()
  const [viewingEmployeeId, setViewingEmployeeId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isHireWizardOpen, setIsHireWizardOpen] = useState(false)
  const [onboardingEmployee, setOnboardingEmployee] = useState<Employee | undefined>()
  const [offboardingEmployee, setOffboardingEmployee] = useState<Employee | null>(null)
  const [isOffboardingModalOpen, setIsOffboardingModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    const loadFiltered = async () => {
      const filtered = await employeeService.getAll(filters)
      setFilteredEmployees(filtered || [])
    }
    loadFiltered()
  }, [employees, filters])

  const loadEmployees = async () => {
    const allEmployees = await employeeService.getAll()
    setEmployees(allEmployees || [])
  }

  const handleAddEmployee = () => {
    setSelectedEmployee(undefined)
    setIsFormOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsFormOpen(true)
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await employeeService.delete(employeeId)
        await loadEmployees()
        toast({
          title: "Employee deleted",
          description: "The employee has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while deleting the employee.",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployeeId(employee.id)
  }

  const handleOnboardEmployee = (employee: Employee) => {
    setOnboardingEmployee(employee)
    setIsHireWizardOpen(true)
  }

  const handleOffboardEmployee = (employee: Employee) => {
    setOffboardingEmployee(employee)
    setIsOffboardingModalOpen(true)
  }

  const handleFormSubmit = async (employeeData: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (selectedEmployee) {
        // Update existing employee
        const updated = await employeeService.update(selectedEmployee.id, employeeData)
        if (updated) {
          await loadEmployees()
          toast({
            title: "Employee updated",
            description: "The employee has been successfully updated.",
          })
        }
      } else {
        // Create new employee
        await employeeService.create(employeeData)
        await loadEmployees()
        toast({
          title: "Employee added",
          description: "The new employee has been successfully added.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while saving the employee.",
        variant: "destructive",
      })
    }
  }

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search })
  }

  const handleHireWizardComplete = () => {
    loadEmployees()
    setOnboardingEmployee(undefined)
  }

  const handleHireWizardClose = (open: boolean) => {
    setIsHireWizardOpen(open)
    if (!open) {
      setOnboardingEmployee(undefined)
    }
  }

  const handleOffboardingComplete = () => {
    loadEmployees()
    setOffboardingEmployee(null)
    setIsOffboardingModalOpen(false)
  }

  if (viewingEmployeeId) {
    return (
      <ProtectedRoute requiredRole="user">
        <AppLayout>
          <EmployeeProfile employeeId={viewingEmployeeId} onBack={() => setViewingEmployeeId(null)} />
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Employee Management</h1>
              <p className="text-muted-foreground">Manage employees and their assignments</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsHireWizardOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Hire Employee
              </Button>
              <Button onClick={handleAddEmployee} variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input
              placeholder="Search employees..."
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Employees ({filteredEmployees.length})</h2>
              </div>
              <EmployeeTable
                employees={filteredEmployees}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                onView={handleViewEmployee}
                onOnboard={handleOnboardEmployee}
                onOffboard={handleOffboardEmployee}
              />
            </div>
          </div>
        </div>

        <EmployeeForm
          employee={selectedEmployee}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
        />

        <HireWizard 
          open={isHireWizardOpen} 
          onOpenChange={handleHireWizardClose} 
          onComplete={handleHireWizardComplete}
          employee={onboardingEmployee}
          mode={onboardingEmployee ? "onboard" : "hire"}
        />

        <OffboardingModal
          employee={offboardingEmployee}
          open={isOffboardingModalOpen}
          onOpenChange={setIsOffboardingModalOpen}
          onComplete={handleOffboardingComplete}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
