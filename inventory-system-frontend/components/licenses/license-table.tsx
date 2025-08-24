"use client"
import { useState } from "react"
import type React from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, UserPlus, AlertTriangle } from "lucide-react"
import type { License, Employee } from "@/lib/types"
import { assignmentService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"

interface LicenseTableProps {
  licenses: License[]
  onEdit: (license: License) => void
  onDelete: (licenseId: string) => void
  onView: (license: License) => void
  onAssign: (license: License) => void
  onAssignmentUpdate?: () => void
}

export function LicenseTable({ licenses, onEdit, onDelete, onView, onAssign, onAssignmentUpdate }: LicenseTableProps) {
  const [dragOverRow, setDragOverRow] = useState<string | null>(null)
  const { toast } = useToast()

  const getStatusBadge = (status: License["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      suspended: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge variant="secondary" className={variants[status]}>
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
    return new Date(dateString).toLocaleDateString()
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const getUsagePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const canAssignLicense = (license: License) => {
    return license.currentUsers < license.maxUsers && license.status === "active"
  }

  const handleDragOver = (e: React.DragEvent, license: License) => {
    e.preventDefault()
    
    if (!canAssignLicense(license)) {
      e.dataTransfer.dropEffect = "none"
      return
    }

    e.dataTransfer.dropEffect = "copy"
    setDragOverRow(license.id)
  }

  const handleDragLeave = () => {
    setDragOverRow(null)
  }

  const handleDrop = async (e: React.DragEvent, license: License) => {
    e.preventDefault()
    setDragOverRow(null)

    if (!canAssignLicense(license)) {
      toast({
        title: "Assignment Failed",
        description: "This license has no available seats or is not active.",
        variant: "destructive",
      })
      return
    }

    try {
      const employeeData = JSON.parse(e.dataTransfer.getData("application/json")) as Employee

      // Create assignment
      const success = await assignmentService.assignLicense(license.id, employeeData.id)

      if (success) {
        onAssignmentUpdate?.()
        toast({
          title: "License Assigned",
          description: `${license.name} has been assigned to ${employeeData.firstName} ${employeeData.lastName}.`,
        })
      } else {
        toast({
          title: "Assignment Failed",
          description: "Failed to assign the license. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: "Invalid employee data. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => {
            const usagePercentage = getUsagePercentage(license.currentUsers, license.maxUsers)
            const expiringSoon = isExpiringSoon(license.expiryDate)
            const expired = isExpired(license.expiryDate)
            const canAssign = canAssignLicense(license)

            return (
              <TableRow
                key={license.id}
                className={`
                  ${canAssign ? "cursor-pointer" : ""}
                  ${dragOverRow === license.id ? "bg-blue-50 border-blue-200" : ""}
                  ${canAssign ? "hover:bg-gray-50" : ""}
                `}
                onDragOver={(e) => handleDragOver(e, license)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, license)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">{license.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {license.vendor} {license.version && `v${license.version}`}
                      </div>
                    </div>
                    {(expiringSoon || expired) && (
                      <AlertTriangle className={`h-4 w-4 ${expired ? "text-red-500" : "text-yellow-500"}`} />
                    )}
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(license.type)}</TableCell>
                <TableCell>{getStatusBadge(license.status)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {license.currentUsers}/{license.maxUsers} users
                      </span>
                      <span className="text-muted-foreground">{usagePercentage}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>
                  {license.expiryDate ? (
                    <span className={expired ? "text-red-600 font-medium" : expiringSoon ? "text-yellow-600" : ""}>
                      {formatDate(license.expiryDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No expiry</span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(license.cost)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(license)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(license)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {canAssign && (
                        <DropdownMenuItem onClick={() => onAssign(license)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign License
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(license.id)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {licenses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No licenses found matching your criteria.</div>
      )}
    </div>
  )
}
