"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, User } from "lucide-react"
import type { Device, Employee, DeviceAssignment } from "@/lib/types"
import { assignmentService, employeeService, deviceService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { UnassignDialog } from "./unassign-dialog"

interface DeviceTableProps {
  devices: Device[]
  onEdit: (device: Device) => void
  onDelete: (deviceId: string) => void
  onView: (device: Device) => void
  onAssign: (device: Device) => void
  onAssignmentUpdate?: () => void
}

export function DeviceTable({ devices, onEdit, onDelete, onView, onAssign, onAssignmentUpdate }: DeviceTableProps) {
  const [dragOverRow, setDragOverRow] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<DeviceAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [unassignDevice, setUnassignDevice] = useState<Device | null>(null)
  const [unassignEmployeeName, setUnassignEmployeeName] = useState<string>("")
  const [isUnassignOpen, setIsUnassignOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      const [assignmentsData, employeesData] = await Promise.all([
        assignmentService.getDeviceAssignments(),
        employeeService.getAll()
      ])
      setAssignments(assignmentsData || [])
      setEmployees(employeesData || [])
    }
    loadData()
  }, [devices])

  const getStatusBadge = (status: Device["status"]) => {
    const variants = {
      available: "bg-green-100 text-green-800",
      assigned: "bg-blue-100 text-blue-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      retired: "bg-gray-100 text-gray-800",
      lost: "bg-red-100 text-red-800",
      damaged: "bg-orange-100 text-orange-800",
    }

    return (
      <Badge variant="secondary" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getConditionBadge = (condition: Device["condition"]) => {
    const variants = {
      excellent: "bg-green-100 text-green-800",
      good: "bg-blue-100 text-blue-800",
      fair: "bg-yellow-100 text-yellow-800",
      poor: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant="secondary" className={variants[condition]}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </Badge>
    )
  }

  const getAssignedEmployee = (deviceId: string) => {
    const assignment = assignments.find((a) => a.deviceId === deviceId && a.status === "active")

    if (assignment) {
      const employee = employees.find((e) => e.id === assignment.employeeId)
      return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown"
    }
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleDragOver = (e: React.DragEvent, device: Device) => {
    e.preventDefault()
    
    if (device.status !== "available") {
      e.dataTransfer.dropEffect = "none"
      return
    }

    e.dataTransfer.dropEffect = "copy"
    setDragOverRow(device.id)
  }

  const handleDragLeave = () => {
    setDragOverRow(null)
  }

  const handleDrop = async (e: React.DragEvent, device: Device) => {
    e.preventDefault()
    setDragOverRow(null)

    if (device.status !== "available") {
      toast({
        title: "Assignment Failed",
        description: "This device is not available for assignment.",
        variant: "destructive",
      })
      return
    }

    try {
      const employeeData = JSON.parse(e.dataTransfer.getData("application/json")) as Employee

      // If it's a phone device, open the assignment dialog to let user choose phone contract
      if (device.type === "phone") {
        // Store employee data for use in the assignment dialog
        localStorage.setItem('pendingAssignmentEmployee', JSON.stringify(employeeData))
        onAssign(device)
        return
      }

      // For non-phone devices, assign directly
      const success = await assignmentService.assignDevice(device.id, employeeData.id)

      if (success) {
        onAssignmentUpdate?.()
        toast({
          title: "Device Assigned",
          description: `${device.name} has been assigned to ${employeeData.firstName} ${employeeData.lastName}.`,
        })
      } else {
        toast({
          title: "Assignment Failed",
          description: "Failed to assign the device. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Invalid employee data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUnassignClick = (device: Device) => {
    const employeeName = getAssignedEmployee(device.id)
    setUnassignDevice(device)
    setUnassignEmployeeName(employeeName || "")
    setIsUnassignOpen(true)
  }

  const handleUnassignConfirm = async (data: { notes: string; condition: Device["condition"] }) => {
    if (!unassignDevice) return

    try {
      // First update the device condition if it changed
      if (data.condition !== unassignDevice.condition) {
        await deviceService.update(unassignDevice.id, { condition: data.condition })
      }

      // Then unassign the device with notes
      const success = await assignmentService.unassignDevice(unassignDevice.id, data.notes)

      if (success) {
        onAssignmentUpdate?.()
        toast({
          title: "Device Unassigned",
          description: `${unassignDevice.name} has been unassigned successfully.`,
        })
        setIsUnassignOpen(false)
        setUnassignDevice(null)
        setUnassignEmployeeName("")
      } else {
        toast({
          title: "Unassign Failed",
          description: "Failed to unassign the device. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error unassigning device:", error)
      toast({
        title: "Unassign Failed",
        description: "An error occurred while unassigning the device.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow
              key={device.id}
              className={`
                ${device.status === "available" ? "cursor-pointer hover:bg-gray-50" : "opacity-90"}
                ${dragOverRow === device.id ? "bg-blue-50 border-blue-200" : ""}
              `}
              onDragOver={(e) => handleDragOver(e, device)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, device)}
            >
              <TableCell>
                <div>
                  <div className="font-medium">{device.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {device.brand} {device.model}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{device.type.charAt(0).toUpperCase() + device.type.slice(1)}</Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{device.serialNumber}</TableCell>
              <TableCell>{getStatusBadge(device.status)}</TableCell>
              <TableCell>{getConditionBadge(device.condition)}</TableCell>
              <TableCell>
                {getAssignedEmployee(device.id) || <span className="text-muted-foreground">Unassigned</span>}
              </TableCell>
              <TableCell>{formatCurrency(device.cost)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(device)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(device)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {device.status === "available" && (
                      <DropdownMenuItem onClick={() => onAssign(device)}>
                        <User className="mr-2 h-4 w-4" />
                        Assign
                      </DropdownMenuItem>
                    )}
                    {device.status === "assigned" && (
                      <DropdownMenuItem onClick={() => handleUnassignClick(device)}>
                        <User className="mr-2 h-4 w-4" />
                        Unassign
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(device.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {devices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No devices found matching your criteria.</div>
      )}
      
      <UnassignDialog
        device={unassignDevice}
        employeeName={unassignEmployeeName}
        open={isUnassignOpen}
        onOpenChange={setIsUnassignOpen}
        onConfirm={handleUnassignConfirm}
      />
    </div>
  )
}
