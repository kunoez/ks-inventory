"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DeviceFilters, DeviceType, DeviceStatus, DeviceCondition } from "@/lib/types"

interface DeviceFiltersProps {
  filters: DeviceFilters
  onFiltersChange: (filters: DeviceFilters) => void
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

const deviceConditionsList: DeviceCondition[] = ["excellent", "good", "fair", "poor"]

function DeviceFiltersComponent({ filters, onFiltersChange }: DeviceFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DeviceFilters>(filters)

  const updateFilters = (newFilters: DeviceFilters) => {
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: DeviceFilters = {}
    updateFilters(emptyFilters)
  }

  const removeFilter = (filterType: keyof DeviceFilters, value?: string) => {
    const newFilters = { ...localFilters }

    if (filterType === "search") {
      delete newFilters.search
    } else if (value && Array.isArray(newFilters[filterType])) {
      const currentArray = newFilters[filterType] as string[]
      newFilters[filterType] = currentArray.filter((item) => item !== value) as any
      if (newFilters[filterType]?.length === 0) {
        delete newFilters[filterType]
      }
    }

    updateFilters(newFilters)
  }

  const addFilter = (filterType: keyof DeviceFilters, value: string) => {
    const newFilters = { ...localFilters }

    if (filterType === "search") {
      newFilters.search = value
    } else {
      const currentArray = (newFilters[filterType] as string[]) || []
      if (!currentArray.includes(value)) {
        newFilters[filterType] = [...currentArray, value] as any
      }
    }

    updateFilters(newFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.search) count++
    if (localFilters.type?.length) count += localFilters.type.length
    if (localFilters.status?.length) count += localFilters.status.length
    if (localFilters.condition?.length) count += localFilters.condition.length
    return count
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search devices..."
            value={localFilters.search || ""}
            onChange={(e) => addFilter("search", e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select onValueChange={(value) => addFilter("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
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

              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(value) => addFilter("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
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
                <Label>Condition</Label>
                <Select onValueChange={(value) => addFilter("condition", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceConditionsList.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {getActiveFilterCount() > 0 && (
                <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {localFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {localFilters.search}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("search")} />
            </Badge>
          )}
          {localFilters.type?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              Type: {type.charAt(0).toUpperCase() + type.slice(1)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("type", type)} />
            </Badge>
          ))}
          {localFilters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status.charAt(0).toUpperCase() + status.slice(1)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("status", status)} />
            </Badge>
          ))}
          {localFilters.condition?.map((condition) => (
            <Badge key={condition} variant="secondary" className="gap-1">
              Condition: {condition.charAt(0).toUpperCase() + condition.slice(1)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("condition", condition)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export { DeviceFiltersComponent as DeviceFilters }
