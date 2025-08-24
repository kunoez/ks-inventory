import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, User, DollarSign, Package, History, UserMinus } from "lucide-react"
import type { Device, DeviceAssignment, Employee } from "@/lib/types"
import { assignmentService, employeeService, deviceService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { UnassignDialog } from "./unassign-dialog"

interface DeviceDetailsDialogProps {
  device: Device | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function DeviceDetailsDialog({ device, open, onOpenChange, onUpdate }: DeviceDetailsDialogProps) {
  const [currentAssignment, setCurrentAssignment] = useState<DeviceAssignment | undefined>()
  const [assignmentHistory, setAssignmentHistory] = useState<DeviceAssignment[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<Employee | undefined>()
  const [historyEmployees, setHistoryEmployees] = useState<Record<string, Employee>>({})
  const [loading, setLoading] = useState(false)
  const [isUnassignOpen, setIsUnassignOpen] = useState(false)
  const { toast } = useToast()

  const loadAssignments = async () => {
    if (device && open) {
      setLoading(true)
      try {
        const assignments = await assignmentService.getDeviceAssignments()
        const deviceAssignments = assignments.filter(a => a.deviceId === device.id)
        
        const activeAssignment = deviceAssignments.find(a => a.status === "active")
        setCurrentAssignment(activeAssignment)
        
        const history = deviceAssignments.sort((a, b) => 
          new Date(b.assignedAt || b.assignedDate).getTime() - 
          new Date(a.assignedAt || a.assignedDate).getTime()
        )
        setAssignmentHistory(history)
        
        // Load current employee
        if (activeAssignment) {
          const employee = await employeeService.getById(activeAssignment.employeeId)
          setCurrentEmployee(employee)
        } else {
          setCurrentEmployee(undefined)
        }
        
        // Load employees for history
        const employeeMap: Record<string, Employee> = {}
        for (const assignment of history) {
          if (assignment.employeeId && !employeeMap[assignment.employeeId]) {
            const emp = await employeeService.getById(assignment.employeeId)
            if (emp) {
              employeeMap[assignment.employeeId] = emp
            }
          }
        }
        setHistoryEmployees(employeeMap)
      } catch (error) {
        console.error('Error loading device assignments:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [device, open])

  const handleUnassignClick = () => {
    setIsUnassignOpen(true)
  }

  const handleUnassignConfirm = async (data: { notes: string; condition: Device["condition"] }) => {
    if (!device) return

    try {
      // First update the device condition if it changed
      if (data.condition !== device.condition) {
        await deviceService.update(device.id, { condition: data.condition })
      }

      // Then unassign the device with notes
      const success = await assignmentService.unassignDevice(device.id, data.notes)
      
      if (success) {
        toast({
          title: "Device Unassigned",
          description: `${device.name} has been unassigned from ${currentEmployee?.firstName} ${currentEmployee?.lastName}.`,
        })
        // Reload the assignments
        await loadAssignments()
        // Notify parent to refresh device list
        onUpdate?.()
        setIsUnassignOpen(false)
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

  if (!device) return null

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Device Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading device details...</div>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Device Information */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{device.name}</h3>
                <p className="text-muted-foreground">
                  {device.brand} {device.model}
                </p>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(device.status)}
                {getConditionBadge(device.condition)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline">{device.type.charAt(0).toUpperCase() + device.type.slice(1)}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Serial Number:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{device.serialNumber}</code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Cost:</span>
                  <span>{formatCurrency(device.cost)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Purchase Date:</span>
                  <span>{formatDate(device.purchaseDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Warranty:</span>
                  <span>{formatDate(device.warrantyExpiry)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Location:</span>
                  <span>{device.location}</span>
                </div>
              </div>
            </div>

            {device.notes && (
              <div className="space-y-2">
                <span className="font-medium text-sm">Notes:</span>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">{device.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Current Assignment */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Current Assignment
            </h4>
            {currentEmployee ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {currentEmployee.firstName} {currentEmployee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{currentEmployee.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentEmployee.department} • {currentEmployee.position}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">Assigned</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(currentAssignment?.assignedAt || currentAssignment?.assignedDate || '')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnassignClick}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unassign
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-muted-foreground">This device is not currently assigned to anyone</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Assignment History */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <History className="h-4 w-4" />
              Assignment History
            </h4>
            {assignmentHistory.length > 0 ? (
              <div className="space-y-3">
                {assignmentHistory.map((assignment) => {
                  const employee = historyEmployees[assignment.employeeId]
                  if (!employee) return null

                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${assignment.status === "active" ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{employee.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{assignment.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(assignment.assignedAt || assignment.assignedDate || '')}
                          {(assignment.returnedAt || assignment.returnDate) && ` - ${formatDate(assignment.returnedAt || assignment.returnDate || '')}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-muted-foreground">No assignment history available</p>
              </div>
            )}
          </div>
        </div>
        )}
      </DialogContent>
      
      <UnassignDialog
        device={device}
        employeeName={currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : undefined}
        open={isUnassignOpen}
        onOpenChange={setIsUnassignOpen}
        onConfirm={handleUnassignConfirm}
      />
    </Dialog>
  )
}
