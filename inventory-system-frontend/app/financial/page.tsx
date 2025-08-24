"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  BarChart3,
  AlertTriangle,
  ChevronDown,
  Building2,
} from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { deviceService, licenseService, employeeService, companyService } from "@/lib/data-service"
import type { Device, License, Employee, Company } from "@/lib/types"

export default function FinancialPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [licenses, setLicenses] = useState<License[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [devicesData, licensesData, employeesData, companiesData] = await Promise.all([
        deviceService.getAll(),
        licenseService.getAll(),
        employeeService.getAll(),
        companyService.getAll()
      ])
      setDevices(devicesData || [])
      setLicenses(licensesData || [])
      setEmployees(employeesData || [])
      setCompanies(companiesData || [])
    }
    loadData()
  }, [])

  // Filter data by selected companies
  const filteredDevices =
    selectedCompanies.length === 0
      ? devices
      : devices.filter((device) => device.companyId && selectedCompanies.includes(device.companyId))

  const filteredLicenses =
    selectedCompanies.length === 0
      ? licenses
      : licenses.filter((license) => license.companyId && selectedCompanies.includes(license.companyId))

  const filteredEmployees =
    selectedCompanies.length === 0
      ? employees
      : employees.filter((employee) => employee.companyId && selectedCompanies.includes(employee.companyId))

  // Update calculations to use filtered data
  const totalDeviceValue = filteredDevices.reduce((sum, device) => sum + device.cost, 0)
  const totalLicenseCost = filteredLicenses.reduce((sum, license) => sum + license.cost, 0)
  const totalInventoryValue = totalDeviceValue + totalLicenseCost

  const activeEmployees = filteredEmployees.filter((emp) => emp.status === "active").length
  const costPerEmployee = activeEmployees > 0 ? totalInventoryValue / activeEmployees : 0

  // Device analytics
  const devicesByType = filteredDevices.reduce(
    (acc, device) => {
      acc[device.type] = (acc[device.type] || 0) + device.cost
      return acc
    },
    {} as Record<string, number>,
  )

  const deviceTypeData = Object.entries(devicesByType).map(([type, value]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value,
    count: filteredDevices.filter((d) => d.type === type).length,
  }))

  // License analytics
  const licensesByVendor = filteredLicenses.reduce(
    (acc, license) => {
      acc[license.vendor] = (acc[license.vendor] || 0) + license.cost
      return acc
    },
    {} as Record<string, number>,
  )

  const licenseVendorData = Object.entries(licensesByVendor).map(([vendor, cost]) => ({
    name: vendor,
    cost,
    licenses: filteredLicenses.filter((l) => l.vendor === vendor).length,
  }))

  // Utilization metrics
  const licenseUtilization = filteredLicenses.map((license) => ({
    name: license.name,
    utilization: (license.currentUsers / license.maxUsers) * 100,
    cost: license.cost,
    wastedSeats: license.maxUsers - license.currentUsers,
    wastedCost: (license.cost / license.maxUsers) * (license.maxUsers - license.currentUsers),
  }))

  const totalWastedLicenseCost = licenseUtilization.reduce((sum, item) => sum + item.wastedCost, 0)

  // Expiring licenses
  const expiringLicenses = filteredLicenses.filter((license) => {
    if (!license.expiryDate) return false
    const expiry = new Date(license.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Company selection handlers
  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId],
    )
  }

  const handleSelectAll = () => {
    setSelectedCompanies(companies.map((c) => c.id))
  }

  const handleClearAll = () => {
    setSelectedCompanies([])
  }

  const getSelectedCompanyNames = () => {
    if (selectedCompanies.length === 0) return "All Companies"
    if (selectedCompanies.length === companies.length) return "All Companies"
    if (selectedCompanies.length === 1) {
      const company = companies.find((c) => c.id === selectedCompanies[0])
      return company?.name || "Unknown Company"
    }
    return `${selectedCompanies.length} Companies Selected`
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Financial Analysis</h1>
              <p className="text-muted-foreground">
                Comprehensive financial overview of your IT inventory and license investments
              </p>
            </div>

            {/* Company filter multiselect */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-between bg-transparent">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {getSelectedCompanyNames()}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filter by Companies</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                        Select All
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearAll}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {companies.map((company) => (
                      <div key={company.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={company.id}
                          checked={selectedCompanies.includes(company.id)}
                          onCheckedChange={() => handleCompanyToggle(company.id)}
                        />
                        <label
                          htmlFor={company.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <div>
                            <div className="font-medium">{company.name}</div>
                            {company.code && <div className="text-xs text-muted-foreground">{company.code}</div>}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedCompanies.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Showing data for {selectedCompanies.length} of {companies.length} companies
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                <p className="text-xs text-muted-foreground">Devices + Licenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Device Assets</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalDeviceValue)}</div>
                <p className="text-xs text-muted-foreground">{filteredDevices.length} devices total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Annual License Cost</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalLicenseCost)}</div>
                <p className="text-xs text-muted-foreground">{filteredLicenses.length} licenses active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Employee</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costPerEmployee)}</div>
                <p className="text-xs text-muted-foreground">{activeEmployees} active employees</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="devices">Device Analysis</TabsTrigger>
              <TabsTrigger value="licenses">License Analysis</TabsTrigger>
              <TabsTrigger value="optimization">Cost Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Breakdown</CardTitle>
                    <CardDescription>Distribution of total inventory value</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Devices", value: totalDeviceValue },
                            { name: "Licenses", value: totalLicenseCost },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Devices", value: totalDeviceValue },
                            { name: "Licenses", value: totalLicenseCost },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Alerts</CardTitle>
                    <CardDescription>Items requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {totalWastedLicenseCost > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">Unused License Seats</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(totalWastedLicenseCost)} in underutilized licenses
                          </p>
                        </div>
                      </div>
                    )}

                    {expiringLicenses.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">Expiring Licenses</p>
                          <p className="text-xs text-muted-foreground">
                            {expiringLicenses.length} licenses expiring within 30 days
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Total Assets</p>
                        <p className="text-xs text-muted-foreground">
                          {filteredDevices.length + filteredLicenses.length} items worth{" "}
                          {formatCurrency(totalInventoryValue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Value by Type</CardTitle>
                    <CardDescription>Investment breakdown by device category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={deviceTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Device Statistics</CardTitle>
                    <CardDescription>Detailed breakdown of device inventory</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deviceTypeData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(item.value)}</div>
                            <div className="text-xs text-muted-foreground">{item.count} devices</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="licenses" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>License Costs by Vendor</CardTitle>
                    <CardDescription>Annual spending by software vendor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={licenseVendorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Bar dataKey="cost" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>License Utilization</CardTitle>
                    <CardDescription>Current usage vs. available seats</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {licenseUtilization.slice(0, 5).map((item) => (
                        <div key={item.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm text-muted-foreground">{item.utilization.toFixed(0)}%</span>
                          </div>
                          <Progress value={item.utilization} className="h-2" />
                          {item.wastedSeats > 0 && (
                            <p className="text-xs text-yellow-600">
                              {item.wastedSeats} unused seats ({formatCurrency(item.wastedCost)} wasted)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Optimization Opportunities</CardTitle>
                    <CardDescription>Recommendations to reduce IT spending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {totalWastedLicenseCost > 0 && (
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                            <h3 className="font-semibold">License Optimization</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            You could save {formatCurrency(totalWastedLicenseCost)} annually by optimizing license
                            usage.
                          </p>
                          <div className="space-y-2">
                            {licenseUtilization
                              .filter((item) => item.wastedSeats > 0)
                              .sort((a, b) => b.wastedCost - a.wastedCost)
                              .slice(0, 3)
                              .map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                  <span>{item.name}</span>
                                  <Badge variant="outline" className="text-red-600">
                                    -{formatCurrency(item.wastedCost)}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="h-5 w-5 text-blue-500" />
                          <h3 className="font-semibold">Budget Planning</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Monthly License Cost</p>
                            <p className="font-semibold">{formatCurrency(totalLicenseCost / 12)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cost per Active Employee</p>
                            <p className="font-semibold">{formatCurrency(costPerEmployee)}</p>
                          </div>
                        </div>
                      </div>

                      {expiringLicenses.length > 0 && (
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-semibold">Renewal Planning</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {expiringLicenses.length} licenses require renewal within 30 days.
                          </p>
                          <div className="space-y-2">
                            {expiringLicenses.slice(0, 3).map((license) => (
                              <div key={license.id} className="flex items-center justify-between text-sm">
                                <span>{license.name}</span>
                                <Badge variant="outline" className="text-yellow-600">
                                  {formatCurrency(license.cost)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
