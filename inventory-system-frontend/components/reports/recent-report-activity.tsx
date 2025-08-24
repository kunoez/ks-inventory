"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, FileText, Table, FileSpreadsheet, FileJson, AlertCircle } from "lucide-react"
import apiClient from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"

interface ReportActivity {
  id: string
  reportType: string
  reportName: string
  format: string
  generatedBy: string
  generatedByEmail?: string
  createdAt: string
  success: boolean
  errorMessage?: string
  fileSize?: number
  recordCount?: number
}

const formatIcons = {
  PDF: FileText,
  Excel: FileSpreadsheet,
  CSV: Table,
  JSON: FileJson,
}

const formatColors = {
  PDF: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  Excel: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  CSV: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  JSON: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
}

export function RecentReportActivity() {
  const [activities, setActivities] = useState<ReportActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentActivities()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getRecentReportActivity(undefined, 10)
      setActivities(data)
    } catch (err) {
      console.error("Failed to fetch report activities:", err)
      setError("Failed to load recent report activities")
      // Set mock data for demonstration
      setActivities([
        {
          id: "1",
          reportType: "device_inventory",
          reportName: "Device Inventory Summary",
          format: "PDF",
          generatedBy: "John Doe",
          generatedByEmail: "john.doe@example.com",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          success: true,
          fileSize: 245000,
          recordCount: 150,
        },
        {
          id: "2",
          reportType: "license_compliance",
          reportName: "License Compliance Report",
          format: "Excel",
          generatedBy: "Jane Smith",
          generatedByEmail: "jane.smith@example.com",
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          success: true,
          fileSize: 180000,
          recordCount: 85,
        },
        {
          id: "3",
          reportType: "cost_analysis",
          reportName: "Cost Analysis Report",
          format: "CSV",
          generatedBy: "Mike Johnson",
          generatedByEmail: "mike.johnson@example.com",
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          success: true,
          fileSize: 92000,
          recordCount: 200,
        },
        {
          id: "4",
          reportType: "employee_asset",
          reportName: "Employee Asset Report",
          format: "PDF",
          generatedBy: "Sarah Wilson",
          generatedByEmail: "sarah.wilson@example.com",
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          success: true,
          fileSize: 310000,
          recordCount: 120,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      device_inventory: "Device Inventory",
      license_compliance: "License Compliance",
      cost_analysis: "Cost Analysis",
      employee_asset: "Employee Assets",
      phone_contract: "Phone Contracts",
      financial_overview: "Financial Overview",
      expiring_licenses: "Expiring Licenses",
      maintenance_schedule: "Maintenance Schedule",
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Report Activity
        </CardTitle>
        <CardDescription>Latest report generations and exports</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>No recent report activities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = formatIcons[activity.format as keyof typeof formatIcons] || FileText
                const colorClass = formatColors[activity.format as keyof typeof formatColors] || "bg-gray-100 text-gray-700"

                return (
                  <div key={activity.id} className="flex items-start gap-4 group">
                    <div className={`p-2 rounded-lg ${colorClass} transition-transform group-hover:scale-105`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{activity.reportName}</p>
                          <p className="text-xs text-muted-foreground">
                            Generated by {activity.generatedBy}
                            {activity.fileSize && (
                              <span className="ml-2">• {formatFileSize(activity.fileSize)}</span>
                            )}
                            {activity.recordCount && (
                              <span className="ml-2">• {activity.recordCount} records</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.format}
                          </Badge>
                          {!activity.success && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}