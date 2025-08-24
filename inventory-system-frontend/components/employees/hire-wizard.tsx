"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { User, Laptop, Key, Phone, CheckCircle, ArrowLeft, ArrowRight, UserPlus, Package } from "lucide-react"
import {
  employeeService,
  deviceService,
  licenseService,
  assignmentService,
  phoneContractService,
} from "@/lib/data-service"
import type { Employee, Device, License, PhoneContract } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface HireWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  employee?: Employee
  mode?: "hire" | "onboard"
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

const steps = [
  { id: 1, title: "Employee Info", icon: User },
  { id: 2, title: "Equipment", icon: Laptop },
  { id: 3, title: "Licenses", icon: Key },
  { id: 4, title: "Review", icon: CheckCircle },
]

export function HireWizard({ open, onOpenChange, onComplete, employee, mode = "hire" }: HireWizardProps) {
  // Initialize step based on mode
  const initialStep = mode === "onboard" ? 2 : 1
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  // Employee data
  const [employeeData, setEmployeeData] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    email: employee?.email || "",
    department: employee?.department || "",
    position: employee?.position || "",
    employeeId: employee?.employeeId || "",
    startDate: employee?.startDate || "",
    status: (employee?.status || "active") as Employee["status"],
  })

  // Selected equipment and licenses
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([])
  const [selectedLicenses, setSelectedLicenses] = useState<License[]>([])
  const [selectedPhoneContracts, setSelectedPhoneContracts] = useState<PhoneContract[]>([])
  const [notes, setNotes] = useState("")

  // Available items
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [availableLicenses, setAvailableLicenses] = useState<License[]>([])
  const [availablePhoneContracts, setAvailablePhoneContracts] = useState<PhoneContract[]>([])
  const [loadingItems, setLoadingItems] = useState(true)

  // Load available items on component mount
  // Update employee data when employee prop changes
  useEffect(() => {
    if (employee) {
      setEmployeeData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        employeeId: employee.employeeId,
        startDate: employee.startDate,
        status: employee.status,
      })
    }
  }, [employee])

  useEffect(() => {
    async function loadAvailableItems() {
      try {
        const [devices, licenses, contracts] = await Promise.all([
          deviceService.getAll({ status: ["available"] }),
          licenseService.getAll({ statuses: ["active"] }),
          phoneContractService.getAll({ statuses: ["active"] })
        ])
        
        setAvailableDevices(devices)
        setAvailableLicenses(licenses.filter((l) => l.currentUsers < l.maxUsers))
        setAvailablePhoneContracts(contracts)
      } catch (error) {
        console.error("Error loading available items:", error)
      } finally {
        setLoadingItems(false)
      }
    }

    if (open) {
      loadAvailableItems()
      // Reset to appropriate step when modal opens
      setCurrentStep(mode === "onboard" ? 2 : 1)
    }
  }, [open, mode])

  const resetWizard = () => {
    setCurrentStep(mode === "onboard" ? 2 : 1)
    setEmployeeData({
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      department: employee?.department || "",
      position: employee?.position || "",
      employeeId: employee?.employeeId || "",
      startDate: employee?.startDate || "",
      status: (employee?.status || "active") as Employee["status"],
    })
    setSelectedDevices([])
    setSelectedLicenses([])
    setSelectedPhoneContracts([])
    setNotes("")
    setIsSubmitting(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    const minStep = mode === "onboard" ? 2 : 1
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDeviceToggle = (device: Device) => {
    setSelectedDevices((prev) => {
      const exists = prev.find((d) => d.id === device.id)
      if (exists) {
        // Remove device and associated phone contract
        if (device.type === "phone") {
          setSelectedPhoneContracts((prevContracts) =>
            prevContracts.filter((c) => !selectedPhoneContracts.some((sc) => sc.id === c.id)),
          )
        }
        return prev.filter((d) => d.id !== device.id)
      } else {
        return [...prev, device]
      }
    })
  }

  const handleLicenseToggle = (license: License) => {
    setSelectedLicenses((prev) => {
      const exists = prev.find((l) => l.id === license.id)
      if (exists) {
        return prev.filter((l) => l.id !== license.id)
      } else {
        return [...prev, license]
      }
    })
  }

  const handlePhoneContractSelect = (deviceId: string, contractId: string) => {
    const contract = availablePhoneContracts.find((c) => c.id === contractId)
    if (!contract) return

    setSelectedPhoneContracts((prev) => {
      // Remove any existing contract for this device
      const filtered = prev.filter((c) => !selectedPhoneContracts.some((sc) => sc.id === c.id))
      return [...filtered, contract]
    })
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      let targetEmployee: Employee
      
      if (mode === "onboard") {
        // Use existing employee for onboarding
        if (!employee) {
          throw new Error("No employee selected for onboarding")
        }
        targetEmployee = employee
      } else {
        // Create new employee for hire mode
        targetEmployee = employeeService.create(employeeData)
      }

      // Assign devices
      for (const device of selectedDevices) {
        await assignmentService.assignDevice(device.id, targetEmployee.id, user.name, notes)

        // Assign phone contract if it's a phone device
        if (device.type === "phone") {
          const phoneContract = selectedPhoneContracts.find((c) => selectedPhoneContracts.some((sc) => sc.id === c.id))
          if (phoneContract) {
            await assignmentService.assignPhoneContract(
              phoneContract.id,
              targetEmployee.id,
              user.name,
              mode === "onboard" ? "Assigned during onboarding" : "Assigned during hire process",
            )
          }
        }
      }

      // Assign licenses
      for (const license of selectedLicenses) {
        await assignmentService.assignLicense(license.id, targetEmployee.id, user.name, notes)
      }

      const successTitle = mode === "onboard" ? "Onboarding Completed" : "Employee Hired Successfully"
      const successMessage = mode === "onboard" 
        ? `${targetEmployee.firstName} ${targetEmployee.lastName} has been assigned ${selectedDevices.length} devices and ${selectedLicenses.length} licenses.`
        : `${employeeData.firstName} ${employeeData.lastName} has been added with ${selectedDevices.length} devices and ${selectedLicenses.length} licenses.`

      toast({
        title: successTitle,
        description: successMessage,
      })

      onComplete()
      onOpenChange(false)
      resetWizard()
    } catch (error) {
      console.error(`${mode === "onboard" ? "Onboarding" : "Hire"} process failed:`, error)
      toast({
        title: `${mode === "onboard" ? "Onboarding" : "Hire"} Process Failed`,
        description: `There was an error during the ${mode === "onboard" ? "onboarding" : "hire"} process. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          employeeData.firstName &&
          employeeData.lastName &&
          employeeData.email &&
          employeeData.department &&
          employeeData.position &&
          employeeData.employeeId &&
          employeeData.startDate
        )
      case 2:
      case 3:
        return true // Equipment and licenses are optional
      case 4:
        return true
      default:
        return false
    }
  }

  const phoneDevices = selectedDevices.filter((d) => d.type === "phone")
  const progress = (currentStep / steps.length) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "onboard" ? (
              <>
                <Package className="h-5 w-5" />
                Onboarding: {employee?.firstName} {employee?.lastName}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Hire New Employee
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "onboard" 
              ? "Assign equipment and licenses to the employee."
              : "Complete the hiring process by adding employee information and assigning equipment and licenses."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Step {currentStep} of {steps.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between">
            {steps.map((step) => {
              // Skip employee info step in onboard mode
              if (mode === "onboard" && step.id === 1) {
                return null
              }
              
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex flex-col items-center space-y-2">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2
                    ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : isCompleted
                          ? "border-green-500 bg-green-50 text-green-600"
                          : "border-gray-300 bg-gray-50 text-gray-400"
                    }
                  `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-medium ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"}`}
                  >
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && mode !== "onboard" && (
              <Card>
                <CardHeader>
                  <CardTitle>Employee Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={employeeData.firstName}
                        onChange={(e) => setEmployeeData((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={employeeData.lastName}
                        onChange={(e) => setEmployeeData((prev) => ({ ...prev, lastName: e.target.value }))}
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
                      value={employeeData.email}
                      onChange={(e) => setEmployeeData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="john.smith@company.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID *</Label>
                      <Input
                        id="employeeId"
                        value={employeeData.employeeId}
                        onChange={(e) => setEmployeeData((prev) => ({ ...prev, employeeId: e.target.value }))}
                        placeholder="EMP001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={employeeData.startDate}
                        onChange={(e) => setEmployeeData((prev) => ({ ...prev, startDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={employeeData.department}
                        onValueChange={(value) => setEmployeeData((prev) => ({ ...prev, department: value }))}
                      >
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
                      <Label htmlFor="position">Position *</Label>
                      <Input
                        id="position"
                        value={employeeData.position}
                        onChange={(e) => setEmployeeData((prev) => ({ ...prev, position: e.target.value }))}
                        placeholder="Senior Developer"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Equipment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose devices to assign to the new employee. Selected: {selectedDevices.length}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {availableDevices.map((device) => (
                      <div key={device.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedDevices.some((d) => d.id === device.id)}
                          onCheckedChange={() => handleDeviceToggle(device)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {device.type === "phone" && <Phone className="h-4 w-4" />}
                            {device.type === "laptop" && <Laptop className="h-4 w-4" />}
                            <span className="font-medium">{device.name}</span>
                            <Badge variant="outline">{device.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {device.brand} {device.model} • {device.condition}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">{device.serialNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${device.cost}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Phone contract selection for selected phone devices */}
                  {phoneDevices.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium">Phone Contracts</h4>
                      {phoneDevices.map((device) => (
                        <div key={device.id} className="p-3 border rounded-lg">
                          <p className="font-medium mb-2">Select contract for {device.name}:</p>
                          <Select onValueChange={(value) => handlePhoneContractSelect(device.id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose phone contract..." />
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Licenses</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose software licenses to assign to the new employee. Selected: {selectedLicenses.length}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {availableLicenses.map((license) => (
                      <div key={license.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedLicenses.some((l) => l.id === license.id)}
                          onCheckedChange={() => handleLicenseToggle(license)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            <span className="font-medium">{license.name}</span>
                            <Badge variant="outline">{license.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {license.vendor} {license.version && `v${license.version}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {license.currentUsers}/{license.maxUsers} seats used
                            </Badge>
                            {license.expiryDate && (
                              <Badge variant="outline">
                                Expires: {new Date(license.expiryDate).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${license.cost}/year</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review the information before completing the hire process.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Employee summary */}
                  <div>
                    <h4 className="font-medium mb-2">Employee Information</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p>
                        <strong>Name:</strong> {employeeData.firstName} {employeeData.lastName}
                      </p>
                      <p>
                        <strong>Email:</strong> {employeeData.email}
                      </p>
                      <p>
                        <strong>Employee ID:</strong> {employeeData.employeeId}
                      </p>
                      <p>
                        <strong>Department:</strong> {employeeData.department}
                      </p>
                      <p>
                        <strong>Position:</strong> {employeeData.position}
                      </p>
                      <p>
                        <strong>Start Date:</strong> {new Date(employeeData.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Equipment summary */}
                  {selectedDevices.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Equipment ({selectedDevices.length})</h4>
                      <div className="space-y-2">
                        {selectedDevices.map((device) => (
                          <div key={device.id} className="p-2 bg-gray-50 rounded flex justify-between">
                            <span>
                              {device.name} ({device.brand} {device.model})
                            </span>
                            <span>${device.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* License summary */}
                  {selectedLicenses.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Licenses ({selectedLicenses.length})</h4>
                      <div className="space-y-2">
                        {selectedLicenses.map((license) => (
                          <div key={license.id} className="p-2 bg-gray-50 rounded flex justify-between">
                            <span>
                              {license.name} ({license.vendor})
                            </span>
                            <span>${license.cost}/year</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes about this hire..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === (mode === "onboard" ? 2 : 1)}
              className="flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  resetWizard()
                }}
              >
                Cancel
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Processing..." : mode === "onboard" ? "Complete Onboarding" : "Complete Hire"}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
