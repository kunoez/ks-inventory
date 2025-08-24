"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, Laptop, Key, Package, UserMinus } from "lucide-react"
import type { Employee, DeviceAssignment, LicenseAssignment } from "@/lib/types"
import { assignmentService } from "@/lib/data-service"

interface EmployeeTableProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employeeId: string) => void
  onView: (employee: Employee) => void
  onOnboard?: (employee: Employee) => void
  onOffboard?: (employee: Employee) => void
}

export function EmployeeTable({ employees, onEdit, onDelete, onView, onOnboard, onOffboard }: EmployeeTableProps) {
  const [deviceAssignments, setDeviceAssignments] = useState<DeviceAssignment[]>([])
  const [licenseAssignments, setLicenseAssignments] = useState<LicenseAssignment[]>([])

  useEffect(() => {
    const loadAssignments = async () => {
      const [devices, licenses] = await Promise.all([
        assignmentService.getDeviceAssignments(),
        assignmentService.getLicenseAssignments()
      ])
      setDeviceAssignments(devices || [])
      setLicenseAssignments(licenses || [])
    }
    loadAssignments()
  }, [employees])

  const getStatusBadge = (status: Employee["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-yellow-100 text-yellow-800",
      terminated: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant="secondary" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getAssignmentCounts = (employeeId: string) => {
    const employeeDevices = deviceAssignments.filter((a) => a.employeeId === employeeId && a.status === "active")
    const employeeLicenses = licenseAssignments.filter((a) => a.employeeId === employeeId && a.status === "active")

    return {
      devices: employeeDevices.length,
      licenses: employeeLicenses.length,
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assignments</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => {
            const assignments = getAssignmentCounts(employee.id)

            return (
              <TableRow key={employee.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                    <div className="text-xs text-muted-foreground">ID: {employee.employeeId}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{employee.department}</Badge>
                </TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{getStatusBadge(employee.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Laptop className="h-4 w-4 text-muted-foreground" />
                      <span>{assignments.devices} devices</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span>{assignments.licenses} licenses</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatDate(employee.startDate)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(employee)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      {onOnboard && (
                        <DropdownMenuItem onClick={() => onOnboard(employee)}>
                          <Package className="mr-2 h-4 w-4" />
                          Onboarding
                        </DropdownMenuItem>
                      )}
                      {onOffboard && (
                        <DropdownMenuItem onClick={() => onOffboard(employee)}>
                          <UserMinus className="mr-2 h-4 w-4" />
                          Offboarding
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(employee.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {employees.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No employees found matching your criteria.</div>
      )}
    </div>
  )
}
