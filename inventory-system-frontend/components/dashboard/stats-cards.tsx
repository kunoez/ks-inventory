"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Laptop, Key, Users, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const deviceUtilization = stats.totalDevices > 0 
    ? Math.round((stats.assignedDevices / stats.totalDevices) * 100) 
    : 0
  
  const totalLicenseSeats = (stats.usedLicenseSeats || 0) + (stats.availableLicenseSeats || 0)
  const licenseUtilization = totalLicenseSeats > 0
    ? Math.round(((stats.usedLicenseSeats || 0) / totalLicenseSeats) * 100)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          <Laptop className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalDevices}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.assignedDevices} assigned</span>
            <Badge variant="outline" className="text-xs">
              {deviceUtilization}% utilized
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">License Seats</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalLicenseSeats || stats.totalLicenses || 0}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.usedLicenseSeats || stats.activeLicenses || 0} used</span>
            <Badge variant="outline" className="text-xs">
              {licenseUtilization || 0}% utilized
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeEmployees}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>of {stats.totalEmployees} total</span>
            {stats.activeEmployees > stats.totalEmployees * 0.9 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingExpirations || 0}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>licenses in 30 days</span>
            {(stats.upcomingExpirations || 0) > 0 && (
              <Badge variant="destructive" className="text-xs">
                Action needed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
