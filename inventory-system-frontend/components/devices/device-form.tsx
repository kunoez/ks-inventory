"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Device, DeviceType, DeviceStatus, DeviceCondition, Company } from "@/lib/types"
import { dataService } from "@/lib/data-service"

interface DeviceFormProps {
  device?: Device
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (device: Omit<Device, "id" | "createdAt" | "updatedAt">) => void
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

export function DeviceForm({ device, open, onOpenChange, onSubmit }: DeviceFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    name: "",
    type: "laptop" as DeviceType,
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiry: "",
    cost: "",
    status: "available" as DeviceStatus,
    condition: "excellent" as DeviceCondition,
    location: "",
    notes: "",
    companyId: "no-company",
  })

  // Update form data when device prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (device) {
        // Format dates for input fields (YYYY-MM-DD format)
        const formatDateForInput = (dateString: string | undefined) => {
          if (!dateString) return ""
          const date = new Date(dateString)
          return date.toISOString().split('T')[0]
        }

        setFormData({
          name: device.name || "",
          type: device.type || "laptop",
          brand: device.brand || "",
          model: device.model || "",
          serialNumber: device.serialNumber || "",
          purchaseDate: formatDateForInput(device.purchaseDate),
          warrantyExpiry: formatDateForInput(device.warrantyExpiry),
          cost: device.cost?.toString() || "",
          status: device.status || "available",
          condition: device.condition || "excellent",
          location: device.location || "",
          notes: device.notes || "",
          companyId: device.companyId || "no-company",
        })
      } else {
        // Reset form for new device
        setFormData({
          name: "",
          type: "laptop",
          brand: "",
          model: "",
          serialNumber: "",
          purchaseDate: "",
          warrantyExpiry: "",
          cost: "",
          status: "available",
          condition: "excellent",
          location: "",
          notes: "",
          companyId: "no-company",
        })
      }
    }
  }, [open, device])

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
    const deviceData = device 
      ? {
          // For updates, exclude companyId and serialNumber as backend doesn't allow updating these
          name: formData.name,
          type: formData.type,
          brand: formData.brand,
          model: formData.model,
          purchaseDate: formData.purchaseDate,
          warrantyExpiry: formData.warrantyExpiry || undefined,
          cost: Number.parseFloat(formData.cost) || 0,
          status: formData.status,
          condition: formData.condition,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
        }
      : {
          // For creation, include all fields
          ...formData,
          cost: Number.parseFloat(formData.cost) || 0,
          warrantyExpiry: formData.warrantyExpiry || undefined,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
          companyId: formData.companyId === "no-company" ? undefined : formData.companyId || undefined,
        }

    onSubmit(deviceData)
    // Don't close dialog here - let parent handle it after successful save

    // Reset form if creating new device
    if (!device) {
      setFormData({
        name: "",
        type: "laptop",
        brand: "",
        model: "",
        serialNumber: "",
        purchaseDate: "",
        warrantyExpiry: "",
        cost: "",
        status: "available",
        condition: "excellent",
        location: "",
        notes: "",
        companyId: "no-company",
      })
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{device ? "Edit Device" : "Add New Device"}</DialogTitle>
          <DialogDescription>
            {device ? "Update device information" : "Enter the details for the new device"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="MacBook Pro 16"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => updateField("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateField("brand", e.target.value)}
                placeholder="Apple"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => updateField("model", e.target.value)}
                placeholder="MacBook Pro"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => updateField("serialNumber", e.target.value)}
                placeholder="MBP2023001"
                required
                disabled={!!device} // Make read-only when editing
                className={device ? "bg-gray-50" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => updateField("cost", e.target.value)}
                placeholder="2499.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="purchaseDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchaseDate ? format(new Date(formData.purchaseDate), "dd.MM.yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.purchaseDate ? new Date(formData.purchaseDate) : undefined}
                    onSelect={(date) => updateField("purchaseDate", date ? date.toISOString().split('T')[0] : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="warrantyExpiry"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.warrantyExpiry && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.warrantyExpiry ? format(new Date(formData.warrantyExpiry), "dd.MM.yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined}
                    onSelect={(date) => updateField("warrantyExpiry", date ? date.toISOString().split('T')[0] : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition *</Label>
              <Select value={formData.condition} onValueChange={(value) => updateField("condition", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceConditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select 
                value={formData.companyId} 
                onValueChange={(value) => updateField("companyId", value)}
                disabled={!!device} // Make read-only when editing
              >
                <SelectTrigger className={device ? "bg-gray-50" : ""}>
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
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="IT Storage Room"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Additional notes about this device..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{device ? "Update Device" : "Add Device"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
