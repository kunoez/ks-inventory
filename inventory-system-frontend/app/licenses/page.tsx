"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { LicenseTable } from "@/components/licenses/license-table"
import { LicenseForm } from "@/components/licenses/license-form"
import { LicenseFilters } from "@/components/licenses/license-filters"
import { AssignmentDialog } from "@/components/assignments/assignment-dialog"
import { EmployeePool } from "@/components/employees/employee-pool"
import { licenseService, assignmentService } from "@/lib/data-service"
import type { License, LicenseFilters as LicenseFiltersType, LicenseAssignment } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { LicenseDetailsDialog } from "@/components/licenses/license-details-dialog"
import { LicenseBulkUpload } from "@/components/licenses/license-bulk-upload"

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([])
  const [filters, setFilters] = useState<LicenseFiltersType>({})
  const [selectedLicense, setSelectedLicense] = useState<License | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [assignmentLicense, setAssignmentLicense] = useState<License | undefined>()
  const [detailsLicense, setDetailsLicense] = useState<License | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLicenses()
  }, [])

  useEffect(() => {
    const loadFiltered = async () => {
      const filtered = await licenseService.getAll(filters)
      setFilteredLicenses(filtered || [])
    }
    loadFiltered()
  }, [licenses, filters])

  const loadLicenses = async () => {
    try {
      // Backend now calculates currentUsers based on actual assignments
      const allLicenses = await licenseService.getAll()
      setLicenses(allLicenses || [])
    } catch (error) {
      console.error('Error loading licenses:', error)
      setLicenses([])
    }
  }

  const handleAddLicense = () => {
    setSelectedLicense(undefined)
    setIsFormOpen(true)
  }

  const handleEditLicense = (license: License) => {
    setSelectedLicense(license)
    setIsFormOpen(true)
  }

  const handleDeleteLicense = async (licenseId: string) => {
    if (confirm("Are you sure you want to delete this license?")) {
      try {
        await licenseService.delete(licenseId)
        await loadLicenses()
        toast({
          title: "License deleted",
          description: "The license has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while deleting the license.",
          variant: "destructive",
        })
      }
    }
  }

  const handleViewLicense = (license: License) => {
    setDetailsLicense(license)
    setIsDetailsOpen(true)
  }

  const handleAssignLicense = (license: License) => {
    setAssignmentLicense(license)
    setIsAssignmentOpen(true)
  }

  const handleAssignmentComplete = () => {
    loadLicenses()
    toast({
      title: "License assigned",
      description: "The license has been successfully assigned.",
    })
  }

  const handleFormSubmit = async (licenseData: Omit<License, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (selectedLicense) {
        // Update existing license
        const updated = await licenseService.update(selectedLicense.id, licenseData)
        if (updated) {
          await loadLicenses()
          setIsFormOpen(false)
          toast({
            title: "License updated",
            description: "The license has been successfully updated.",
          })
        }
      } else {
        // Create new license
        await licenseService.create(licenseData)
        await loadLicenses()
        setIsFormOpen(false)
        toast({
          title: "License added",
          description: "The new license has been successfully added.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the license.",
        variant: "destructive",
      })
    }
  }

  const handleBulkUploadComplete = () => {
    loadLicenses()
    setIsBulkUploadOpen(false)
  }

  return (
    <ProtectedRoute requiredRole="user">
      <AppLayout>
        <div className="flex gap-6 h-[calc(100vh-8rem)] overflow-hidden">
          <div className="w-80 flex-shrink-0 h-full">
            <EmployeePool />
          </div>

          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Fixed Header */}
            <div className="flex-shrink-0 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">License Management</h1>
                  <p className="text-muted-foreground">Manage your organization's software licenses</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Upload
                  </Button>
                  <Button onClick={handleAddLicense} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add License
                  </Button>
                </div>
              </div>

              <LicenseFilters filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Licenses ({filteredLicenses.length})</h2>
                    <p className="text-sm text-muted-foreground">
                      Drag employees from the pool to assign them to available licenses
                    </p>
                  </div>
                  <LicenseTable
                    licenses={filteredLicenses}
                    onEdit={handleEditLicense}
                    onDelete={handleDeleteLicense}
                    onView={handleViewLicense}
                    onAssign={handleAssignLicense}
                    onAssignmentUpdate={loadLicenses}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <LicenseForm
          license={selectedLicense}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
        />

        <AssignmentDialog
          type="license"
          item={assignmentLicense}
          open={isAssignmentOpen}
          onOpenChange={setIsAssignmentOpen}
          onAssign={handleAssignmentComplete}
        />

        <LicenseDetailsDialog license={detailsLicense} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} onUpdate={loadLicenses} />

        <LicenseBulkUpload
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          onUploadComplete={handleBulkUploadComplete}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
