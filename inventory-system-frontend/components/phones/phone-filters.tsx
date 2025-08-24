"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import type { PhoneContractFilters } from "@/lib/types"

interface PhoneFiltersProps {
  filters: PhoneContractFilters
  onFiltersChange: (filters: PhoneContractFilters) => void
}

export function PhoneFilters({ filters, onFiltersChange }: PhoneFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PhoneContractFilters>(filters)

  const handleFilterChange = (key: keyof PhoneContractFilters, value: string | undefined) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    const emptyFilters: PhoneContractFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some((value) => value !== undefined && value !== "")

  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search phone numbers..."
              value={localFilters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value || undefined)}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          value={localFilters.carrier || "all"}
          onValueChange={(value) => handleFilterChange("carrier", value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Carriers</SelectItem>
            <SelectItem value="Vodafone">Vodafone</SelectItem>
            <SelectItem value="Telekom">Telekom</SelectItem>
            <SelectItem value="O2">O2</SelectItem>
            <SelectItem value="1&1">1&1</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={localFilters.status || "all"}
          onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </Card>
  )
}