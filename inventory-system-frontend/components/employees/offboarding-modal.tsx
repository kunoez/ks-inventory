"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Laptop, Key, Phone, UserMinus, Package, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  employeeService,
  deviceService,
  licenseService,
  assignmentService,
  phoneContractService,
} from "@/lib/data-service"
import type { Employee, Device, License, PhoneContract, DeviceAssignment, LicenseAssignment, PhoneContractAssignment } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface OffboardingModalProps {
  employee: Employee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface AssignedItem {
  id: string
  type: "device" | "license" | "phone"
  name: string
  details: string
  assignmentId: string
  selected: boolean
  status?: string
}

export function OffboardingModal({ employee, open, onOpenChange, onComplete }: OffboardingModalProps) {
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (open && employee) {
      loadAssignments()
    }
  }, [open, employee])

  const loadAssignments = async () => {
    if (!employee) return

    setLoading(true)
    try {
      // Get all assignments
      const [deviceAssignments, licenseAssignments, phoneAssignments] = await Promise.all([
        assignmentService.getDeviceAssignments(),
        assignmentService.getLicenseAssignments(),
        assignmentService.getPhoneAssignments(),
      ])

      // Filter assignments for this employee
      const employeeDeviceAssignments = deviceAssignments.filter(
        (a) => a.employeeId === employee.id && a.status === "active"
      )
      const employeeLicenseAssignments = licenseAssignments.filter(
        (a) => a.employeeId === employee.id && a.status === "active"
      )
      const employeePhoneAssignments = phoneAssignments.filter(
        (a) => a.employeeId === employee.id && a.status === "active"
      )

      // Get devices, licenses, and phone contracts details
      const [devices, licenses, phoneContracts] = await Promise.all([
        deviceService.getAll(),
        licenseService.getAll(),
        phoneContractService.getAll(),
      ])

      // Map assignments to items
      const items: AssignedItem[] = []

      // Add devices
      employeeDeviceAssignments.forEach((assignment) => {
        const device = devices.find((d) => d.id === assignment.deviceId)
        if (device) {
          items.push({
            id: device.id,
            type: "device",
            name: `${device.brand} ${device.model}`,
            details: `${device.type} - SN: ${device.serialNumber}`,
            assignmentId: assignment.id,
            selected: true,
            status: device.status,
          })
        }
      })

      // Add licenses
      employeeLicenseAssignments.forEach((assignment) => {
        const license = licenses.find((l) => l.id === assignment.licenseId)
        if (license) {
          items.push({
            id: license.id,
            type: "license",
            name: license.name,
            details: `${license.vendor} - ${license.type}`,
            assignmentId: assignment.id,
            selected: true,
            status: license.status,
          })
        }
      })

      // Add phone contracts
      employeePhoneAssignments.forEach((assignment) => {
        const contract = phoneContracts.find((p) => p.id === assignment.phoneContractId)
        if (contract) {
          items.push({
            id: contract.id,
            type: "phone",
            name: `${contract.phoneNumber}`,
            details: `${contract.carrier} - ${contract.plan}`,
            assignmentId: assignment.id,
            selected: true,
            status: contract.status,
          })
        }
      })

      setAssignedItems(items)
    } catch (error) {
      console.error("Failed to load assignments:", error)
      toast({
        title: "Error",
        description: "Failed to load employee assignments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setAssignedItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const toggleAll = (type: "device" | "license" | "phone") => {
    const allSelected = assignedItems
      .filter((item) => item.type === type)
      .every((item) => item.selected)

    setAssignedItems((prev) =>
      prev.map((item) =>
        item.type === type ? { ...item, selected: !allSelected } : item
      )
    )
  }

  const handleOffboard = async () => {
    if (!employee) return

    const selectedItems = assignedItems.filter((item) => item.selected)
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to process",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    const results = { success: 0, failed: 0 }

    try {
      for (const item of selectedItems) {
        try {
          if (item.type === "device") {
            await assignmentService.unassignDevice(item.id, "Offboarding process")
          } else if (item.type === "license") {
            await assignmentService.unassignLicense(item.id)
          } else if (item.type === "phone") {
            await assignmentService.unassignPhoneContract(item.id)
          }
          results.success++
        } catch (error) {
          console.error(`Failed to return ${item.type} ${item.id}:`, error)
          results.failed++
        }
      }

      // Update employee status to inactive if all items were processed
      if (results.failed === 0 && selectedItems.length === assignedItems.length) {
        await employeeService.update(employee.id, { status: "inactive" })
      }

      toast({
        title: "Offboarding Complete",
        description: `Successfully processed ${results.success} items${
          results.failed > 0 ? `, ${results.failed} failed` : ""
        }`,
      })

      onComplete()
      onOpenChange(false)
    } catch (error) {
      console.error("Offboarding failed:", error)
      toast({
        title: "Offboarding Failed",
        description: "An error occurred during the offboarding process",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getItemsByType = (type: "device" | "license" | "phone") => {
    return assignedItems.filter((item) => item.type === type)
  }

  const getIcon = (type: "device" | "license" | "phone") => {
    switch (type) {
      case "device":
        return <Laptop className="h-4 w-4" />
      case "license":
        return <Key className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
    }
  }

  if (!employee) return null

  const deviceItems = getItemsByType("device")
  const licenseItems = getItemsByType("license")
  const phoneItems = getItemsByType("phone")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Offboarding: {employee.firstName} {employee.lastName}
          </DialogTitle>
          <DialogDescription>
            Review and process the return of all assigned equipment and licenses
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-sm text-gray-500">Loading assignments...</p>
            </div>
          </div>
        ) : assignedItems.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This employee has no active assignments to process.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({assignedItems.length})
              </TabsTrigger>
              <TabsTrigger value="devices">
                Devices ({deviceItems.length})
              </TabsTrigger>
              <TabsTrigger value="licenses">
                Licenses ({licenseItems.length})
              </TabsTrigger>
              <TabsTrigger value="phones">
                Phones ({phoneItems.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="all" className="space-y-4">
                {assignedItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getIcon(item.type)}
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.details}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="devices" className="space-y-4">
                {deviceItems.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAll("device")}
                    >
                      {deviceItems.every((item) => item.selected)
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
                {deviceItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.details}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="licenses" className="space-y-4">
                {licenseItems.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAll("license")}
                    >
                      {licenseItems.every((item) => item.selected)
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
                {licenseItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.details}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="phones" className="space-y-4">
                {phoneItems.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAll("phone")}
                    >
                      {phoneItems.every((item) => item.selected)
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                )}
                {phoneItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{item.details}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleOffboard}
            disabled={
              processing ||
              loading ||
              assignedItems.filter((item) => item.selected).length === 0
            }
          >
            {processing ? (
              <>Processing...</>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Offboarding
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}