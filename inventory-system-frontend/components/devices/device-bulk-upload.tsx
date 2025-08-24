"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { deviceService, dataService } from "@/lib/data-service"
import type { Device, DeviceType, DeviceStatus, DeviceCondition, Company } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DeviceBulkUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

interface DeviceRow {
  name: string
  type: string
  brand: string
  model: string
  serialNumber: string
  cost: string
  purchaseDate: string
  status: string
  condition: string
  warrantyExpiry?: string
  location?: string
  notes?: string
  errors: string[]
  isValid: boolean
}

const deviceTypes: DeviceType[] = [
  "laptop",
  "desktop",
  "monitor",
  "phone",
  "tablet",
  "printer",
  "keyboard",
  "mouse",
  "headset",
  "dock",
  "other",
]

const deviceStatuses: DeviceStatus[] = ["available", "assigned", "maintenance", "retired", "lost", "damaged"]

const deviceConditions: DeviceCondition[] = ["excellent", "good", "fair", "poor"]

export function DeviceBulkUpload({ open, onOpenChange, onComplete }: DeviceBulkUploadProps) {
  const [step, setStep] = useState<"upload" | "preview" | "processing">("upload")
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [companies, setCompanies] = useState<Company[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Load companies when dialog opens
  useEffect(() => {
    if (open) {
      const loadCompanies = async () => {
        const data = await dataService.getCompanies()
        setCompanies(data)
        // Pre-select user's company if only one, or first company
        if (user?.companyId) {
          setSelectedCompanyId(user.companyId)
        } else if (data.length === 1) {
          setSelectedCompanyId(data[0].id)
        }
      }
      loadCompanies()
    }
  }, [open, user])

  const generateTemplate = () => {
    const headers = [
      "name",
      "type",
      "brand",
      "model",
      "serialNumber",
      "cost",
      "purchaseDate",
      "status",
      "condition",
      "warrantyExpiry",
      "location",
      "notes",
    ]

    const sampleData = [
      "MacBook Pro 16",
      "laptop",
      "Apple",
      "MacBook Pro",
      "MBP2024001",
      "2499.00",
      "2024-01-15",
      "available",
      "excellent",
      "2027-01-15",
      "IT Storage",
      "New device",
    ]

    const csvContent = [headers.join(","), sampleData.join(",")].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "device_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const validateDevice = (device: Partial<DeviceRow>): { errors: string[]; isValid: boolean } => {
    const errors: string[] = []

    // Required fields
    if (!device.name?.trim()) errors.push("Name is required")
    if (!device.type?.trim()) errors.push("Type is required")
    if (!device.brand?.trim()) errors.push("Brand is required")
    if (!device.model?.trim()) errors.push("Model is required")
    if (!device.serialNumber?.trim()) errors.push("Serial number is required")
    if (!device.cost?.trim()) errors.push("Cost is required")
    if (!device.purchaseDate?.trim()) errors.push("Purchase date is required")
    if (!device.status?.trim()) errors.push("Status is required")
    if (!device.condition?.trim()) errors.push("Condition is required")

    // Validate enums
    if (device.type && !deviceTypes.includes(device.type as DeviceType)) {
      errors.push(`Invalid type. Must be one of: ${deviceTypes.join(", ")}`)
    }
    if (device.status && !deviceStatuses.includes(device.status as DeviceStatus)) {
      errors.push(`Invalid status. Must be one of: ${deviceStatuses.join(", ")}`)
    }
    if (device.condition && !deviceConditions.includes(device.condition as DeviceCondition)) {
      errors.push(`Invalid condition. Must be one of: ${deviceConditions.join(", ")}`)
    }

    // Validate cost
    if (device.cost && (isNaN(Number(device.cost)) || Number(device.cost) <= 0)) {
      errors.push("Cost must be a positive number")
    }

    // Validate dates
    if (device.purchaseDate && isNaN(Date.parse(device.purchaseDate))) {
      errors.push("Purchase date must be a valid date (YYYY-MM-DD)")
    }
    if (device.warrantyExpiry && device.warrantyExpiry.trim() && isNaN(Date.parse(device.warrantyExpiry))) {
      errors.push("Warranty expiry must be a valid date (YYYY-MM-DD)")
    }

    return { errors, isValid: errors.length === 0 }
  }

  const parseCSV = (text: string): DeviceRow[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const devices: DeviceRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const device: Partial<DeviceRow> = {}

      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          device[header as keyof DeviceRow] = values[index] || ""
        }
      })

      const validation = validateDevice(device)
      devices.push({
        name: device.name || "",
        type: device.type || "",
        brand: device.brand || "",
        model: device.model || "",
        serialNumber: device.serialNumber || "",
        cost: device.cost || "",
        purchaseDate: device.purchaseDate || "",
        status: device.status || "",
        condition: device.condition || "",
        warrantyExpiry: device.warrantyExpiry || "",
        location: device.location || "",
        notes: device.notes || "",
        errors: validation.errors,
        isValid: validation.isValid,
      })
    }

    return devices
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsedDevices = parseCSV(text)
      setDevices(parsedDevices)
      setStep("preview")
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    const validDevices = devices.filter((d) => d.isValid)
    if (validDevices.length === 0) {
      toast({
        title: "No valid devices",
        description: "Please fix the errors before uploading.",
        variant: "destructive",
      })
      return
    }

    const companyId = selectedCompanyId || user?.companyId
    if (!companyId) {
      toast({
        title: "Error",
        description: "Please select a company for these devices.",
        variant: "destructive",
      })
      return
    }

    setStep("processing")
    setIsProcessing(true)
    setProgress(0)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < validDevices.length; i++) {
      const device = validDevices[i]
      try {
        const deviceData: Omit<Device, "id" | "createdAt" | "updatedAt"> = {
          companyId: companyId, // Use selected company or user's default company
          name: device.name,
          type: device.type as DeviceType,
          brand: device.brand,
          model: device.model,
          serialNumber: device.serialNumber,
          cost: Number.parseFloat(device.cost),
          purchaseDate: device.purchaseDate,
          status: device.status as DeviceStatus,
          condition: device.condition as DeviceCondition,
          warrantyExpiry: device.warrantyExpiry || undefined,
          location: device.location || undefined,
          notes: device.notes || undefined,
        }

        deviceService.create(deviceData)
        successCount++
      } catch (error) {
        errorCount++
      }

      setProgress(((i + 1) / validDevices.length) * 100)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setIsProcessing(false)

    toast({
      title: "Bulk upload completed",
      description: `${successCount} devices created successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}.`,
    })

    onComplete()
    onOpenChange(false)
    resetState()
  }

  const resetState = () => {
    setStep("upload")
    setDevices([])
    setProgress(0)
    setIsProcessing(false)
    setSelectedCompanyId(user?.companyId || "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validDevicesCount = devices.filter((d) => d.isValid).length
  const invalidDevicesCount = devices.length - validDevicesCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Devices</DialogTitle>
          <DialogDescription>Upload multiple devices from a CSV file</DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {companies.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="company-select">Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger id="company-select">
                    <SelectValue placeholder="Choose a company for these devices" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  All uploaded devices will be associated with this company
                </p>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Download the template file to see the required format and column headers.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={generateTemplate} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload CSV File</Label>
              <Input id="file" type="file" accept=".csv" onChange={handleFileUpload} ref={fileInputRef} />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {validDevicesCount} Valid
              </Badge>
              {invalidDevicesCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {invalidDevicesCount} Invalid
                </Badge>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Brand</th>
                    <th className="p-2 text-left">Model</th>
                    <th className="p-2 text-left">Serial</th>
                    <th className="p-2 text-left">Cost</th>
                    <th className="p-2 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, index) => (
                    <tr key={index} className={device.isValid ? "bg-green-50" : "bg-red-50"}>
                      <td className="p-2">
                        {device.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </td>
                      <td className="p-2">{device.name}</td>
                      <td className="p-2">{device.type}</td>
                      <td className="p-2">{device.brand}</td>
                      <td className="p-2">{device.model}</td>
                      <td className="p-2">{device.serialNumber}</td>
                      <td className="p-2">{device.cost}</td>
                      <td className="p-2">
                        {device.errors.length > 0 && (
                          <div className="text-xs text-red-600">{device.errors.join(", ")}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Uploading Devices...</h3>
              <p className="text-muted-foreground">Please wait while we process your devices</p>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={validDevicesCount === 0} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload {validDevicesCount} Devices
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
