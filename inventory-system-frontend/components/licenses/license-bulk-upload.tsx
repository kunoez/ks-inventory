"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, AlertTriangle, CheckCircle, Download } from "lucide-react"
import type { License, LicenseType, LicenseStatus, Company } from "@/lib/types"
import { licenseService, dataService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LicenseBulkUploadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

interface LicenseRow {
  name: string
  type: LicenseType
  vendor: string
  version?: string
  licenseKey?: string
  purchaseDate: string
  expiryDate?: string
  cost: number
  maxUsers: number
  status: LicenseStatus
  notes?: string
  errors: string[]
  isValid: boolean
}

export function LicenseBulkUpload({ open, onOpenChange, onUploadComplete }: LicenseBulkUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [licenses, setLicenses] = useState<LicenseRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "complete">("upload")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [companies, setCompanies] = useState<Company[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const validLicenseTypes: LicenseType[] = ["software", "subscription", "perpetual", "volume", "oem"]
  const validLicenseStatuses: LicenseStatus[] = ["active", "expired", "suspended", "cancelled"]

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
    const csvContent = [
      "name,type,vendor,version,licenseKey,purchaseDate,expiryDate,cost,maxUsers,status,notes",
      "Microsoft Office 365,subscription,Microsoft,2023,,2024-01-15,2025-01-15,1200.00,50,active,Business Premium license",
      "Adobe Creative Suite,software,Adobe,2023,XXXX-XXXX-XXXX,2024-02-01,2025-02-01,2400.00,25,active,Design team license",
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "license_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const validateLicenseRow = (row: any, index: number): LicenseRow => {
    const errors: string[] = []

    // Required fields validation
    if (!row.name?.trim()) errors.push("Name is required")
    if (!row.vendor?.trim()) errors.push("Vendor is required")
    if (!row.purchaseDate?.trim()) errors.push("Purchase date is required")

    // Type validation
    if (!row.type || !validLicenseTypes.includes(row.type.toLowerCase())) {
      errors.push(`Type must be one of: ${validLicenseTypes.join(", ")}`)
    }

    // Status validation
    if (!row.status || !validLicenseStatuses.includes(row.status.toLowerCase())) {
      errors.push(`Status must be one of: ${validLicenseStatuses.join(", ")}`)
    }

    // Date validation
    if (row.purchaseDate && isNaN(Date.parse(row.purchaseDate))) {
      errors.push("Invalid purchase date format")
    }

    if (row.expiryDate && isNaN(Date.parse(row.expiryDate))) {
      errors.push("Invalid expiry date format")
    }

    // Numeric validation
    const cost = Number.parseFloat(row.cost)
    if (isNaN(cost) || cost < 0) {
      errors.push("Cost must be a valid positive number")
    }

    const maxUsers = Number.parseInt(row.maxUsers)
    if (isNaN(maxUsers) || maxUsers < 1) {
      errors.push("Max users must be a valid positive integer")
    }

    return {
      name: row.name?.trim() || "",
      type: (row.type?.toLowerCase() || "subscription") as LicenseType,
      vendor: row.vendor?.trim() || "",
      version: row.version?.trim() || undefined,
      licenseKey: row.licenseKey?.trim() || undefined,
      purchaseDate: row.purchaseDate?.trim() || "",
      expiryDate: row.expiryDate?.trim() || undefined,
      cost: cost || 0,
      maxUsers: maxUsers || 1,
      status: (row.status?.toLowerCase() || "active") as LicenseStatus,
      notes: row.notes?.trim() || undefined,
      errors,
      isValid: errors.length === 0,
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const rows = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}

      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })

      rows.push(row)
    }

    return rows
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)

    try {
      const text = await selectedFile.text()
      const rawData = parseCSV(text)

      const validatedLicenses = rawData.map((row, index) => validateLicenseRow(row, index))

      setLicenses(validatedLicenses)
      setStep("preview")
    } catch (error) {
      toast({
        title: "File Processing Error",
        description: "Failed to process the uploaded file. Please check the format.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkUpload = async () => {
    const validLicenses = licenses.filter((license) => license.isValid)

    if (validLicenses.length === 0) {
      toast({
        title: "No Valid Licenses",
        description: "Please fix the errors before uploading.",
        variant: "destructive",
      })
      return
    }

    const companyId = selectedCompanyId || user?.companyId
    if (!companyId) {
      toast({
        title: "Error",
        description: "Please select a company for these licenses.",
        variant: "destructive",
      })
      return
    }

    setStep("processing")
    setUploadProgress(0)

    try {
      for (let i = 0; i < validLicenses.length; i++) {
        const license = validLicenses[i]

        const licenseData: Omit<License, "id" | "createdAt" | "updatedAt"> = {
          companyId: companyId, // Use selected company or user's default company
          name: license.name,
          type: license.type,
          vendor: license.vendor,
          version: license.version,
          licenseKey: license.licenseKey,
          purchaseDate: license.purchaseDate,
          expiryDate: license.expiryDate,
          cost: license.cost,
          maxUsers: license.maxUsers,
          currentUsers: 0,
          status: license.status,
          notes: license.notes,
        }

        await licenseService.create(licenseData)
        setUploadProgress(Math.round(((i + 1) / validLicenses.length) * 100))

        // Small delay to show progress
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setStep("complete")
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${validLicenses.length} licenses.`,
      })

      onUploadComplete()
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "An error occurred during the upload process.",
        variant: "destructive",
      })
      setStep("preview")
    }
  }

  const resetUpload = () => {
    setFile(null)
    setLicenses([])
    setStep("upload")
    setUploadProgress(0)
    setSelectedCompanyId(user?.companyId || "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validCount = licenses.filter((l) => l.isValid).length
  const errorCount = licenses.length - validCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk License Upload
          </DialogTitle>
          <DialogDescription>
            Upload multiple licenses from a CSV file. Download the template to get started.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            {companies.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="company-select">Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger id="company-select">
                    <SelectValue placeholder="Choose a company for these licenses" />
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
                  All uploaded licenses will be associated with this company
                </p>
              </div>
            )}

            <div className="text-center">
              <Button variant="outline" onClick={downloadTemplate} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download CSV Template
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Use this template to format your license data correctly
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={isProcessing}
              />
              <p className="text-sm text-muted-foreground">Supported formats: CSV files with comma-separated values</p>
            </div>

            {isProcessing && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Processing file...</p>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {validCount} Valid
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errorCount} Errors
                  </Badge>
                )}
              </div>
              <Button variant="outline" onClick={resetUpload}>
                Upload Different File
              </Button>
            </div>

            {errorCount > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some licenses have validation errors. Fix the errors or they will be skipped during upload.
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Max Users</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license, index) => (
                    <TableRow key={index} className={license.isValid ? "" : "bg-red-50"}>
                      <TableCell>
                        {license.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{license.name}</TableCell>
                      <TableCell>{license.vendor}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{license.type}</Badge>
                      </TableCell>
                      <TableCell>${license.cost.toFixed(2)}</TableCell>
                      <TableCell>{license.maxUsers}</TableCell>
                      <TableCell>
                        {license.errors.length > 0 && (
                          <div className="text-sm text-red-600">{license.errors.join(", ")}</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <div className="text-lg font-medium">Uploading Licenses...</div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload Complete!</h3>
              <p className="text-muted-foreground">Successfully uploaded {validCount} licenses to your inventory.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={resetUpload}>
                Back
              </Button>
              <Button onClick={handleBulkUpload} disabled={validCount === 0}>
                Upload {validCount} Licenses
              </Button>
            </>
          )}

          {step === "complete" && (
            <Button
              onClick={() => {
                resetUpload()
                onOpenChange(false)
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
