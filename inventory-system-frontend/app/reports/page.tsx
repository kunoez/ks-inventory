"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  FileText,
  Download,
  CalendarIcon,
  BarChart3,
  Activity,
  Users,
  Laptop,
  Key,
  Clock,
  CheckCircle,
} from "lucide-react"
import { format } from "date-fns"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { RecentReportActivity } from "@/components/reports/recent-report-activity"
import { deviceService, licenseService, employeeService } from "@/lib/data-service"
import type { Device, License, Employee } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

export default function ReportsPage() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [licenses, setLicenses] = useState<License[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [exportFormat, setExportFormat] = useState<string>("csv")

  useEffect(() => {
    const loadData = async () => {
      const [devicesData, licensesData, employeesData] = await Promise.all([
        deviceService.getAll(),
        licenseService.getAll(),
        employeeService.getAll()
      ])
      setDevices(devicesData || [])
      setLicenses(licensesData || [])
      setEmployees(employeesData || [])
    }
    loadData()
  }, [])

  const generateCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || ""
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateExcel = (data: any[], headers: string[], filename: string) => {
    // For Excel, we'll use CSV format with .xlsx extension for simplicity
    // In a real app, you'd use a library like xlsx or exceljs
    const csvContent = [
      headers.join("\t"),
      ...data.map((row) => headers.map((header) => row[header] || "").join("\t")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.xlsx`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (content: string, filename: string) => {
    // For PDF, we'll create a simple HTML-based PDF
    // In a real app, you'd use a library like jsPDF or puppeteer
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>${filename}</h1>
            <p>Generated on: ${format(new Date(), "PPP")}</p>
            ${content}
          </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const exportDeviceInventory = () => {
    const data = devices.map((device) => ({
      "Device Name": device.name,
      Type: device.type,
      Brand: device.brand,
      Model: device.model,
      "Serial Number": device.serialNumber,
      Status: device.status,
      Condition: device.condition,
      Cost: `$${device.cost.toFixed(2)}`,
      "Purchase Date": format(new Date(device.purchaseDate), "yyyy-MM-dd"),
      "Warranty Expiry": device.warrantyExpiry ? format(new Date(device.warrantyExpiry), "yyyy-MM-dd") : "N/A",
      Location: device.location || "N/A",
      "Assigned To": device.assignedTo || "Unassigned",
    }))

    const headers = [
      "Device Name",
      "Type",
      "Brand",
      "Model",
      "Serial Number",
      "Status",
      "Condition",
      "Cost",
      "Purchase Date",
      "Warranty Expiry",
      "Location",
      "Assigned To",
    ]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "Device_Inventory_Summary")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "Device_Inventory_Summary")
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `
      generatePDF(tableContent, "Device Inventory Summary")
    }
  }

  const exportLicenseUtilization = () => {
    const data = licenses.map((license) => ({
      "License Name": license.name,
      Vendor: license.vendor,
      Version: license.version,
      Type: license.type,
      Status: license.status,
      "Current Users": license.currentUsers,
      "Max Users": license.maxUsers,
      Utilization: `${Math.round((license.currentUsers / license.maxUsers) * 100)}%`,
      Cost: `$${license.cost.toFixed(2)}`,
      "Purchase Date": format(new Date(license.purchaseDate), "yyyy-MM-dd"),
      "Expiry Date": license.expiryDate ? format(new Date(license.expiryDate), "yyyy-MM-dd") : "N/A",
    }))

    const headers = [
      "License Name",
      "Vendor",
      "Version",
      "Type",
      "Status",
      "Current Users",
      "Max Users",
      "Utilization",
      "Cost",
      "Purchase Date",
      "Expiry Date",
    ]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "License_Utilization_Report")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "License_Utilization_Report")
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `
      generatePDF(tableContent, "License Utilization Report")
    }
  }

  const exportAssetValuation = () => {
    const deviceData = devices.map((device) => ({
      "Asset Name": device.name,
      Type: "Device",
      Category: device.type,
      "Brand/Vendor": device.brand,
      "Model/Version": device.model,
      Cost: device.cost,
      "Purchase Date": format(new Date(device.purchaseDate), "yyyy-MM-dd"),
      Status: device.status,
    }))

    const licenseData = licenses.map((license) => ({
      "Asset Name": license.name,
      Type: "License",
      Category: license.type,
      "Brand/Vendor": license.vendor,
      "Model/Version": license.version,
      Cost: license.cost,
      "Purchase Date": format(new Date(license.purchaseDate), "yyyy-MM-dd"),
      Status: license.status,
    }))

    const data = [...deviceData, ...licenseData].map((item) => ({
      ...item,
      Cost: `$${item.Cost.toFixed(2)}`,
    }))

    const totalValue = devices.reduce((sum, d) => sum + d.cost, 0) + licenses.reduce((sum, l) => sum + l.cost, 0)

    const headers = [
      "Asset Name",
      "Type",
      "Category",
      "Brand/Vendor",
      "Model/Version",
      "Cost",
      "Purchase Date",
      "Status",
    ]

    if (exportFormat === "csv") {
      generateCSV(
        [...data, { "Asset Name": "TOTAL VALUE", Cost: `$${totalValue.toFixed(2)}` }],
        headers,
        "Asset_Valuation_Report",
      )
    } else if (exportFormat === "excel") {
      generateExcel(
        [...data, { "Asset Name": "TOTAL VALUE", Cost: `$${totalValue.toFixed(2)}` }],
        headers,
        "Asset_Valuation_Report",
      )
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] || ""}</td>`).join("")}</tr>`).join("")}
            <tr style="font-weight: bold; background-color: #f0f0f0;">
              <td>TOTAL VALUE</td>
              <td colspan="6"></td>
              <td>$${totalValue.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `
      generatePDF(tableContent, "Asset Valuation Report")
    }
  }

  const exportWarrantyStatus = () => {
    const now = new Date()
    const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    const data = devices
      .filter((device) => device.warrantyExpiry)
      .map((device) => {
        const warrantyDate = new Date(device.warrantyExpiry!)
        const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return {
          "Device Name": device.name,
          Type: device.type,
          Brand: device.brand,
          Model: device.model,
          "Serial Number": device.serialNumber,
          "Warranty Expiry": format(warrantyDate, "yyyy-MM-dd"),
          "Days Until Expiry": daysUntilExpiry,
          Status:
            daysUntilExpiry < 0
              ? "Expired"
              : daysUntilExpiry < 30
                ? "Critical"
                : daysUntilExpiry < 90
                  ? "Warning"
                  : "OK",
          "Assigned To": device.assignedTo || "Unassigned",
        }
      })
      .sort((a, b) => a["Days Until Expiry"] - b["Days Until Expiry"])

    const headers = [
      "Device Name",
      "Type",
      "Brand",
      "Model",
      "Serial Number",
      "Warranty Expiry",
      "Days Until Expiry",
      "Status",
      "Assigned To",
    ]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "Warranty_Status_Report")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "Warranty_Status_Report")
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `
      generatePDF(tableContent, "Warranty Status Report")
    }
  }

  const exportAssignmentHistory = () => {
    // Get all assignments from devices and licenses
    const deviceAssignments = devices
      .filter((device) => device.assignedTo)
      .map((device) => ({
        "Asset Name": device.name,
        "Asset Type": "Device",
        Category: device.type,
        "Assigned To": device.assignedTo,
        "Assignment Date": format(new Date(device.purchaseDate), "yyyy-MM-dd"), // Using purchase date as proxy
        Status: "Active",
        Department: "IT", // Default value
        "Asset Value": `$${device.cost.toFixed(2)}`,
      }))

    const licenseAssignments = licenses
      .filter((license) => license.currentUsers > 0)
      .map((license) => ({
        "Asset Name": license.name,
        "Asset Type": "License",
        Category: license.type,
        "Assigned To": `${license.currentUsers} users`,
        "Assignment Date": format(new Date(license.purchaseDate), "yyyy-MM-dd"),
        Status: license.status,
        Department: "IT",
        "Asset Value": `$${license.cost.toFixed(2)}`,
      }))

    const data = [...deviceAssignments, ...licenseAssignments]

    const headers = [
      "Asset Name",
      "Asset Type",
      "Category",
      "Assigned To",
      "Assignment Date",
      "Status",
      "Department",
      "Asset Value",
    ]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "Assignment_History_Report")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "Assignment_History_Report")
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `
      generatePDF(tableContent, "Assignment History Report")
    }
  }

  const exportUtilizationAnalytics = () => {
    const deviceUtilization = {
      "Total Devices": devices.length,
      "Assigned Devices": devices.filter((d) => d.status === "assigned").length,
      "Available Devices": devices.filter((d) => d.status === "available").length,
      "Under Maintenance": devices.filter((d) => d.status === "maintenance").length,
      "Device Utilization Rate": `${Math.round((devices.filter((d) => d.status === "assigned").length / devices.length) * 100)}%`,
    }

    const licenseUtilization = {
      "Total Licenses": licenses.length,
      "Active Licenses": licenses.filter((l) => l.status === "active").length,
      "Expired Licenses": licenses.filter((l) => l.status === "expired").length,
      "Total License Seats": licenses.reduce((sum, l) => sum + l.maxUsers, 0),
      "Used License Seats": licenses.reduce((sum, l) => sum + l.currentUsers, 0),
      "License Utilization Rate": `${Math.round((licenses.reduce((sum, l) => sum + l.currentUsers, 0) / licenses.reduce((sum, l) => sum + l.maxUsers, 0)) * 100)}%`,
    }

    const data = [
      { Metric: "Device Utilization", ...deviceUtilization },
      { Metric: "License Utilization", ...licenseUtilization },
    ]

    const headers = [
      "Metric",
      "Total Devices",
      "Assigned Devices",
      "Available Devices",
      "Under Maintenance",
      "Device Utilization Rate",
    ]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "Utilization_Analytics_Report")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "Utilization_Analytics_Report")
    } else {
      const tableContent = `
        <div>
          <h2>Device Utilization</h2>
          <table>
            <tr><td>Total Devices</td><td>${deviceUtilization["Total Devices"]}</td></tr>
            <tr><td>Assigned Devices</td><td>${deviceUtilization["Assigned Devices"]}</td></tr>
            <tr><td>Available Devices</td><td>${deviceUtilization["Available Devices"]}</td></tr>
            <tr><td>Under Maintenance</td><td>${deviceUtilization["Under Maintenance"]}</td></tr>
            <tr><td>Utilization Rate</td><td>${deviceUtilization["Device Utilization Rate"]}</td></tr>
          </table>
          
          <h2>License Utilization</h2>
          <table>
            <tr><td>Total Licenses</td><td>${licenseUtilization["Total Licenses"]}</td></tr>
            <tr><td>Active Licenses</td><td>${licenseUtilization["Active Licenses"]}</td></tr>
            <tr><td>Expired Licenses</td><td>${licenseUtilization["Expired Licenses"]}</td></tr>
            <tr><td>Total License Seats</td><td>${licenseUtilization["Total License Seats"]}</td></tr>
            <tr><td>Used License Seats</td><td>${licenseUtilization["Used License Seats"]}</td></tr>
            <tr><td>Utilization Rate</td><td>${licenseUtilization["License Utilization Rate"]}</td></tr>
          </table>
        </div>
      `
      generatePDF(tableContent, "Utilization Analytics Report")
    }
  }

  const exportCostAnalysis = () => {
    const deviceCosts = devices.reduce(
      (acc, device) => {
        const type = device.type
        if (!acc[type]) acc[type] = { count: 0, totalCost: 0, items: [] }
        acc[type].count++
        acc[type].totalCost += device.cost
        acc[type].items.push(device)
        return acc
      },
      {} as Record<string, { count: number; totalCost: number; items: Device[] }>,
    )

    const licenseCosts = licenses.reduce(
      (acc, license) => {
        const vendor = license.vendor
        if (!acc[vendor]) acc[vendor] = { count: 0, totalCost: 0, items: [] }
        acc[vendor].count++
        acc[vendor].totalCost += license.cost
        acc[vendor].items.push(license)
        return acc
      },
      {} as Record<string, { count: number; totalCost: number; items: License[] }>,
    )

    const data = [
      ...Object.entries(deviceCosts).map(([type, data]) => ({
        Category: type,
        Type: "Device",
        Count: data.count,
        "Total Cost": `$${data.totalCost.toFixed(2)}`,
        "Average Cost": `$${(data.totalCost / data.count).toFixed(2)}`,
        "Percentage of Total": `${Math.round((data.totalCost / (devices.reduce((sum, d) => sum + d.cost, 0) + licenses.reduce((sum, l) => sum + l.cost, 0))) * 100)}%`,
      })),
      ...Object.entries(licenseCosts).map(([vendor, data]) => ({
        Category: vendor,
        Type: "License",
        Count: data.count,
        "Total Cost": `$${data.totalCost.toFixed(2)}`,
        "Average Cost": `$${(data.totalCost / data.count).toFixed(2)}`,
        "Percentage of Total": `${Math.round((data.totalCost / (devices.reduce((sum, d) => sum + d.cost, 0) + licenses.reduce((sum, l) => sum + l.cost, 0))) * 100)}%`,
      })),
    ]

    const totalCost = devices.reduce((sum, d) => sum + d.cost, 0) + licenses.reduce((sum, l) => sum + l.cost, 0)
    data.push({
      Category: "TOTAL",
      Type: "All Assets",
      Count: devices.length + licenses.length,
      "Total Cost": `$${totalCost.toFixed(2)}`,
      "Average Cost": `$${(totalCost / (devices.length + licenses.length)).toFixed(2)}`,
      "Percentage of Total": "100%",
    })

    const headers = ["Category", "Type", "Count", "Total Cost", "Average Cost", "Percentage of Total"]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "Cost_Analysis_Report")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "Cost_Analysis_Report")
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `
      generatePDF(tableContent, "Cost Analysis Report")
    }
  }

  const exportPerformanceMetrics = () => {
    const metrics = {
      "System Availability": "99.8%",
      "Average Response Time": "1.2s",
      "Device Uptime": `${Math.round((devices.filter((d) => d.status !== "maintenance").length / devices.length) * 100)}%`,
      "License Compliance": `${Math.round((licenses.filter((l) => l.currentUsers <= l.maxUsers).length / licenses.length) * 100)}%`,
      "Asset Utilization": `${Math.round((devices.filter((d) => d.status === "assigned").length / devices.length) * 100)}%`,
      "Maintenance Efficiency": `${Math.round(((devices.length - devices.filter((d) => d.status === "maintenance").length) / devices.length) * 100)}%`,
      "Cost per Employee": `$${((devices.reduce((sum, d) => sum + d.cost, 0) + licenses.reduce((sum, l) => sum + l.cost, 0)) / employees.filter((e) => e.status === "active").length).toFixed(2)}`,
      "ROI Score": "87%",
    }

    const data = Object.entries(metrics).map(([metric, value]) => ({
      "Performance Metric": metric,
      Value: value,
      Status:
        Number.parseFloat(value) >= 90
          ? "Excellent"
          : Number.parseFloat(value) >= 75
            ? "Good"
            : Number.parseFloat(value) >= 60
              ? "Fair"
              : "Needs Improvement",
      Target: "≥90%",
    }))

    const headers = ["Performance Metric", "Value", "Status", "Target"]

    if (exportFormat === "csv") {
      generateCSV(data, headers, "Performance_Metrics_Report")
    } else if (exportFormat === "excel") {
      generateExcel(data, headers, "Performance_Metrics_Report")
    } else {
      const tableContent = `
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      `
      generatePDF(tableContent, "Performance Metrics Report")
    }
  }

  const handleExportReport = async (reportType: string) => {
    try {
      // Map report names to report types
      const reportTypeMap: Record<string, string> = {
        "Device Inventory Summary": "device_inventory",
        "License Utilization Report": "license_compliance",
        "Asset Valuation Report": "financial_overview",
        "Warranty Status Report": "maintenance_schedule",
        "Assignment History Report": "employee_asset",
        "Utilization Analytics": "device_inventory",
        "Cost Analysis Report": "cost_analysis",
        "Performance Metrics": "financial_overview",
      }

      switch (reportType) {
        case "Device Inventory Summary":
          exportDeviceInventory()
          break
        case "License Utilization Report":
          exportLicenseUtilization()
          break
        case "Asset Valuation Report":
          exportAssetValuation()
          break
        case "Warranty Status Report":
          exportWarrantyStatus()
          break
        case "Assignment History Report":
          exportAssignmentHistory()
          break
        case "Utilization Analytics":
          exportUtilizationAnalytics()
          break
        case "Cost Analysis Report":
          exportCostAnalysis()
          break
        case "Performance Metrics":
          exportPerformanceMetrics()
          break
        default:
          toast({
            title: "Export Not Available",
            description: `Export functionality for "${reportType}" is not yet implemented.`,
            variant: "destructive",
          })
          return
      }

      // Log successful report generation
      try {
        await apiClient.logReportActivity({
          reportType: reportTypeMap[reportType] || "device_inventory",
          reportName: reportType,
          format: exportFormat.toUpperCase() as "PDF" | "CSV" | "Excel",
          generatedBy: user?.name || user?.email || "Unknown User",
          generatedByEmail: user?.email,
          generatedByUserId: user?.id,
          success: true,
          recordCount: devices.length + licenses.length,
        })
      } catch (logError) {
        console.error("Failed to log report activity:", logError)
      }

      toast({
        title: "Export Successful",
        description: `${reportType} has been exported as ${exportFormat.toUpperCase()}.`,
      })
    } catch (error) {
      // Log failed report generation
      try {
        await apiClient.logReportActivity({
          reportType: reportTypeMap[reportType] || "device_inventory",
          reportName: reportType,
          format: exportFormat.toUpperCase() as "PDF" | "CSV" | "Excel",
          generatedBy: user?.name || user?.email || "Unknown User",
          generatedByEmail: user?.email,
          generatedByUserId: user?.id,
          success: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
      } catch (logError) {
        console.error("Failed to log report error:", logError)
      }

      toast({
        title: "Export Failed",
        description: "There was an error exporting the report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const reportCategories = [
    {
      id: "inventory",
      title: "Inventory Status",
      description: "Current device and license inventory overview",
      icon: BarChart3,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      reports: [
        {
          name: "Device Inventory Summary",
          description: "Complete list of all devices with status",
          count: devices.length,
        },
        {
          name: "License Utilization Report",
          description: "License usage and availability metrics",
          count: licenses.length,
        },
        {
          name: "Asset Valuation Report",
          description: "Financial value of all IT assets",
          count: devices.length + licenses.length,
        },
        {
          name: "Warranty Status Report",
          description: "Devices approaching warranty expiration",
          count: devices.filter(
            (d) => d.warrantyExpiry && new Date(d.warrantyExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          ).length,
        },
      ],
    },
    {
      id: "operational",
      title: "Operational Insights",
      description: "Performance metrics and operational data",
      icon: Activity,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      reports: [
        {
          name: "Assignment History Report",
          description: "Device and license assignment tracking",
          count: devices.filter((d) => d.assignedTo).length + licenses.filter((l) => l.currentUsers > 0).length,
        },
        {
          name: "Utilization Analytics",
          description: "Resource utilization patterns and trends",
          count: Math.round((devices.filter((d) => d.status === "assigned").length / devices.length) * 100),
        },
        {
          name: "Cost Analysis Report",
          description: "IT spending analysis and optimization",
          count: devices.reduce((sum, d) => sum + d.cost, 0) + licenses.reduce((sum, l) => sum + l.cost, 0),
        },
        {
          name: "Performance Metrics",
          description: "System performance and efficiency metrics",
          count: devices.filter((d) => d.status === "available").length,
        },
      ],
    },
  ]

  const quickStats = [
    { label: "Total Devices", value: devices.length, icon: Laptop, trend: "+12%" },
    { label: "Active Licenses", value: licenses.length, icon: Key, trend: "+5%" },
    {
      label: "Active Employees",
      value: employees.filter((e) => e.status === "active").length,
      icon: Users,
      trend: "+8%",
    },
    { label: "Compliance Score", value: "94%", icon: CheckCircle, trend: "+2%" },
  ]

  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Koch Inventory Reports</h1>
              <p className="text-gray-600 mt-2">Streamline your inventory management with real-time insights</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <CalendarIcon className="h-4 w-4" />
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => range && setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <Card key={stat.label} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <stat.icon className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Categories */}
          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              {reportCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {reportCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <Card className={`border-2 ${category.color}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <category.icon className="h-6 w-6" />
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <CardDescription className="text-base">{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  {category.reports.map((report) => (
                    <Card key={report.name} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold">{report.name}</CardTitle>
                            <CardDescription>{report.description}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {typeof report.count === "string" ? report.count : report.count.toLocaleString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>Last updated: {format(new Date(), "MMM dd, HH:mm")}</span>
                          </div>
                          <Button
                            onClick={() => handleExportReport(report.name)}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Download className="h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Recent Report Activity Component */}
          <RecentReportActivity />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
