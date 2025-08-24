"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PhoneContractForm } from "./phone-contract-form"
import type { PhoneContract } from "@/lib/types"

interface PhoneContractDialogProps {
  contract?: PhoneContract
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (contractData: Omit<PhoneContract, "id" | "createdAt" | "updatedAt">) => void
}

export function PhoneContractDialog({ contract, open, onOpenChange, onSubmit }: PhoneContractDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (contractData: {
    phoneNumber: string
    carrier: string
    plan: string
    monthlyFee: string
    contractStartDate: string
    contractEndDate: string
    dataLimit?: string
    minutes?: string
    sms?: string
    pin: string
    puk: string
    notes: string
  }) => {
    setIsSubmitting(true)

    try {
      onSubmit({
        phoneNumber: contractData.phoneNumber,
        carrier: contractData.carrier,
        plan: contractData.plan,
        monthlyFee: Number.parseFloat(contractData.monthlyFee),
        contractStartDate: contractData.contractStartDate,
        contractEndDate: contractData.contractEndDate || undefined,
        dataLimit: contractData.dataLimit,
        minutes: contractData.minutes,
        sms: contractData.sms,
        pin: contractData.pin,
        puk: contractData.puk,
        status: contract?.status || "active",
        notes: contractData.notes || undefined,
      })
      // Don't close dialog here - let parent handle it after successful save
    } catch (error) {
      console.error("Failed to save phone contract:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit Phone Contract" : "Add Phone Contract"}</DialogTitle>
          <DialogDescription>
            {contract ? "Update the phone contract details." : "Create a new phone contract with carrier details and security information."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <PhoneContractForm 
            contract={contract} 
            onSubmit={handleSubmit} 
            onCancel={handleCancel} 
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
