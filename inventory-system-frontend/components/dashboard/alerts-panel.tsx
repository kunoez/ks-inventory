"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, Laptop, Key, ExternalLink } from "lucide-react"
import { licenseService, deviceService } from "@/lib/data-service"
import Link from "next/link"
import type { License, Device } from "@/types"

export function AlertsPanel() {
  const [expiringLicenses, setExpiringLicenses] = useState<License[]>([])
  const [devicesNeedingAttention, setDevicesNeedingAttention] = useState<Device[]>([])
  const [highUtilizationLicenses, setHighUtilizationLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlerts() {
      try {
        // Get expiring licenses (within 30 days)
        const expiring = await licenseService.getExpiring(30)
        setExpiringLicenses(expiring)

        // Get devices that might need attention (maintenance, damaged, etc.)
        const devices = await deviceService.getAll({
          status: ["maintenance", "damaged"],
        })
        setDevicesNeedingAttention(devices)

        // Get licenses at high utilization (>90%)
        const allLicenses = await licenseService.getAll()
        const highUtil = allLicenses.filter(
          (license) => license.currentUsers / license.maxUsers > 0.9 && license.status === "active"
        )
        setHighUtilizationLicenses(highUtil)
      } catch (error) {
        console.error("Error loading alerts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [])

  const totalAlerts = expiringLicenses.length + devicesNeedingAttention.length + highUtilizationLicenses.length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alerts & Notifications
          </CardTitle>
          <CardDescription>Loading alerts...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alerts & Notifications
          {totalAlerts > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {totalAlerts}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Items requiring attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiringLicenses.length > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <strong>{expiringLicenses.length} licenses expiring soon</strong>
                  <div className="text-xs text-muted-foreground mt-1">
                    {expiringLicenses.slice(0, 2).map((license) => (
                      <div key={license.id}>
                        {license.name} - {getDaysUntilExpiry(license.expiryDate)} days
                      </div>
                    ))}
                    {expiringLicenses.length > 2 && <div>+{expiringLicenses.length - 2} more</div>}
                  </div>
                </div>
                <Link href="/licenses" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {highUtilizationLicenses.length > 0 && (
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <strong>{highUtilizationLicenses.length} licenses at high utilization</strong>
                  <div className="text-xs text-muted-foreground mt-1">
                    {highUtilizationLicenses.slice(0, 2).map((license) => (
                      <div key={license.id}>
                        {license.name} - {license.currentUsers}/{license.maxUsers} seats used
                      </div>
                    ))}
                    {highUtilizationLicenses.length > 2 && (
                      <div>+{highUtilizationLicenses.length - 2} more</div>
                    )}
                  </div>
                </div>
                <Link href="/licenses" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {devicesNeedingAttention.length > 0 && (
          <Alert>
            <Laptop className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <strong>{devicesNeedingAttention.length} devices need attention</strong>
                  <div className="text-xs text-muted-foreground mt-1">
                    {devicesNeedingAttention.slice(0, 2).map((device) => (
                      <div key={device.id}>
                        {device.name} - {device.status}
                      </div>
                    ))}
                    {devicesNeedingAttention.length > 2 && (
                      <div>+{devicesNeedingAttention.length - 2} more</div>
                    )}
                  </div>
                </div>
                <Link href="/devices" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {totalAlerts === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No alerts at this time. All systems operational.
          </div>
        )}
      </CardContent>
    </Card>
  )
}