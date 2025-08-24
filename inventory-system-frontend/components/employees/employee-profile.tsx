"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Laptop, Key, Calendar, Mail, User, Building } from "lucide-react"
import { employeeService, deviceService, licenseService, assignmentService } from "@/lib/data-service"
import type { Employee, Device, License, DeviceAssignment, LicenseAssignment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface EmployeeProfileProps {
  employeeId: string
  onBack: () => void
}

export function EmployeeProfile({ employeeId, onBack }: EmployeeProfileProps) {
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [deviceAssignments, setDeviceAssignments] = useState<(DeviceAssignment & { device: Device })[]>([])
  const [licenseAssignments, setLicenseAssignments] = useState<(LicenseAssignment & { license: License })[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadEmployeeData()
  }, [employeeId])

  const loadEmployeeData = async () => {
    const [emp, allDeviceAssigns, allLicenseAssigns, allDevices, allLicenses] = await Promise.all([
      employeeService.getById(employeeId),
      assignmentService.getDeviceAssignments(),
      assignmentService.getLicenseAssignments(),
      deviceService.getAll(),
      licenseService.getAll()
    ])
    
    if (!emp) return
    setEmployee(emp)

    // Filter device assignments for this employee
    const deviceAssigns = allDeviceAssigns?.filter(a => a.employeeId === employeeId) || []
    const deviceAssignmentsWithDetails = deviceAssigns.map((assignment) => {
      const device = allDevices?.find(d => d.id === assignment.deviceId)
      return {
        ...assignment,
        device: device!,
      }
    }).filter(a => a.device) // Filter out assignments without devices
    setDeviceAssignments(deviceAssignmentsWithDetails)

    // Filter license assignments for this employee
    const licenseAssigns = allLicenseAssigns?.filter(a => a.employeeId === employeeId) || []
    const licenseAssignmentsWithDetails = licenseAssigns.map((assignment) => {
      const license = allLicenses?.find(l => l.id === assignment.licenseId)
      return {
        ...assignment,
        license: license!,
      }
    }).filter(a => a.license) // Filter out assignments without licenses
    setLicenseAssignments(licenseAssignmentsWithDetails)
  }

  const handleReturnDevice = async (assignmentId: string) => {
    if (confirm("Are you sure you want to return this device?")) {
      const success = await assignmentService.returnDevice(assignmentId)
      if (success) {
        await loadEmployeeData()
        toast({
          title: "Device returned",
          description: "The device has been successfully returned.",
        })
      }
    }
  }

  const handleRevokeLicense = async (assignmentId: string) => {
    if (confirm("Are you sure you want to revoke this license?")) {
      const success = await assignmentService.revokeLicense(assignmentId)
      if (success) {
        await loadEmployeeData()
        toast({
          title: "License revoked",
          description: "The license has been successfully revoked.",
        })
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      returned: "bg-gray-100 text-gray-800",
      revoked: "bg-red-100 text-red-800",
      lost: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant="secondary" className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Employee not found</p>
        <Button onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const activeDevices = deviceAssignments.filter((a) => a.status === "active")
  const activeLicenses = licenseAssignments.filter((a) => a.status === "active")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-muted-foreground">{employee.position}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Started {formatDate(employee.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              {getStatusBadge(employee.status)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">ID:</span>
              <span className="text-sm font-mono">{employee.employeeId}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Active Devices
            </CardTitle>
            <CardDescription>{activeDevices.length} assigned</CardDescription>
          </CardHeader>
          <CardContent>
            {activeDevices.length > 0 ? (
              <div className="space-y-2">
                {activeDevices.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="text-sm">
                    <div className="font-medium">{assignment.device.name}</div>
                    <div className="text-muted-foreground">
                      {assignment.device.brand} {assignment.device.model}
                    </div>
                  </div>
                ))}
                {activeDevices.length > 3 && (
                  <div className="text-sm text-muted-foreground">+{activeDevices.length - 3} more</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No devices assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Active Licenses
            </CardTitle>
            <CardDescription>{activeLicenses.length} assigned</CardDescription>
          </CardHeader>
          <CardContent>
            {activeLicenses.length > 0 ? (
              <div className="space-y-2">
                {activeLicenses.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="text-sm">
                    <div className="font-medium">{assignment.license.name}</div>
                    <div className="text-muted-foreground">{assignment.license.vendor}</div>
                  </div>
                ))}
                {activeLicenses.length > 3 && (
                  <div className="text-sm text-muted-foreground">+{activeLicenses.length - 3} more</div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No licenses assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Device Assignments</TabsTrigger>
          <TabsTrigger value="licenses">License Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Assignment History</CardTitle>
              <CardDescription>All device assignments for this employee</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceAssignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deviceAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.device.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.device.brand} {assignment.device.model}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(assignment.assignedDate)}</TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{assignment.notes || "—"}</span>
                        </TableCell>
                        <TableCell>
                          {assignment.status === "active" && (
                            <Button variant="outline" size="sm" onClick={() => handleReturnDevice(assignment.id)}>
                              Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No device assignments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Assignment History</CardTitle>
              <CardDescription>All license assignments for this employee</CardDescription>
            </CardHeader>
            <CardContent>
              {licenseAssignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {licenseAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{assignment.license.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.license.vendor} {assignment.license.version}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(assignment.assignedDate)}</TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{assignment.notes || "—"}</span>
                        </TableCell>
                        <TableCell>
                          {assignment.status === "active" && (
                            <Button variant="outline" size="sm" onClick={() => handleRevokeLicense(assignment.id)}>
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No license assignments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
