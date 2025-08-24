"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Users } from "lucide-react"
import { employeeService } from "@/lib/data-service"
import type { Employee } from "@/lib/types"

interface EmployeePoolProps {
  onDragStart?: (employee: Employee) => void
  onDragEnd?: () => void
}

export function EmployeePool({ onDragStart, onDragEnd }: EmployeePoolProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])

  useEffect(() => {
    const loadEmployees = async () => {
      const allEmployees = await employeeService.getAll()
      setEmployees(allEmployees || [])
    }
    loadEmployees()
  }, [])

  useEffect(() => {
    const filtered = employees.filter((employee) => {
      if (!employee) return false

      const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase()
      const email = (employee.email || "").toLowerCase()
      const department = (employee.department || "").toLowerCase()
      const searchLower = searchTerm.toLowerCase()

      return fullName.includes(searchLower) || email.includes(searchLower) || department.includes(searchLower)
    })
    setFilteredEmployees(filtered)
  }, [employees, searchTerm])

  const handleDragStart = (e: React.DragEvent, employee: Employee) => {
    e.dataTransfer.setData("application/json", JSON.stringify(employee))
    e.dataTransfer.effectAllowed = "copy"
    onDragStart?.(employee)
  }

  const handleDragEnd = () => {
    onDragEnd?.()
  }

  return (
    <Card className="h-full flex flex-col border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          Employee Pool
        </CardTitle>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
        {filteredEmployees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No employees found</p>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              draggable
              onDragStart={(e) => handleDragStart(e, employee)}
              onDragEnd={handleDragEnd}
              className="p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:shadow-sm transition-all active:cursor-grabbing active:shadow-md active:border-blue-400"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{employee.email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                      {employee.department}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-600">
                      {employee.position}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </CardContent>
    </Card>
  )
}
