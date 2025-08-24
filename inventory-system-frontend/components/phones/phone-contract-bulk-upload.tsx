"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from "lucide-react"
import { toast } from "sonner"
import type { PhoneContract, ContractStatus, Company } from "@/lib/types"
import { dataService } from "@/lib/data-service"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BulkUploadData {
  phoneNumber: string
  carrier: string
  plan: string
  monthlyFee: string
  contractStartDate: string
  contractEndDate?: string
  pin: string
  puk: string
  status: string
  dataLimit?: string
  minutes?: string
  sms?: string
  notes?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

const contractStatuses: ContractStatus[] = ["active", "suspended", "cancelled", "expired"]

interface PhoneContractBulkUploadProps {
  open?: boolean
  onSuccess: () => void
  onOpenChange: (open: boolean) => void
}

export function PhoneContractBulkUpload({ open = false, onSuccess, onOpenChange }: PhoneContractBulkUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<BulkUploadData[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState<"upload" | "preview" | "processing">("upload")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [companies, setCompanies] = useState<Company[]>([])
  const { user } = useAuth()

  // Load companies when dialog opens
  useEffect(() => {
    if (open) {
      const loadCompanies = async () => {
        const data = await dataService.getCompanies()
        setCompanies(data)
        // Pre-select user's company if only one, or first company
        if (user?.companyId) {
          setSelectedCompanyId(user.companyId)
        } else if (data.length === 1) {
          setSelectedCompanyId(data[0].id)
        }
      }
      loadCompanies()
    }
  }, [open, user])

  const downloadTemplate = () => {
    const headers = [
      "phoneNumber",
      "carrier",
      "plan",
      "monthlyFee",
      "contractStartDate",
      "contractEndDate",
      "pin",
      "puk",
      "status",
      "dataLimit",
      "minutes",
      "sms",
      "notes",
    ]

    const sampleData = [
      "+491711234567,Vodafone,Red Business L,85.00,2024-01-15,2026-01-15,1234,12345678,active,Unlimited,Unlimited,Unlimited,Corporate plan",
      "+491621234567,Telekom,MagentaMobil L,75.00,2024-02-01,,5678,87654321,active,50GB,Unlimited,Unlimited,Standard business plan",
    ]

    const csvContent = [headers.join(","), ...sampleData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "phone_contracts_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!uploadedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file")
      return
    }

    setFile(uploadedFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(uploadedFile)
  }

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) {
      toast.error("CSV file must contain headers and at least one data row")
      return
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const requiredHeaders = [
      "phoneNumber",
      "carrier",
      "plan",
      "monthlyFee",
      "contractStartDate",
      "pin",
      "puk",
      "status",
    ]

    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      toast.error(`Missing required headers: ${missingHeaders.join(", ")}`)
      return
    }

    const parsedData: BulkUploadData[] = []
    const validationErrors: ValidationError[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      // Validate required fields
      requiredHeaders.forEach((field) => {
        if (!row[field]) {
          validationErrors.push({
            row: i,
            field,
            message: `${field} is required`,
          })
        }
      })

      // Validate phone number format
      if (row.phoneNumber && !/^\+?[\d\s\-$$$$]+$/.test(row.phoneNumber)) {
        validationErrors.push({
          row: i,
          field: "phoneNumber",
          message: "Invalid phone number format",
        })
      }

      // Validate monthly fee
      if (row.monthlyFee && (isNaN(Number.parseFloat(row.monthlyFee)) || Number.parseFloat(row.monthlyFee) < 0)) {
        validationErrors.push({
          row: i,
          field: "monthlyFee",
          message: "Monthly fee must be a valid positive number",
        })
      }

      // Validate status
      if (row.status && !contractStatuses.includes(row.status as ContractStatus)) {
        validationErrors.push({
          row: i,
          field: "status",
          message: `Status must be one of: ${contractStatuses.join(", ")}`,
        })
      }

      // Validate dates
      if (row.contractStartDate && isNaN(Date.parse(row.contractStartDate))) {
        validationErrors.push({
          row: i,
          field: "contractStartDate",
          message: "Invalid date format (use YYYY-MM-DD)",
        })
      }

      if (row.contractEndDate && row.contractEndDate !== "" && isNaN(Date.parse(row.contractEndDate))) {
        validationErrors.push({
          row: i,
          field: "contractEndDate",
          message: "Invalid date format (use YYYY-MM-DD)",
        })
      }

      // Validate PIN (should be 4 digits)
      if (row.pin && !/^\d{4}$/.test(row.pin)) {
        validationErrors.push({
          row: i,
          field: "pin",
          message: "PIN must be 4 digits",
        })
      }

      // Validate PUK (should be 8 digits)
      if (row.puk && !/^\d{8}$/.test(row.puk)) {
        validationErrors.push({
          row: i,
          field: "puk",
          message: "PUK must be 8 digits",
        })
      }

      parsedData.push(row)
    }

    setData(parsedData)
    setErrors(validationErrors)
    setStep("preview")
  }

  const processUpload = async () => {
    if (errors.length > 0) {
      toast.error("Please fix all validation errors before proceeding")
      return
    }

    const companyId = selectedCompanyId || user?.companyId
    if (!companyId) {
      toast.error("Please select a company for these phone contracts.")
      return
    }

    setIsProcessing(true)
    setStep("processing")
    setProgress(0)

    try {
      for (let i = 0; i < data.length; i++) {
        const row = data[i]

        const contract: Omit<PhoneContract, "id" | "createdAt" | "updatedAt"> = {
          companyId: companyId, // Use selected company or user's default company
          phoneNumber: row.phoneNumber,
          carrier: row.carrier,
          plan: row.plan,
          monthlyFee: Number.parseFloat(row.monthlyFee),
          contractStartDate: row.contractStartDate,
          contractEndDate: row.contractEndDate || undefined,
          pin: row.pin,
          puk: row.puk,
          status: row.status as ContractStatus,
          dataLimit: row.dataLimit || undefined,
          minutes: row.minutes || undefined,
          sms: row.sms || undefined,
          notes: row.notes || undefined,
        }

        dataService.createPhoneContract(contract)
        setProgress(((i + 1) / data.length) * 100)

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      toast.success(`Successfully imported ${data.length} phone contracts`)
      onSuccess()
      handleClose()
    } catch (error) {
      toast.error("Failed to import phone contracts")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setFile(null)
    setData([])
    setErrors([])
    setStep("upload")
    setProgress(0)
    setIsProcessing(false)
    setSelectedCompanyId(user?.companyId || "")
  }

  const getRowErrors = (rowIndex: number) => {
    return errors.filter((error) => error.row === rowIndex + 1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Phone Contracts</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            {companies.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="company-select">Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger id="company-select">
                    <SelectValue placeholder="Choose a company for these phone contracts" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  All uploaded phone contracts will be associated with this company
                </p>
              </div>
            )}

            <div className="text-center">
              <Button onClick={downloadTemplate} variant="outline" className="mb-4 bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
              <p className="text-sm text-gray-600 mb-4">
                Download the template, fill in your phone contract data, and upload the completed CSV file.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            {file && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  File selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview & Validation</h3>
              <div className="flex items-center gap-2">
                <Badge variant={errors.length > 0 ? "destructive" : "default"}>
                  {data.length} contracts, {errors.length} errors
                </Badge>
              </div>
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Found {errors.length} validation errors. Please fix them before proceeding.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left">Row</th>
                    <th className="px-2 py-2 text-left">Phone Number</th>
                    <th className="px-2 py-2 text-left">Carrier</th>
                    <th className="px-2 py-2 text-left">Plan</th>
                    <th className="px-2 py-2 text-left">Monthly Fee</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => {
                    const rowErrors = getRowErrors(index)
                    return (
                      <tr key={index} className={rowErrors.length > 0 ? "bg-red-50" : ""}>
                        <td className="px-2 py-2">{index + 1}</td>
                        <td className="px-2 py-2">{row.phoneNumber}</td>
                        <td className="px-2 py-2">{row.carrier}</td>
                        <td className="px-2 py-2">{row.plan}</td>
                        <td className="px-2 py-2">${row.monthlyFee}</td>
                        <td className="px-2 py-2">
                          <Badge
                            variant={
                              contractStatuses.includes(row.status as ContractStatus) ? "default" : "destructive"
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                        <td className="px-2 py-2">
                          {rowErrors.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 text-xs">
                                {rowErrors.length} error{rowErrors.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Validation Errors:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Row {error.row}, {error.field}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={processUpload} disabled={errors.length > 0} className="bg-blue-600 hover:bg-blue-700">
                Import {data.length} Contracts
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Importing Phone Contracts...</h3>
              <p className="text-gray-600">Please wait while we process your upload.</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
            </div>

            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
