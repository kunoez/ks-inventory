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
import type { License, LicenseType, LicenseStatus, Company } from "@/lib/types"
import { dataService } from "@/lib/data-service"

interface LicenseFormProps {
  license?: License
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (license: Omit<License, "id" | "createdAt" | "updatedAt">) => void
}

const licenseTypes: LicenseType[] = ["software", "subscription", "perpetual", "volume", "oem"]

const licenseStatuses: LicenseStatus[] = ["active", "expired", "suspended", "cancelled"]

export function LicenseForm({ license, open, onOpenChange, onSubmit }: LicenseFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    name: "",
    type: "subscription" as LicenseType,
    vendor: "",
    version: "",
    licenseKey: "",
    purchaseDate: "",
    expiryDate: "",
    cost: "",
    maxUsers: "",
    currentUsers: "0",
    status: "active" as LicenseStatus,
    notes: "",
    companyId: "",
  })

  // Update form data when license prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (license) {
        // Format dates for input fields (YYYY-MM-DD format)
        const formatDateForInput = (dateString: string | undefined) => {
          if (!dateString) return ""
          const date = new Date(dateString)
          return date.toISOString().split('T')[0]
        }

        setFormData({
          name: license.name || "",
          type: license.type || "subscription",
          vendor: license.vendor || "",
          version: license.version || "",
          licenseKey: license.licenseKey || "",
          purchaseDate: formatDateForInput(license.purchaseDate),
          expiryDate: formatDateForInput(license.expiryDate),
          cost: license.cost?.toString() || "",
          maxUsers: license.maxUsers?.toString() || "",
          currentUsers: license.currentUsers?.toString() || "0",
          status: license.status || "active",
          notes: license.notes || "",
          companyId: license.companyId || "",
        })
      } else {
        // Reset form for new license
        setFormData({
          name: "",
          type: "subscription",
          vendor: "",
          version: "",
          licenseKey: "",
          purchaseDate: "",
          expiryDate: "",
          cost: "",
          maxUsers: "",
          currentUsers: "0",
          status: "active",
          notes: "",
          companyId: "",
        })
      }
    }
  }, [license, open])

  useEffect(() => {
    const loadCompanies = async () => {
      const data = await dataService.getCompanies()
      setCompanies(data || [])
    }
    loadCompanies()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Exclude currentUsers from submission as it's managed by backend
    const { currentUsers, ...dataToSubmit } = formData
    
    const licenseData = {
      ...dataToSubmit,
      cost: Number.parseFloat(formData.cost) || 0,
      maxUsers: Number.parseInt(formData.maxUsers) || 1,
      version: formData.version || undefined,
      licenseKey: formData.licenseKey || undefined,
      expiryDate: formData.expiryDate || undefined,
      notes: formData.notes || undefined,
      companyId: formData.companyId || undefined,
    }

    onSubmit(licenseData)
    // Don't close dialog here - let parent handle it after successful save
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{license ? "Edit License" : "Add New License"}</DialogTitle>
          <DialogDescription>
            {license ? "Update license information" : "Enter the details for the new license"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">License Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Microsoft Office 365"
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
                  {licenseTypes.map((type) => (
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
              <Label htmlFor="vendor">Vendor *</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => updateField("vendor", e.target.value)}
                placeholder="Microsoft"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={formData.version}
                onChange={(e) => updateField("version", e.target.value)}
                placeholder="2023"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseKey">License Key</Label>
            <Input
              id="licenseKey"
              value={formData.licenseKey}
              onChange={(e) => updateField("licenseKey", e.target.value)}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              type="password"
            />
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
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expiryDate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiryDate ? format(new Date(formData.expiryDate), "dd.MM.yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expiryDate ? new Date(formData.expiryDate) : undefined}
                    onSelect={(date) => updateField("expiryDate", date ? date.toISOString().split('T')[0] : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => updateField("cost", e.target.value)}
                placeholder="1200.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Max Users *</Label>
              <Input
                id="maxUsers"
                type="number"
                min="1"
                value={formData.maxUsers}
                onChange={(e) => updateField("maxUsers", e.target.value)}
                placeholder="50"
                required
              />
            </div>
            {/* Current Users is a calculated field managed by backend */}
            {license && (
              <div className="space-y-2">
                <Label htmlFor="currentUsers">Current Users</Label>
                <Input
                  id="currentUsers"
                  type="number"
                  value={formData.currentUsers}
                  disabled
                  className="bg-gray-50"
                  title="This value is calculated based on license assignments"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {licenseStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select value={formData.companyId} onValueChange={(value) => updateField("companyId", value)}>
                <SelectTrigger>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Additional notes about this license..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{license ? "Update License" : "Add License"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
