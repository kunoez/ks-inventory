"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { DeviceTable } from "@/components/devices/device-table"
import { DeviceForm } from "@/components/devices/device-form"
import { DeviceFilters } from "@/components/devices/device-filters"
import { deviceService } from "@/lib/data-service"
import type { Device, DeviceFilters as DeviceFiltersType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { AssignmentDialog } from "@/components/assignments/assignment-dialog"
import { EmployeePool } from "@/components/employees/employee-pool"
import { DeviceDetailsDialog } from "@/components/devices/device-details-dialog"
import { DeviceBulkUpload } from "@/components/devices/device-bulk-upload"

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [filters, setFilters] = useState<DeviceFiltersType>({})
  const [selectedDevice, setSelectedDevice] = useState<Device | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [assignmentDevice, setAssignmentDevice] = useState<Device | undefined>()
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false)
  const [viewDevice, setViewDevice] = useState<Device | undefined>()
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadDevices()
  }, [])

  useEffect(() => {
    const loadFiltered = async () => {
      const filtered = await deviceService.getAll(filters)
      setFilteredDevices(filtered || [])
    }
    loadFiltered()
  }, [devices, filters])

  const loadDevices = async () => {
    const allDevices = await deviceService.getAll()
    setDevices(allDevices || [])
  }

  const handleAddDevice = () => {
    setSelectedDevice(undefined)
    setIsFormOpen(true)
  }

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device)
    setIsFormOpen(true)
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (confirm("Are you sure you want to delete this device?")) {
      try {
        await deviceService.delete(deviceId)
        await loadDevices()
        toast({
          title: "Device deleted",
          description: "The device has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while deleting the device.",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewDevice = (device: Device) => {
    setViewDevice(device)
    setIsDetailsOpen(true)
  }

  const handleAssignDevice = (device: Device) => {
    setAssignmentDevice(device)
    setIsAssignmentOpen(true)
  }

  const handleAssignmentComplete = () => {
    loadDevices()
    toast({
      title: "Device assigned",
      description: "The device has been successfully assigned.",
    })
  }

  const handleFormSubmit = async (deviceData: Omit<Device, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (selectedDevice) {
        // Update existing device
        const updated = await deviceService.update(selectedDevice.id, deviceData)
        if (updated) {
          await loadDevices()
          setIsFormOpen(false)
          toast({
            title: "Device updated",
            description: "The device has been successfully updated.",
          })
        }
      } else {
        // Create new device
        await deviceService.create(deviceData)
        await loadDevices()
        setIsFormOpen(false)
        toast({
          title: "Device added",
          description: "The new device has been successfully added.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the device.",
        variant: "destructive",
      })
    }
  }

  const handleBulkUploadComplete = () => {
    loadDevices()
    toast({
      title: "Bulk upload completed",
      description: "Devices have been successfully uploaded.",
    })
  }

  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        <div className="flex gap-6 h-[calc(100vh-8rem)] overflow-hidden">
          <div className="w-80 flex-shrink-0 h-full">
            <EmployeePool />
          </div>

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Fixed Header */}
            <div className="flex-shrink-0 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">Device Management</h1>
                  <p className="text-muted-foreground">Manage your organization's hardware inventory</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Upload
                  </Button>
                  <Button onClick={handleAddDevice} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Device
                  </Button>
                </div>
              </div>
              
              <DeviceFilters filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Devices ({filteredDevices.length})</h2>
                    <p className="text-sm text-muted-foreground">
                      Drag employees from the pool to assign them to available devices
                    </p>
                  </div>
                  <DeviceTable
                    devices={filteredDevices}
                    onEdit={handleEditDevice}
                    onDelete={handleDeleteDevice}
                    onView={handleViewDevice}
                    onAssign={handleAssignDevice}
                    onAssignmentUpdate={loadDevices}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DeviceForm
          device={selectedDevice}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
        />

        <AssignmentDialog
          type="device"
          item={assignmentDevice}
          open={isAssignmentOpen}
          onOpenChange={setIsAssignmentOpen}
          onAssign={handleAssignmentComplete}
        />

        <DeviceDetailsDialog device={viewDevice} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} onUpdate={loadDevices} />

        <DeviceBulkUpload
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onComplete={handleBulkUploadComplete}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
