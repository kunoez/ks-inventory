"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Laptop, Key, Phone, Plus } from "lucide-react"
import { employeeService, assignmentService, phoneContractService } from "@/lib/data-service"
import type { Employee, Device, License, PhoneContract } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { PhoneContractForm } from "@/components/phones/phone-contract-form"
import { useToast } from "@/hooks/use-toast"

interface AssignmentDialogProps {
  type: "device" | "license"
  item?: Device | License
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: () => void
}

export function AssignmentDialog({ type, item, open, onOpenChange, onAssign }: AssignmentDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedPhoneContractId, setSelectedPhoneContractId] = useState("")
  const [notes, setNotes] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [phoneContracts, setPhoneContracts] = useState<PhoneContract[]>([])
  const [showNewContractForm, setShowNewContractForm] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const isPhoneDevice = type === "device" && item && "type" in item && item.type === "phone"

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        const activeEmployees = await employeeService.getAll({ status: ["active"] })
        setEmployees(activeEmployees || [])

        // Filter available employees for licenses
        if (type === "license" && item) {
          const licenseAssignments = await assignmentService.getLicenseAssignments()
          const assignedEmployeeIds = licenseAssignments
            .filter((a) => a.licenseId === item.id && a.status === "active")
            .map((a) => a.employeeId)
          
          const available = (activeEmployees || []).filter((emp) => !assignedEmployeeIds.includes(emp.id))
          setAvailableEmployees(available)
        } else {
          setAvailableEmployees(activeEmployees || [])
        }

        if (isPhoneDevice) {
          const availableContracts = await phoneContractService.getAll({ statuses: ["active"] })
          setPhoneContracts(availableContracts || [])
        }

        // Check if there's a pending employee from drag-and-drop
        const pendingEmployeeData = localStorage.getItem('pendingAssignmentEmployee')
        if (pendingEmployeeData && type === "device") {
          try {
            const pendingEmployee = JSON.parse(pendingEmployeeData) as Employee
            // Set the employee ID after state is initialized
            setTimeout(() => {
              setSelectedEmployeeId(pendingEmployee.id)
            }, 0)
            localStorage.removeItem('pendingAssignmentEmployee')
          } catch (e) {
            console.error('Failed to parse pending employee data')
            setSelectedEmployeeId("")
          }
        } else {
          setSelectedEmployeeId("")
        }

        setSelectedPhoneContractId("")
        setNotes("")
        setShowNewContractForm(false)
      }
    }
    loadData()
  }, [open, isPhoneDevice, type, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!item || !selectedEmployeeId || !user) return

    if (isPhoneDevice && !selectedPhoneContractId) {
      toast({
        title: "Phone Contract Required",
        description: "Please select a phone contract or create a new one.",
        variant: "destructive",
      })
      return
    }

    try {
      if (type === "device") {
        const result = await assignmentService.assignDevice(item.id, selectedEmployeeId)

        if (isPhoneDevice && selectedPhoneContractId) {
          await assignmentService.assignPhoneContract(
            selectedPhoneContractId,
            selectedEmployeeId
          )
        }

        if (result) {
          toast({
            title: "Device Assigned Successfully",
            description: `${item.name} has been assigned${isPhoneDevice ? " with phone contract" : ""}.`,
          })
        }
      } else {
        const result = await assignmentService.assignLicense(item.id, selectedEmployeeId)
        
        if (result) {
          toast({
            title: "License Assigned Successfully",
            description: `${item.name} has been assigned successfully.`,
          })
        }
      }

      onAssign()
      onOpenChange(false)
    } catch (error) {
      console.error("Assignment failed:", error)
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning the item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNewContract = async (contractData: {
    phoneNumber: string
    carrier: string
    plan: string
    monthlyFee: string
    contractStartDate: string
    contractEndDate: string
    pin: string
    puk: string
    notes: string
  }) => {
    const newContract = await phoneContractService.create({
      phoneNumber: contractData.phoneNumber,
      carrier: contractData.carrier,
      plan: contractData.plan,
      monthlyFee: Number.parseFloat(contractData.monthlyFee),
      contractStartDate: contractData.contractStartDate,
      contractEndDate: contractData.contractEndDate,
      pin: contractData.pin,
      puk: contractData.puk,
      status: "active",
      notes: contractData.notes || undefined,
    })

    setPhoneContracts((prev) => [...prev, newContract])
    setSelectedPhoneContractId(newContract.id)
    setShowNewContractForm(false)
    toast({
      title: "Contract Created",
      description: "New phone contract created and selected.",
    })
  }

  const availablePhoneContracts = phoneContracts.filter((contract) => contract.status === "active")

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "device" ? <Laptop className="h-5 w-5" /> : <Key className="h-5 w-5" />}
            Assign {type === "device" ? "Device" : "License"}
          </DialogTitle>
          <DialogDescription>
            Assign {item.name} to an employee{isPhoneDevice ? " with a phone contract" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-muted-foreground">
              {"brand" in item ? `${item.brand} ${item.model}` : `${item.vendor} ${item.version || ""}`}
            </div>
            {"serialNumber" in item && (
              <div className="text-xs text-muted-foreground font-mono">{item.serialNumber}</div>
            )}
            {type === "license" && "maxUsers" in item && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {item.currentUsers}/{item.maxUsers} users
                </Badge>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Select Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>
                          {employee.firstName} {employee.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {employee.department} • {employee.position}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {type === "license"
                    ? "No available employees (all active employees already have this license)"
                    : "No active employees available"}
                </p>
              )}
            </div>

            {isPhoneDevice && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Phone Contract *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewContractForm(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    New Contract
                  </Button>
                </div>

                {showNewContractForm ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Create New Phone Contract
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PhoneContractForm onSubmit={handleNewContract} onCancel={() => setShowNewContractForm(false)} />
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Select value={selectedPhoneContractId} onValueChange={setSelectedPhoneContractId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a phone contract..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePhoneContracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            <div className="flex flex-col">
                              <span>{contract.phoneNumber}</span>
                              <span className="text-xs text-muted-foreground">
                                {contract.carrier} • {contract.plan} • ${contract.monthlyFee}/month
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availablePhoneContracts.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No available phone contracts. Please create a new one.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this assignment..."
                rows={3}
              />
            </div>

            {!showNewContractForm && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !selectedEmployeeId ||
                    availableEmployees.length === 0 ||
                    (isPhoneDevice && !selectedPhoneContractId && availablePhoneContracts.length === 0)
                  }
                >
                  Assign {type === "device" ? "Device" : "License"}
                  {isPhoneDevice && " & Contract"}
                </Button>
              </DialogFooter>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
