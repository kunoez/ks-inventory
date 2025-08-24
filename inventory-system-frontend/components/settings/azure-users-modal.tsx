"use client"

import { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import apiClient from "@/lib/api-client"
import { Users, UserPlus, Search, Loader2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"

interface AzureManager {
  id: string
  displayName: string
  mail: string
}

interface AzureUser {
  id: string
  displayName: string
  firstName: string
  lastName: string
  email: string
  userPrincipalName: string
  department: string
  jobTitle: string
  officeLocation?: string
  mobilePhone?: string
  manager?: AzureManager
}

interface AzureUsersModalProps {
  tenantId?: string
  clientId?: string
  clientSecret?: string
  companyId: string
  companies: any[]
  useEnvironmentConfig?: boolean
  onClose?: () => void
}

function AzureUsersModal({
  tenantId,
  clientId,
  clientSecret,
  companyId,
  companies,
  useEnvironmentConfig = false,
  onClose,
}: AzureUsersModalProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AzureUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [syncingUsers, setSyncingUsers] = useState<Set<string>>(new Set())
  const [syncedUsers, setSyncedUsers] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const { toast } = useToast()

  const selectedCompany = companies.find((c) => c.id === companyId)

  useEffect(() => {
    fetchAzureUsers()
  }, [])

  const fetchAzureUsers = async () => {
    try {
      setLoading(true)
      
      console.log('=== Azure AD User Fetch (Frontend) ===');
      console.log('Using environment config:', useEnvironmentConfig);
      
      const credentials = useEnvironmentConfig 
        ? {} // Use environment config
        : { tenantId, clientId, clientSecret }; // Use provided credentials
      
      if (!useEnvironmentConfig) {
        console.log('Credentials provided:', {
          tenantId: tenantId ? tenantId.substring(0, 8) + '...' : 'NOT SET',
          clientId: clientId ? clientId.substring(0, 8) + '...' : 'NOT SET',
          clientSecret: clientSecret ? '***SET***' : 'NOT SET'
        });
      }
      
      console.log('Calling API to fetch Azure users...');
      const response = await apiClient.fetchAzureUsers(credentials);
      
      console.log('API Response received:');
      console.log('- Type:', typeof response);
      console.log('- Is Array:', Array.isArray(response));
      console.log('- User count:', response?.length || 0);
      
      if (response && response.length > 0) {
        console.log('Sample user (first):', response[0]);
      }
      
      setUsers(response)
      console.log('=== Azure AD User Fetch Complete ===');
    } catch (error: any) {
      console.error('=== Azure AD User Fetch Error (Frontend) ===');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
        console.error('Response Headers:', error.response.headers);
      }
      
      if (error.request) {
        console.error('Request was made but no response received');
        console.error('Request:', error.request);
      }
      
      console.error('Full error object:', error);
      
      toast({
        title: "Failed to Fetch Users",
        description: error.response?.data?.message || "Unable to connect to Azure AD. Please check your credentials.",
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    const currentPageUserIds = paginatedUsers.map((u) => u.id)
    const allSelected = currentPageUserIds.every((id) => selectedUsers.has(id))
    
    if (allSelected) {
      // Deselect all on current page
      setSelectedUsers((prev) => {
        const newSet = new Set(prev)
        currentPageUserIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      // Select all on current page
      setSelectedUsers((prev) => {
        const newSet = new Set(prev)
        currentPageUserIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSyncUser = async (user: AzureUser) => {
    setSyncingUsers((prev) => new Set(prev).add(user.id))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[user.id]
      return newErrors
    })

    try {
      await apiClient.syncAzureEmployee({
        companyId,
        azureUserId: user.id,
        firstName: user.firstName || user.displayName.split(" ")[0] || "",
        lastName: user.lastName || user.displayName.split(" ").slice(1).join(" ") || "",
        email: user.email,
        department: user.department || "General",
        position: user.jobTitle || "Employee",
        employeeId: user.userPrincipalName,
        officeLocation: user.officeLocation,
        mobilePhone: user.mobilePhone,
      })

      setSyncedUsers((prev) => new Set(prev).add(user.id))
      toast({
        title: "Employee Added",
        description: `${user.displayName} has been added successfully.`,
      })
    } catch (error: any) {
      console.error(`Error syncing user ${user.id}:`, error)
      const errorMessage = error.response?.data?.message || "Failed to add employee"
      setErrors((prev) => ({ ...prev, [user.id]: errorMessage }))
      
      if (!errorMessage.includes("already exists")) {
        toast({
          title: "Sync Failed",
          description: `Failed to add ${user.displayName}: ${errorMessage}`,
          variant: "destructive",
        })
      }
    } finally {
      setSyncingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(user.id)
        return newSet
      })
    }
  }

  const handleSyncSelected = async () => {
    const usersToSync = users.filter((u) => selectedUsers.has(u.id))
    
    for (const user of usersToSync) {
      await handleSyncUser(user)
    }
    
    // Clear selection after syncing
    setSelectedUsers(new Set())
  }

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.displayName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.jobTitle?.toLowerCase().includes(query) ||
      user.manager?.displayName?.toLowerCase().includes(query) ||
      user.manager?.mail?.toLowerCase().includes(query)
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      onClose?.()
    }, 200)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] h-[90vh] flex flex-col p-0">
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Azure AD Users
            </DialogTitle>
            <DialogDescription>
              {loading ? (
                "Fetching users from Azure Active Directory..."
              ) : (
                <>
                  Found {users.length} users{filteredUsers.length < users.length && 
                    ` (showing ${filteredUsers.length} filtered)`}. 
                  {filteredUsers.length > itemsPerPage && (
                    <span className="ml-1">
                      Page {currentPage} of {totalPages} ({startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length})
                    </span>
                  )}
                  {" "}Select users to add as employees to{" "}
                  <span className="font-semibold">{selectedCompany?.name}</span>.
                  {useEnvironmentConfig && (
                    <span className="ml-2 text-xs text-green-600">
                      (Using configured Azure AD credentials)
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!loading && users.length > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name, email, department, job title, or supervisor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {paginatedUsers.every((u) => selectedUsers.has(u.id)) ? "Deselect Page" : "Select Page"}
                </Button>
                {selectedUsers.size > 0 && (
                  <>
                    <Badge variant="secondary">{selectedUsers.size} selected</Badge>
                    <Button
                      size="sm"
                      onClick={handleSyncSelected}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Selected
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-auto px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found or unable to connect to Azure AD.</p>
              <p className="text-sm mt-2">Please check your credentials and try again.</p>
            </div>
          ) : (
            <div className="w-full">
              <Table className="min-w-[1400px]">
                <TableHeader className="sticky top-0 bg-background z-20">
                  <TableRow>
                    <TableHead className="w-12 sticky left-0 bg-background z-30">
                      <Checkbox
                        checked={paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUsers.has(u.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px]">Name</TableHead>
                    <TableHead className="min-w-[250px]">Email</TableHead>
                    <TableHead className="min-w-[150px]">Department</TableHead>
                    <TableHead className="min-w-[180px]">Job Title</TableHead>
                    <TableHead className="min-w-[200px]">Supervisor</TableHead>
                    <TableHead className="min-w-[150px]">Office</TableHead>
                    <TableHead className="min-w-[180px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedUsers.map((user) => {
                  const isSyncing = syncingUsers.has(user.id)
                  const isSynced = syncedUsers.has(user.id)
                  const hasError = !!errors[user.id]
                  
                  return (
                    <TableRow key={user.id} className={isSynced ? "bg-green-50" : ""}>
                      <TableCell className="sticky left-0 bg-background z-10">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                          disabled={isSyncing || isSynced}
                        />
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {user.displayName}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="max-w-[240px] truncate" title={user.email || user.userPrincipalName}>
                          {user.email || user.userPrincipalName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.department && (
                          <Badge variant="outline" className="whitespace-nowrap">{user.department}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {user.jobTitle || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.manager ? (
                          <div className="max-w-[190px]">
                            <div className="font-medium truncate" title={user.manager.displayName}>
                              {user.manager.displayName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate" title={user.manager.mail}>
                              {user.manager.mail}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {user.officeLocation || "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {isSynced ? (
                          <div className="flex items-center justify-end gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Added</span>
                          </div>
                        ) : hasError ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-red-600">{errors[user.id]}</span>
                            {!errors[user.id].includes("already exists") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSyncUser(user)}
                                disabled={isSyncing}
                              >
                                Retry
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSyncUser(user)}
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add as Employee
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t">
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {syncedUsers.size > 0 && (
                  <span className="text-sm text-green-600">
                    {syncedUsers.size} employee{syncedUsers.size !== 1 ? "s" : ""} added successfully
                  </span>
                )}
                {filteredUsers.length > itemsPerPage && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Function to open the modal programmatically
export function openAzureUsersModal(props: Omit<AzureUsersModalProps, "onClose">) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)

  const handleClose = () => {
    root.unmount()
    document.body.removeChild(container)
  }

  root.render(<AzureUsersModal {...props} onClose={handleClose} />)
}