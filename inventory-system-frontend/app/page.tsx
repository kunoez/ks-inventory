"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Laptop,
  Key,
  Users,
  AlertTriangle,
  Activity,
  AlertCircle,
  Info,
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"
import apiClient from "@/lib/api-client"
import Link from "next/link"

interface DashboardStats {
  devices: {
    total: number
    available: number
    assigned: number
    maintenance: number
    utilization: number
  }
  licenses: {
    total: number
    active: number
    totalSeats: number
    usedSeats: number
    availableSeats: number
    utilization: number
    expiringSoon: number
  }
  employees: {
    total: number
    active: number
  }
  phoneContracts: {
    total: number
    active: number
  }
}

interface ResourceUtilization {
  devicesByType: Array<{
    type: string
    total: number
    assigned: number
    utilization: number
  }>
  licensesByVendor: Array<{
    vendor: string
    totalSeats: number
    usedSeats: number
    utilization: number
  }>
}

interface Alert {
  type: 'critical' | 'warning' | 'info'
  category: string
  message: string
  timestamp: Date
  entityId?: string
  entityName?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [utilization, setUtilization] = useState<ResourceUtilization | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [availableDevices, setAvailableDevices] = useState<any[]>([])
  const [availableLicenses, setAvailableLicenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        const [statsData, utilizationData, alertsData, devicesData, licensesData] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getResourceUtilization(),
          apiClient.getDashboardAlerts(),
          apiClient.getAvailableDevices(undefined, 5),
          apiClient.getAvailableLicenses(undefined, 5),
        ])
        
        setStats(statsData)
        setUtilization(utilizationData)
        setAlerts(alertsData)
        setAvailableDevices(devicesData)
        setAvailableLicenses(licensesData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set mock data for demo purposes
        setStats({
          devices: { total: 150, available: 45, assigned: 95, maintenance: 10, utilization: 63 },
          licenses: { 
            total: 85, 
            active: 75, 
            totalSeats: 500, 
            usedSeats: 425, 
            availableSeats: 75, 
            utilization: 85,
            expiringSoon: 8
          },
          employees: { total: 120, active: 115 },
          phoneContracts: { total: 60, active: 55 },
        })
        setUtilization({
          devicesByType: [
            { type: 'Laptop', total: 80, assigned: 65, utilization: 81 },
            { type: 'Desktop', total: 40, assigned: 20, utilization: 50 },
            { type: 'Phone', total: 30, assigned: 10, utilization: 33 },
          ],
          licensesByVendor: [
            { vendor: 'Microsoft', totalSeats: 200, usedSeats: 180, utilization: 90 },
            { vendor: 'Adobe', totalSeats: 150, usedSeats: 120, utilization: 80 },
            { vendor: 'Atlassian', totalSeats: 150, usedSeats: 125, utilization: 83 },
          ],
        })
        setAlerts([
          { type: 'warning', category: 'license', message: '8 licenses expiring in the next 30 days', timestamp: new Date() },
          { type: 'info', category: 'device', message: '10 devices currently in maintenance', timestamp: new Date() },
          { type: 'warning', category: 'license', message: 'License utilization at 85% - additional seats may be needed', timestamp: new Date() },
        ])
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  const deviceChartData = [
    { name: 'Assigned', value: stats?.devices.assigned || 0, color: '#4F46E5' },
    { name: 'Available', value: stats?.devices.available || 0, color: '#10B981' },
    { name: 'Maintenance', value: stats?.devices.maintenance || 0, color: '#F59E0B' },
  ]

  const licenseChartData = [
    { name: 'Used', value: stats?.licenses.usedSeats || 0, color: '#4F46E5' },
    { name: 'Available', value: stats?.licenses.availableSeats || 0, color: '#10B981' },
  ]


  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your IT inventory and resource management</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Laptop className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.devices.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.devices.assigned || 0} assigned ({stats?.devices.utilization || 0}%)
                </p>
                <Progress value={stats?.devices.utilization || 0} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">License Seats</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.licenses.totalSeats || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.licenses.usedSeats || 0} used ({stats?.licenses.utilization || 0}%)
                </p>
                <Progress value={stats?.licenses.utilization || 0} className="mt-2 h-1" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.employees.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Out of {stats?.employees.total || 0} total
                </p>
                <div className="mt-2 flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Active workforce
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.licenses.expiringSoon || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Licenses in 30 days
                </p>
                <Link href="/licenses">
                  <Button variant="link" className="h-auto p-0 mt-2 text-xs">
                    View licenses <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Resource Utilization and Alerts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Resource Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Device Utilization</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={deviceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {deviceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {deviceChartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">License Utilization</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={licenseChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {licenseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {licenseChartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active alerts</p>
                      </div>
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert, index) => {
                      const alertColors = {
                        critical: 'bg-red-50 border-red-200 hover:bg-red-100',
                        warning: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
                        info: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                      }
                      const iconColors = {
                        critical: 'text-red-600',
                        warning: 'text-amber-600',
                        info: 'text-blue-600'
                      }
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border transition-colors ${alertColors[alert.type] || alertColors.info}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 ${iconColors[alert.type] || iconColors.info}`}>
                              {alert.type === 'critical' ? (
                                <AlertCircle className="h-5 w-5" />
                              ) : alert.type === 'warning' ? (
                                <AlertTriangle className="h-5 w-5" />
                              ) : (
                                <Info className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 break-words">
                                {alert.message}
                              </p>
                              {alert.entityName && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {alert.category === 'license' ? 'License' : 'Device'}: {alert.entityName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  {alerts.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-gray-500">
                        +{alerts.length - 5} more alerts
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Resources */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Available Devices */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Available Devices</CardTitle>
                  <Badge variant="secondary">{stats?.devices.available || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {availableDevices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No devices available</p>
                ) : (
                  <div className="space-y-2">
                    {availableDevices.slice(0, 5).map((device) => (
                      <div key={device.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{device.type} • {device.brand}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {device.condition}
                        </Badge>
                      </div>
                    ))}
                    {availableDevices.length > 5 && (
                      <Link href="/devices?status=available">
                        <Button variant="link" className="h-auto p-0 text-sm">
                          View all available devices <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Licenses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Available Licenses</CardTitle>
                  <Badge variant="secondary">{stats?.licenses.availableSeats || 0} seats</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {availableLicenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No licenses available</p>
                ) : (
                  <div className="space-y-2">
                    {availableLicenses.slice(0, 5).map((license) => (
                      <div key={license.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{license.name}</p>
                          <p className="text-xs text-muted-foreground">{license.vendor} • v{license.version}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {license.availableSeats} / {license.totalSeats}
                        </Badge>
                      </div>
                    ))}
                    {availableLicenses.length > 5 && (
                      <Link href="/licenses">
                        <Button variant="link" className="h-auto p-0 text-sm">
                          View all licenses <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}