"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { PhoneContract, Company } from "@/lib/types"
import { dataService } from "@/lib/data-service"

interface PhoneContractFormProps {
  contract?: PhoneContract
  onSubmit: (contractData: {
    phoneNumber: string
    carrier: string
    plan: string
    monthlyFee: string
    contractStartDate: string
    contractEndDate: string
    dataLimit?: string
    minutes?: string
    sms?: string
    pin: string
    puk: string
    notes: string
    companyId?: string
  }) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function PhoneContractForm({ contract, onSubmit, onCancel, isSubmitting }: PhoneContractFormProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    phoneNumber: contract?.phoneNumber || "",
    carrier: contract?.carrier || "",
    plan: contract?.plan || "",
    monthlyFee: contract?.monthlyFee?.toString() || "",
    contractStartDate: contract?.contractStartDate || "",
    contractEndDate: contract?.contractEndDate || "",
    dataLimit: contract?.dataLimit || "",
    minutes: contract?.minutes || "",
    sms: contract?.sms || "",
    pin: contract?.pin || "",
    puk: contract?.puk || "",
    notes: contract?.notes || "",
    companyId: contract?.companyId || "",
  })

  useEffect(() => {
    const loadCompanies = async () => {
      const data = await dataService.getCompanies()
      setCompanies(data || [])
    }
    loadCompanies()
  }, [])

  const handleSubmit = () => {
    const contractData = {
      ...formData,
      companyId: formData.companyId || undefined,
    }
    onSubmit(contractData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleChange("phoneNumber", e.target.value)}
            placeholder="+49 171 1234567"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="carrier">Carrier *</Label>
          <Select value={formData.carrier} onValueChange={(value) => handleChange("carrier", value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vodafone">Vodafone</SelectItem>
              <SelectItem value="Telekom">Telekom</SelectItem>
              <SelectItem value="O2">O2</SelectItem>
              <SelectItem value="1&1">1&1</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plan">Plan *</Label>
          <Input
            id="plan"
            value={formData.plan}
            onChange={(e) => handleChange("plan", e.target.value)}
            placeholder="Unlimited Premium"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthlyFee">Monthly Fee *</Label>
          <Input
            id="monthlyFee"
            type="number"
            step="0.01"
            value={formData.monthlyFee}
            onChange={(e) => handleChange("monthlyFee", e.target.value)}
            placeholder="89.99"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractStartDate">Contract Start *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="contractStartDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.contractStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.contractStartDate ? format(new Date(formData.contractStartDate), "dd.MM.yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.contractStartDate ? new Date(formData.contractStartDate) : undefined}
                onSelect={(date) => handleChange("contractStartDate", date ? date.toISOString().split('T')[0] : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractEndDate">Contract End *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="contractEndDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.contractEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.contractEndDate ? format(new Date(formData.contractEndDate), "dd.MM.yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.contractEndDate ? new Date(formData.contractEndDate) : undefined}
                onSelect={(date) => handleChange("contractEndDate", date ? date.toISOString().split('T')[0] : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataLimit">Data Limit</Label>
          <Input
            id="dataLimit"
            value={formData.dataLimit}
            onChange={(e) => handleChange("dataLimit", e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minutes">Minutes</Label>
          <Input
            id="minutes"
            value={formData.minutes}
            onChange={(e) => handleChange("minutes", e.target.value)}
            placeholder="Unlimited"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sms">SMS</Label>
          <Input
            id="sms"
            value={formData.sms}
            onChange={(e) => handleChange("sms", e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            value={formData.pin}
            onChange={(e) => handleChange("pin", e.target.value)}
            placeholder="1234"
            maxLength={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="puk">PUK</Label>
          <Input
            id="puk"
            value={formData.puk}
            onChange={(e) => handleChange("puk", e.target.value)}
            placeholder="12345678"
            maxLength={8}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Select value={formData.companyId} onValueChange={(value) => handleChange("companyId", value)}>
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

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Additional contract details..."
          rows={2}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : contract ? "Update Contract" : "Create Contract"}
        </Button>
      </div>
    </div>
  )
}
