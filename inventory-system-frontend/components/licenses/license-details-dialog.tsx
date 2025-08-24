"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  DollarSign,
  Users,
  Building,
  Package,
  Clock,
  User,
  Mail,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserMinus,
} from "lucide-react"
import type { License, LicenseAssignment, Employee } from "@/lib/types"
import { licenseService, assignmentService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"

interface LicenseDetailsDialogProps {
  license: License | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function LicenseDetailsDialog({ license, open, onOpenChange, onUpdate }: LicenseDetailsDialogProps) {
  const [fullLicense, setFullLicense] = useState<License | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadFullLicense = async () => {
    if (license && open) {
      setLoading(true)
      try {
        // Fetch full license details from backend which includes assignments with employee data
        const licenseDetails = await licenseService.getById(license.id)
        if (licenseDetails) {
          setFullLicense(licenseDetails)
        }
      } catch (error) {
        console.error('Error loading license details:', error)
        setFullLicense(license) // Fallback to the basic license data
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadFullLicense()
  }, [license, open])

  const handleUnassign = async (assignment: LicenseAssignment) => {
    const employee = assignment.employee
    if (confirm(`Are you sure you want to unassign this license from ${employee?.firstName} ${employee?.lastName}?`)) {
      try {
        const success = await assignmentService.unassignLicense(assignment.licenseId)
        
        if (success) {
          toast({
            title: "License Unassigned",
            description: `License has been unassigned from ${employee?.firstName} ${employee?.lastName}.`,
          })
          // Reload the license details
          await loadFullLicense()
          // Notify parent to refresh license list
          onUpdate?.()
        } else {
          toast({
            title: "Unassign Failed",
            description: "Failed to unassign the license. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error unassigning license:", error)
        toast({
          title: "Unassign Failed",
          description: "An error occurred while unassigning the license.",
          variant: "destructive",
        })
      }
    }
  }

  if (!license) return null

  // Use fullLicense if loaded, otherwise use the basic license
  const displayLicense = fullLicense || license
  const assignments = displayLicense.assignments || []

  const getStatusBadge = (status: License["status"]) => {
    const variants = {
      active: { className: "bg-green-100 text-green-800", icon: CheckCircle },
      expired: { className: "bg-red-100 text-red-800", icon: XCircle },
      suspended: { className: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
      cancelled: { className: "bg-gray-100 text-gray-800", icon: XCircle },
    }

    const variant = variants[status]
    const Icon = variant.icon

    return (
      <Badge variant="secondary" className={`${variant.className} gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTypeBadge = (type: License["type"]) => {
    const variants = {
      software: "bg-blue-100 text-blue-800",
      subscription: "bg-purple-100 text-purple-800",
      perpetual: "bg-green-100 text-green-800",
      volume: "bg-orange-100 text-orange-800",
      oem: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge variant="secondary" className={variants[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getUsagePercentage = () => {
    // Use displayLicense.currentUsers which is calculated by the backend
    return Math.round((displayLicense.currentUsers / displayLicense.maxUsers) * 100)
  }

  const isExpiringSoon = () => {
    if (!displayLicense.expiryDate) return false
    const expiry = new Date(displayLicense.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }

  const isExpired = () => {
    if (!displayLicense.expiryDate) return false
    return new Date(displayLicense.expiryDate) < new Date()
  }

  const currentAssignments = assignments.filter((assignment) => assignment.status === "active")
  const assignmentHistory = assignments.filter((assignment) => assignment.status === "revoked")

  const getAssignmentStatusBadge = (status: LicenseAssignment["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      revoked: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge variant="secondary" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            License Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading license details...</div>
          </div>
        ) : (
        <div className="space-y-6">
          {/* License Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">License Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm font-medium">{displayLicense.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                      <p className="text-sm">{displayLicense.vendor}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Version</label>
                      <p className="text-sm">{displayLicense.version || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="mt-1">{getTypeBadge(displayLicense.type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(displayLicense.status)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Usage & Cost</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">License Usage</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {displayLicense.currentUsers}/{displayLicense.maxUsers} users
                        </span>
                        <span className="text-muted-foreground">{getUsagePercentage()}%</span>
                      </div>
                      <Progress value={getUsagePercentage()} className="h-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Cost</label>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(displayLicense.cost)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                      <p
                        className={`text-sm flex items-center gap-1 ${
                          isExpired() ? "text-red-600 font-medium" : isExpiringSoon() ? "text-yellow-600" : ""
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {displayLicense.expiryDate ? formatDate(displayLicense.expiryDate) : "No expiry"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Assignments */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Current Assignments ({currentAssignments.length})
            </h3>
            {currentAssignments.length > 0 ? (
              <div className="grid gap-3">
                {currentAssignments.map((assignment) => {
                  // Employee data is included in the assignment from backend
                  const employee = assignment.employee
                  if (!employee) return null

                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {employee.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Assigned: {formatDate(assignment.assignedDate)}
                          </div>
                          {getAssignmentStatusBadge(assignment.status)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnassign(assignment)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No current assignments</p>
            )}
          </div>

          <Separator />

          {/* Assignment History */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Assignment History ({assignmentHistory.length})
            </h3>
            {assignmentHistory.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {assignmentHistory.map((assignment) => {
                  // Employee data is included in the assignment from backend
                  const employee = assignment.employee
                  if (!employee) return null

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{employee.department}</span>
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(assignment.assignedDate)} -{" "}
                          {assignment.revokedDate ? formatDate(assignment.revokedDate) : "Present"}
                        </div>
                        {getAssignmentStatusBadge(assignment.status)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No assignment history</p>
            )}
          </div>
        </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
