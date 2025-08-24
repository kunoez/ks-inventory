"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, Phone, Eye, UserMinus, Edit, Trash2 } from "lucide-react"
import type { PhoneContract, PhoneAssignment, Employee } from "@/lib/types"
import { phoneContractService, assignmentService, employeeService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"

interface PhoneTableProps {
  contracts: PhoneContract[]
  onEdit: (contract: PhoneContract) => void
  onDelete: (contractId: string) => void
  onAssignmentUpdate?: () => void
}

export function PhoneTable({ contracts, onEdit, onDelete, onAssignmentUpdate }: PhoneTableProps) {
  const [selectedContract, setSelectedContract] = useState<PhoneContract | null>(null)
  const [dragOverRow, setDragOverRow] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<PhoneAssignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      const [assignmentsData, employeesData] = await Promise.all([
        assignmentService.getPhoneAssignments(),
        employeeService.getAll()
      ])
      setAssignments(assignmentsData || [])
      setEmployees(employeesData || [])
    }
    loadData()
  }, [contracts])

  const getAssignedEmployee = (contractId: string) => {
    const assignment = assignments.find((a) => a.phoneContractId === contractId && a.status === "active")
    if (!assignment) return null
    return employees.find((e) => e.id === assignment.employeeId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "expired":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleDragOver = (e: React.DragEvent, contract: PhoneContract) => {
    e.preventDefault()
    
    if (contract.status !== "active" || getAssignedEmployee(contract.id)) {
      e.dataTransfer.dropEffect = "none"
      return
    }

    e.dataTransfer.dropEffect = "copy"
    setDragOverRow(contract.id)
  }

  const handleDragLeave = () => {
    setDragOverRow(null)
  }

  const handleDrop = async (e: React.DragEvent, contract: PhoneContract) => {
    e.preventDefault()
    setDragOverRow(null)

    if (contract.status !== "active" || getAssignedEmployee(contract.id)) {
      toast({
        title: "Assignment Failed",
        description: "This phone contract is not available for assignment.",
        variant: "destructive",
      })
      return
    }

    try {
      const employeeData = JSON.parse(e.dataTransfer.getData("application/json")) as Employee

      // Create assignment
      const success = await assignmentService.assignPhoneContract(contract.id, employeeData.id)

      if (success) {
        onAssignmentUpdate?.()
        toast({
          title: "Phone Contract Assigned",
          description: `Phone ${contract.phoneNumber} has been assigned to ${employeeData.firstName} ${employeeData.lastName}.`,
        })
      } else {
        toast({
          title: "Assignment Failed",
          description: "Failed to assign the phone contract. Please try again.",
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

  const handleUnassign = async (contractId: string) => {
    const employee = getAssignedEmployee(contractId)
    if (!employee) return

    if (confirm(`Are you sure you want to unassign this phone contract from ${employee.firstName} ${employee.lastName}?`)) {
      const success = await assignmentService.unassignPhoneContract(contractId)
      if (success) {
        onAssignmentUpdate?.()
        toast({
          title: "Phone Contract Unassigned",
          description: "The phone contract has been unassigned successfully.",
        })
      } else {
        toast({
          title: "Unassign Failed",
          description: "Failed to unassign the phone contract. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Monthly Fee</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Contract End</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const assignedEmployee = getAssignedEmployee(contract.id)
            const isAvailable = contract.status === "active" && !assignedEmployee
            return (
              <TableRow
                key={contract.id}
                className={`
                  ${isAvailable ? "cursor-pointer hover:bg-gray-50" : "opacity-90"}
                  ${dragOverRow === contract.id ? "bg-blue-50 border-blue-200" : ""}
                `}
                onDragOver={(e) => handleDragOver(e, contract)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, contract)}
              >
                <TableCell className="font-medium">{contract.phoneNumber}</TableCell>
                <TableCell>{contract.carrier}</TableCell>
                <TableCell>{contract.plan}</TableCell>
                <TableCell>${contract.monthlyFee}/month</TableCell>
                <TableCell>
                  {assignedEmployee ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {assignedEmployee.firstName} {assignedEmployee.lastName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassign(contract.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(contract.status)}>{contract.status}</Badge>
                </TableCell>
                <TableCell>
                  {contract.contractEndDate ? new Date(contract.contractEndDate).toLocaleDateString() : "No end date"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedContract(contract)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(contract)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(contract.id)} className="text-red-600">
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

        {/* Contract Details Dialog */}
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Phone Contract Details</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contract Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Phone Number:</strong> {selectedContract.phoneNumber}
                    </div>
                    <div>
                      <strong>Carrier:</strong> {selectedContract.carrier}
                    </div>
                    <div>
                      <strong>Plan:</strong> {selectedContract.plan}
                    </div>
                    <div>
                      <strong>Monthly Fee:</strong> ${selectedContract.monthlyFee}
                    </div>
                    <div>
                      <strong>Data Limit:</strong> {selectedContract.dataLimit}
                    </div>
                    <div>
                      <strong>Minutes:</strong> {selectedContract.minutes}
                    </div>
                    <div>
                      <strong>SMS:</strong> {selectedContract.sms}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Security Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>PIN:</strong> {selectedContract.pin}
                    </div>
                    <div>
                      <strong>PUK:</strong> {selectedContract.puk}
                    </div>
                    <div>
                      <strong>Contract Start:</strong>{" "}
                      {new Date(selectedContract.contractStartDate).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Contract End:</strong>{" "}
                      {selectedContract.contractEndDate
                        ? new Date(selectedContract.contractEndDate).toLocaleDateString()
                        : "No end date"}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <Badge className={`ml-2 ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {selectedContract.notes && (
                  <div className="col-span-2">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedContract.notes}</p>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
