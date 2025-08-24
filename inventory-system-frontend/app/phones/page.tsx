"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { PhoneTable } from "@/components/phones/phone-table"
import { PhoneContractDialog } from "@/components/phones/phone-contract-dialog"
import { PhoneContractBulkUpload } from "@/components/phones/phone-contract-bulk-upload"
import { PhoneFilters } from "@/components/phones/phone-filters"
import { EmployeePool } from "@/components/employees/employee-pool"
import { phoneContractService } from "@/lib/data-service"
import type { PhoneContract, PhoneContractFilters as PhoneFiltersType } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function PhonesPage() {
  const [contracts, setContracts] = useState<PhoneContract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<PhoneContract[]>([])
  const [filters, setFilters] = useState<PhoneFiltersType>({})
  const [selectedContract, setSelectedContract] = useState<PhoneContract | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadContracts()
  }, [])

  useEffect(() => {
    const loadFiltered = async () => {
      const filtered = await phoneContractService.getAll(filters)
      setFilteredContracts(filtered || [])
    }
    loadFiltered()
  }, [contracts, filters])

  const loadContracts = async () => {
    const allContracts = await phoneContractService.getAll()
    setContracts(allContracts || [])
  }

  const handleAddContract = () => {
    setSelectedContract(undefined)
    setIsFormOpen(true)
  }

  const handleEditContract = (contract: PhoneContract) => {
    setSelectedContract(contract)
    setIsFormOpen(true)
  }

  const handleDeleteContract = async (contractId: string) => {
    if (confirm("Are you sure you want to delete this phone contract?")) {
      try {
        await phoneContractService.delete(contractId)
        await loadContracts()
        toast({
          title: "Contract deleted",
          description: "The phone contract has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "An error occurred while deleting the phone contract.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFormSubmit = async (contractData: Omit<PhoneContract, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (selectedContract) {
        // Update existing contract
        const updated = await phoneContractService.update(selectedContract.id, contractData)
        if (updated) {
          await loadContracts()
          setIsFormOpen(false)
          toast({
            title: "Contract updated",
            description: "The phone contract has been successfully updated.",
          })
        }
      } else {
        // Create new contract
        await phoneContractService.create(contractData)
        await loadContracts()
        setIsFormOpen(false)
        toast({
          title: "Contract added",
          description: "The new phone contract has been successfully added.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the phone contract.",
        variant: "destructive",
      })
    }
  }

  const handleBulkUploadComplete = () => {
    loadContracts()
    setIsBulkUploadOpen(false)
    toast({
      title: "Bulk upload completed",
      description: "Phone contracts have been successfully uploaded.",
    })
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
                  <h1 className="text-3xl font-bold">Phone Contract Management</h1>
                  <p className="text-muted-foreground">Manage your organization's phone contracts</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Upload
                  </Button>
                  <Button onClick={handleAddContract} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Contract
                  </Button>
                </div>
              </div>
              
              <PhoneFilters filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Phone Contracts ({filteredContracts.length})</h2>
                    <p className="text-sm text-muted-foreground">
                      Drag employees from the pool to assign them to available contracts
                    </p>
                  </div>
                  <PhoneTable
                    contracts={filteredContracts}
                    onEdit={handleEditContract}
                    onDelete={handleDeleteContract}
                    onAssignmentUpdate={loadContracts}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <PhoneContractDialog 
          contract={selectedContract}
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          onSubmit={handleFormSubmit}
        />

        <PhoneContractBulkUpload 
          open={isBulkUploadOpen}
          onSuccess={handleBulkUploadComplete}
          onOpenChange={setIsBulkUploadOpen}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}