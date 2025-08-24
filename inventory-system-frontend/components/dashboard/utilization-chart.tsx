"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { DashboardStats } from "@/lib/types"

interface UtilizationChartProps {
  stats: DashboardStats
}

export function UtilizationChart({ stats }: UtilizationChartProps) {
  const deviceUtilization = Math.round((stats.assignedDevices / stats.totalDevices) * 100)
  const licenseUtilization = Math.round(
    (stats.usedLicenseSeats / (stats.usedLicenseSeats + stats.availableLicenseSeats)) * 100,
  )

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) return "High"
    if (percentage >= 75) return "Medium"
    return "Low"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Utilization</CardTitle>
        <CardDescription>Current usage of devices and licenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Device Utilization</span>
            <span className="text-muted-foreground">
              {stats.assignedDevices} / {stats.totalDevices} ({deviceUtilization}%)
            </span>
          </div>
          <Progress value={deviceUtilization} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Available: {stats.availableDevices}</span>
            <span className={`font-medium ${deviceUtilization >= 75 ? "text-yellow-600" : "text-green-600"}`}>
              {getUtilizationStatus(deviceUtilization)} Usage
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">License Utilization</span>
            <span className="text-muted-foreground">
              {stats.usedLicenseSeats} / {stats.usedLicenseSeats + stats.availableLicenseSeats} ({licenseUtilization}%)
            </span>
          </div>
          <Progress value={licenseUtilization} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Available: {stats.availableLicenseSeats}</span>
            <span className={`font-medium ${licenseUtilization >= 75 ? "text-yellow-600" : "text-green-600"}`}>
              {getUtilizationStatus(licenseUtilization)} Usage
            </span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.availableDevices}</div>
              <div className="text-xs text-muted-foreground">Available Devices</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.availableLicenseSeats}</div>
              <div className="text-xs text-muted-foreground">Available Licenses</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
