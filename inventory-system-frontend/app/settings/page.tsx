"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { User, Bell, Shield, Database, Palette, Clock, Download, ExternalLink, Building2, Cloud } from "lucide-react"
import apiClient from "@/lib/api-client"

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [azureConfigured, setAzureConfigured] = useState(false)

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    loadCompanies()
    loadUserSettings()
    loadAzureConfig()
  }, [])

  // Profile settings state - parse the name field if firstName/lastName don't exist
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || user?.name?.split(' ')[0] || "",
    lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || "",
    email: user?.email || "",
    department: user?.department || "IT",
    phone: user?.phone || "",
    bio: user?.bio || "",
  })

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    deviceAlerts: true,
    licenseExpiry: true,
    assignmentUpdates: false,
    systemMaintenance: true,
    weeklyReports: false,
  })

  // System preferences state
  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    itemsPerPage: "25",
    defaultView: "table",
  })

  // Security settings state with Azure AD specific fields
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginNotifications: true,
    azureSSOEnabled: false,
    azureTenantId: "",
    azureClientId: "",
    azureClientSecret: "",
    azureRedirectUri: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    azureAutoProvisioning: true,
    azureRequireForAllUsers: false,
    azureSyncGroups: true,
    azureGroupMapping: {
      "IT-Admins": "admin",
      "IT-Managers": "manager",
      "IT-Users": "user",
    },
  })

  const [companies, setCompanies] = useState<any[]>([])
  const [newCompany, setNewCompany] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
  })
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])

  const loadUserSettings = async () => {
    if (!user?.id) return
    
    try {
      const userData = await apiClient.getUser(user.id)
      if (userData?.userSettings) {
        // Load notification settings
        if (userData.userSettings.emailNotifications !== undefined) {
          setNotifications(prev => ({
            ...prev,
            emailNotifications: userData.userSettings.emailNotifications,
            deviceAlerts: userData.userSettings.deviceAlerts ?? prev.deviceAlerts,
            licenseExpiry: userData.userSettings.licenseExpiry ?? prev.licenseExpiry,
            assignmentUpdates: userData.userSettings.assignmentUpdates ?? prev.assignmentUpdates,
            systemMaintenance: userData.userSettings.systemMaintenance ?? prev.systemMaintenance,
            weeklyReports: userData.userSettings.weeklyReports ?? prev.weeklyReports,
          }))
        }
        
        // Load preferences
        if (userData.userSettings.language !== undefined) {
          setPreferences(prev => ({
            ...prev,
            language: userData.userSettings.language ?? prev.language,
            timezone: userData.userSettings.timezone ?? prev.timezone,
            dateFormat: userData.userSettings.dateFormat ?? prev.dateFormat,
            itemsPerPage: userData.userSettings.itemsPerPage ?? prev.itemsPerPage,
            defaultView: userData.userSettings.defaultView ?? prev.defaultView,
          }))
        }
        
        // Load theme preference
        if (userData.userSettings.theme) {
          setTheme(userData.userSettings.theme)
        }
        
        // Load security settings
        if (userData.userSettings.twoFactorEnabled !== undefined) {
          setSecurity(prev => ({
            ...prev,
            twoFactorEnabled: userData.userSettings.twoFactorEnabled ?? prev.twoFactorEnabled,
            sessionTimeout: userData.userSettings.sessionTimeout ?? prev.sessionTimeout,
            passwordExpiry: userData.userSettings.passwordExpiry ?? prev.passwordExpiry,
            loginNotifications: userData.userSettings.loginNotifications ?? prev.loginNotifications,
            azureSSOEnabled: userData.userSettings.azureSSOEnabled ?? prev.azureSSOEnabled,
            azureTenantId: userData.userSettings.azureTenantId ?? prev.azureTenantId,
            azureClientId: userData.userSettings.azureClientId ?? prev.azureClientId,
            azureAutoProvisioning: userData.userSettings.azureAutoProvisioning ?? prev.azureAutoProvisioning,
            azureRequireForAllUsers: userData.userSettings.azureRequireForAllUsers ?? prev.azureRequireForAllUsers,
            azureSyncGroups: userData.userSettings.azureSyncGroups ?? prev.azureSyncGroups,
            azureGroupMapping: userData.userSettings.azureGroupMapping ?? prev.azureGroupMapping,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }

  const loadAzureConfig = async () => {
    try {
      const config = await apiClient.getAzureConfig()
      if (config.isConfigured) {
        setAzureConfigured(true)
      }
    } catch (error) {
      console.error('Error loading Azure config:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const companiesData = await apiClient.getCompanies()
      setCompanies(companiesData || [])
      
      // Load user's selected companies from backend
      if (user?.id) {
        try {
          const userData = await apiClient.getUser(user.id)
          if (userData?.selectedCompanyIds && Array.isArray(userData.selectedCompanyIds)) {
            // Only set companies that still exist in the fetched data
            const validSelections = userData.selectedCompanyIds.filter((id: string) => 
              companiesData?.some((company: any) => company.id === id)
            )
            setSelectedCompanies(validSelections)
            
            // If there's at least one selected company, set it as the current company
            if (validSelections.length > 0) {
              localStorage.setItem('selectedCompanyId', validSelections[0])
            }
          }
        } catch (e) {
          console.error('Error loading user company selections:', e)
        }
      }
    } catch (error) {
      console.error("Error loading companies:", error)
      // If error is 401, user is not authenticated
      if ((error as any)?.response?.status !== 401) {
        toast({
          title: "Error",
          description: "Failed to load companies",
          variant: "destructive",
        })
      }
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare the update data - only send fields that the backend accepts
      const updateData = {
        name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        department: profileData.department,
      }

      // Call the API to update the user
      await apiClient.updateUser(user.id, updateData)

      // Update the local user context if needed
      // You might want to refresh the user data in the auth context here

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveNotifications = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      await apiClient.updateUser(user.id, {
        userSettings: {
          ...notifications,
          ...preferences,
          theme: theme || "system",
        }
      })

      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      console.error("Error saving notifications:", error)
      toast({
        title: "Update Failed",
        description: "Failed to save notification settings.",
        variant: "destructive",
      })
    }
  }

  const handleSavePreferences = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      await apiClient.updateUser(user.id, {
        userSettings: {
          ...notifications,
          ...preferences,
          theme: theme || "system",
        }
      })

      toast({
        title: "Preferences Updated",
        description: "Your system preferences have been saved.",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Update Failed",
        description: "Failed to save preferences.",
        variant: "destructive",
      })
    }
  }

  const handleSaveSecurity = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      // Extract only the non-Azure fields for userSettings
      const { azureTenantId, azureClientId, azureClientSecret, azureRedirectUri, ...otherSecuritySettings } = security
      
      await apiClient.updateUser(user.id, {
        userSettings: {
          ...otherSecuritySettings,
          theme: theme || "system",
        },
        // Store Azure settings separately if needed
        azureConfig: {
          tenantId: azureTenantId,
          clientId: azureClientId,
        }
      })

      toast({
        title: "Security Settings Updated",
        description: "Your security settings have been updated.",
      })
    } catch (error) {
      console.error("Error saving security settings:", error)
      toast({
        title: "Update Failed",
        description: "Failed to save security settings.",
        variant: "destructive",
      })
    }
  }

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export will be ready for download shortly.",
    })
  }

  const handleTestAzureConnection = async () => {
    if (!security.azureTenantId || !security.azureClientId || !security.azureClientSecret) {
      toast({
        title: "Configuration Incomplete",
        description: "Please fill in all required Azure AD fields (Tenant ID, Client ID, and Client Secret).",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Testing Azure AD Connection",
      description: "Validating your Azure AD configuration...",
    })

    try {
      const response = await fetch("/api/auth/test-azure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId: security.azureTenantId,
          clientId: security.azureClientId,
          clientSecret: security.azureClientSecret,
        }),
      })

      if (response.ok) {
        toast({
          title: "Azure AD Connection Successful",
          description: "Your Azure AD configuration is working correctly.",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Azure AD Connection Failed",
          description: error.message || "Unable to connect to Azure AD. Please check your configuration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Azure AD test error:", error)

      // Basic validation of Azure AD field formats
      const tenantIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const clientIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      if (!tenantIdRegex.test(security.azureTenantId)) {
        toast({
          title: "Invalid Tenant ID",
          description: "Tenant ID must be a valid GUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).",
          variant: "destructive",
        })
        return
      }

      if (!clientIdRegex.test(security.azureClientId)) {
        toast({
          title: "Invalid Client ID",
          description: "Client ID must be a valid GUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).",
          variant: "destructive",
        })
        return
      }

      if (security.azureClientSecret.length < 10) {
        toast({
          title: "Invalid Client Secret",
          description: "Client Secret appears to be too short. Please verify the secret value.",
          variant: "destructive",
        })
        return
      }

      // If basic validation passes but API call failed, show network error
      toast({
        title: "Connection Test Failed",
        description: "Unable to test Azure AD connection. Configuration format appears valid, but network test failed.",
        variant: "destructive",
      })
    }
  }

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.code) {
      toast({
        title: "Validation Error",
        description: "Company name and code are required.",
        variant: "destructive",
      })
      return
    }

    try {
      const companyData = {
        name: newCompany.name,
        code: newCompany.code.toUpperCase(),
        description: newCompany.description || undefined,
        address: newCompany.address || undefined,
        contactEmail: newCompany.contactEmail || undefined,
        contactPhone: newCompany.contactPhone || undefined,
      }

      const createdCompany = await apiClient.createCompany(companyData)
      
      // Add the new company to the list
      setCompanies((prev) => [...prev, createdCompany])
      
      // Reset the form
      setNewCompany({
        name: "",
        code: "",
        description: "",
        address: "",
        contactEmail: "",
        contactPhone: "",
      })

      toast({
        title: "Company Added",
        description: `${createdCompany.name} has been added successfully.`,
      })
    } catch (error) {
      console.error("Error creating company:", error)
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCompany = async (companyId: string) => {
    try {
      await apiClient.deleteCompany(companyId)
      setCompanies((prev) => prev.filter((c) => c.id !== companyId))
      setSelectedCompanies((prev) => prev.filter((id) => id !== companyId))
      toast({
        title: "Company Removed",
        description: "Company has been removed successfully.",
      })
    } catch (error) {
      console.error("Error removing company:", error)
      toast({
        title: "Error",
        description: "Failed to remove company. Please try again.",
        variant: "destructive",
      })
    }
  }

  const saveSelectedCompanies = async (newSelections: string[]) => {
    if (!user?.id) return
    
    try {
      await apiClient.updateUser(user.id, {
        selectedCompanyIds: newSelections
      })
      
      // Also update localStorage for immediate use
      if (newSelections.length > 0) {
        localStorage.setItem('selectedCompanyId', newSelections[0])
      } else {
        localStorage.removeItem('selectedCompanyId')
      }
    } catch (error) {
      console.error('Error saving company selections:', error)
      toast({
        title: "Error",
        description: "Failed to save company selections",
        variant: "destructive",
      })
    }
  }

  const handleToggleCompanySelection = async (companyId: string) => {
    const newSelections = selectedCompanies.includes(companyId) 
      ? selectedCompanies.filter((id) => id !== companyId)
      : [...selectedCompanies, companyId]
    
    setSelectedCompanies(newSelections)
    await saveSelectedCompanies(newSelections)
  }

  const handleSelectAllCompanies = async () => {
    const allIds = companies.map((c) => c.id)
    setSelectedCompanies(allIds)
    await saveSelectedCompanies(allIds)
  }

  const handleDeselectAllCompanies = async () => {
    setSelectedCompanies([])
    await saveSelectedCompanies([])
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account settings and system preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="azure-sync" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Azure Sync
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={profileData.department}
                        onValueChange={(value) => setProfileData((prev) => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">Information Technology</SelectItem>
                          <SelectItem value="HR">Human Resources</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                    />
                  </div>

                  <Button onClick={handleSaveProfile}>Save Profile</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified about system events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Device Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about device issues and maintenance
                        </p>
                      </div>
                      <Switch
                        checked={notifications.deviceAlerts}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, deviceAlerts: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">License Expiry Warnings</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive alerts when licenses are about to expire
                        </p>
                      </div>
                      <Switch
                        checked={notifications.licenseExpiry}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, licenseExpiry: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Assignment Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when devices or licenses are assigned/returned
                        </p>
                      </div>
                      <Switch
                        checked={notifications.assignmentUpdates}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, assignmentUpdates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">System Maintenance</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about scheduled maintenance
                        </p>
                      </div>
                      <Switch
                        checked={notifications.systemMaintenance}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, systemMaintenance: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">Receive weekly inventory summary reports</p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, weeklyReports: checked }))}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                  <CardDescription>Customize your system appearance and behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={mounted ? theme : "system"}
                        onValueChange={(value) => setTheme(value)}
                        disabled={!mounted}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={preferences.language}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={preferences.timezone}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="CST">Central Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={preferences.dateFormat}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, dateFormat: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemsPerPage">Items Per Page</Label>
                      <Select
                        value={preferences.itemsPerPage}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, itemsPerPage: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultView">Default View</Label>
                      <Select
                        value={preferences.defaultView}
                        onValueChange={(value) => setPreferences((prev) => ({ ...prev, defaultView: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">Table</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSavePreferences}>Save Preferences</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Management</CardTitle>
                  <CardDescription>
                    Manage companies and associate devices, licenses, and phone contracts with them
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Company */}
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-4">Add New Company</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          placeholder="e.g., Acme Corporation"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyCode">Company Code *</Label>
                        <Input
                          id="companyCode"
                          placeholder="e.g., ACME"
                          value={newCompany.code}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="companyDescription">Description</Label>
                      <Input
                        id="companyDescription"
                        placeholder="Brief description of the company"
                        value={newCompany.description}
                        onChange={(e) => setNewCompany((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="companyAddress">Address</Label>
                      <Textarea
                        id="companyAddress"
                        placeholder="Company address"
                        value={newCompany.address}
                        onChange={(e) => setNewCompany((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyEmail">Contact Email</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          placeholder="contact@company.com"
                          value={newCompany.contactEmail}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, contactEmail: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyPhone">Contact Phone</Label>
                        <Input
                          id="companyPhone"
                          placeholder="+1-555-0100"
                          value={newCompany.contactPhone}
                          onChange={(e) => setNewCompany((prev) => ({ ...prev, contactPhone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddCompany} className="mt-4">
                      Add Company
                    </Button>
                  </div>

                  {/* Company List with Multiselect */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Existing Companies</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSelectAllCompanies}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDeselectAllCompanies}>
                          Deselect All
                        </Button>
                      </div>
                    </div>

                    {selectedCompanies.length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>{selectedCompanies.length}</strong> companies selected. These will be available for
                          association with devices, licenses, and phone contracts.
                        </p>
                      </div>
                    )}

                    <div className="grid gap-3">
                      {loadingCompanies ? (
                        <div className="text-center py-4 text-muted-foreground">Loading companies...</div>
                      ) : (
                        companies.map((company) => (
                          <div
                            key={company.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedCompanies.includes(company.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => handleToggleCompanySelection(company.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    selectedCompanies.includes(company.id)
                                      ? "border-blue-500 bg-blue-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {selectedCompanies.includes(company.id) && (
                                    <div className="w-2 h-2 bg-white rounded-sm" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{company.name}</span>
                                    <Badge variant="outline">{company.code}</Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveCompany(company.id)
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {companies.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No companies added yet. Add your first company above.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium text-green-900 mb-2">How Company Association Works</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Selected companies will appear in device, license, and phone contract forms</li>
                      <li>• You can assign multiple companies to a single asset</li>
                      <li>• Use company filters to view assets by organization</li>
                      <li>• Generate reports segmented by company</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="azure-sync" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Azure AD Employee Sync</CardTitle>
                  <CardDescription>
                    Sync employees from Azure Active Directory to your inventory system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                      <span className="font-semibold text-blue-900">Azure Active Directory Integration</span>
                      {azureConfigured && (
                        <Badge className="bg-green-600">Configured</Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-blue-800 mb-4">
                      {azureConfigured 
                        ? "Azure AD is configured via environment variables. You can fetch users directly."
                        : "Connect to your Azure AD to fetch users and automatically create employee records."}
                    </p>
                    
                    {azureConfigured ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>✓ Azure AD is configured</strong><br />
                            Your Azure AD credentials are securely configured in the environment.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="syncCompany">Target Company</Label>
                          <Select
                            value={selectedCompanies[0] || ""}
                            onValueChange={(value) => {
                              if (value && !selectedCompanies.includes(value)) {
                                setSelectedCompanies([value]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a company for new employees" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name} ({company.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            New employees will be added to this company
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Manual Configuration Required</strong><br />
                            Azure AD credentials are not configured in the environment. Please enter them manually.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="syncTenantId">Tenant ID</Label>
                            <Input
                              id="syncTenantId"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              value={security.azureTenantId}
                              onChange={(e) => setSecurity((prev) => ({ ...prev, azureTenantId: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="syncClientId">Application (Client) ID</Label>
                            <Input
                              id="syncClientId"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              value={security.azureClientId}
                              onChange={(e) => setSecurity((prev) => ({ ...prev, azureClientId: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="syncClientSecret">Client Secret</Label>
                          <Input
                            id="syncClientSecret"
                            type="password"
                            placeholder="Enter client secret value"
                            value={security.azureClientSecret}
                            onChange={(e) => setSecurity((prev) => ({ ...prev, azureClientSecret: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="syncCompany">Target Company</Label>
                          <Select
                            value={selectedCompanies[0] || ""}
                            onValueChange={(value) => {
                              if (value && !selectedCompanies.includes(value)) {
                                setSelectedCompanies([value]);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a company for new employees" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name} ({company.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            New employees will be added to this company
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-6">
                      <Button 
                        onClick={async () => {
                          if (!azureConfigured && (!security.azureTenantId || !security.azureClientId || !security.azureClientSecret)) {
                            toast({
                              title: "Configuration Required",
                              description: "Please fill in all Azure AD credentials.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          if (!selectedCompanies[0]) {
                            toast({
                              title: "Company Required",
                              description: "Please select a target company for new employees.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Dynamically import the modal component
                          const { openAzureUsersModal } = await import("@/components/settings/azure-users-modal");
                          openAzureUsersModal({
                            tenantId: azureConfigured ? undefined : security.azureTenantId,
                            clientId: azureConfigured ? undefined : security.azureClientId,
                            clientSecret: azureConfigured ? undefined : security.azureClientSecret,
                            companyId: selectedCompanies[0],
                            companies,
                            useEnvironmentConfig: azureConfigured,
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Cloud className="h-4 w-4 mr-2" />
                        Fetch Azure AD Users
                      </Button>
                      
                      <Button
                        onClick={handleTestAzureConnection}
                        variant="outline"
                      >
                        Test Connection
                      </Button>
                      
                      <Button variant="outline" asChild>
                        <a
                          href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          Azure Portal
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium text-green-900 mb-2">How Azure AD Sync Works</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Fetches all users from your Azure Active Directory</li>
                      <li>• Displays users with their details (name, email, department, job title)</li>
                      <li>• Allows individual selection of users to add as employees</li>
                      <li>• Automatically maps Azure AD fields to employee records</li>
                      <li>• Prevents duplicate employees based on email address</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <h4 className="font-medium text-yellow-900 mb-2">Required Azure AD Permissions</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• User.Read.All - Read all users' basic profiles</li>
                      <li>• Directory.Read.All - Read directory data</li>
                    </ul>
                    <p className="text-sm text-yellow-800 mt-2">
                      Configure these in Azure Portal → App registrations → API permissions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and Azure AD authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Azure AD Single Sign-On</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable Azure Active Directory authentication for your organization
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={security.azureSSOEnabled ? "default" : "secondary"}>
                          {security.azureSSOEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={security.azureSSOEnabled}
                          onCheckedChange={(checked) => setSecurity((prev) => ({ ...prev, azureSSOEnabled: checked }))}
                        />
                      </div>
                    </div>

                    {security.azureSSOEnabled && (
                      <div className="ml-4 p-4 border rounded-lg bg-blue-50 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                          </div>
                          <span className="font-semibold text-blue-900">Microsoft Azure Active Directory</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="azureTenantId">Tenant ID</Label>
                            <Input
                              id="azureTenantId"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              value={security.azureTenantId}
                              onChange={(e) => setSecurity((prev) => ({ ...prev, azureTenantId: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                              Found in Azure Portal → Azure Active Directory → Properties
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="azureClientId">Application (Client) ID</Label>
                            <Input
                              id="azureClientId"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                              value={security.azureClientId}
                              onChange={(e) => setSecurity((prev) => ({ ...prev, azureClientId: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">Found in your Azure AD app registration</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="azureClientSecret">Client Secret</Label>
                          <Input
                            id="azureClientSecret"
                            type="password"
                            placeholder="Enter client secret value"
                            value={security.azureClientSecret}
                            onChange={(e) => setSecurity((prev) => ({ ...prev, azureClientSecret: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Generate in Azure Portal → App registrations → Certificates & secrets
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="azureRedirectUri">Redirect URI</Label>
                          <Input
                            id="azureRedirectUri"
                            value={security.azureRedirectUri}
                            onChange={(e) => setSecurity((prev) => ({ ...prev, azureRedirectUri: e.target.value }))}
                            readOnly
                          />
                          <p className="text-xs text-muted-foreground">
                            Add this URI to your Azure AD app registration's redirect URIs
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Auto-Provisioning</Label>
                              <p className="text-sm text-muted-foreground">
                                Automatically create user accounts from Azure AD
                              </p>
                            </div>
                            <Switch
                              checked={security.azureAutoProvisioning}
                              onCheckedChange={(checked) =>
                                setSecurity((prev) => ({ ...prev, azureAutoProvisioning: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Sync Azure AD Groups</Label>
                              <p className="text-sm text-muted-foreground">Map Azure AD groups to application roles</p>
                            </div>
                            <Switch
                              checked={security.azureSyncGroups}
                              onCheckedChange={(checked) =>
                                setSecurity((prev) => ({ ...prev, azureSyncGroups: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label className="text-base">Require Azure AD for All Users</Label>
                              <p className="text-sm text-muted-foreground">
                                Force all users to authenticate via Azure AD
                              </p>
                            </div>
                            <Switch
                              checked={security.azureRequireForAllUsers}
                              onCheckedChange={(checked) =>
                                setSecurity((prev) => ({ ...prev, azureRequireForAllUsers: checked }))
                              }
                            />
                          </div>
                        </div>

                        {security.azureSyncGroups && (
                          <div className="p-3 bg-white rounded border">
                            <Label className="text-sm font-medium">Azure AD Group Mapping</Label>
                            <p className="text-xs text-muted-foreground mb-3">
                              Map Azure AD groups to application roles
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">IT-Admins</span>
                                <span>→</span>
                                <Badge variant="outline">Admin</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">IT-Managers</span>
                                <span>→</span>
                                <Badge variant="outline">Manager</Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">IT-Users</span>
                                <span>→</span>
                                <Badge variant="outline">User</Badge>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button onClick={handleTestAzureConnection} variant="outline" size="sm">
                            Test Azure Connection
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              Azure Portal
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={security.twoFactorEnabled ? "default" : "secondary"}>
                          {security.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                          checked={security.twoFactorEnabled}
                          onCheckedChange={(checked) => setSecurity((prev) => ({ ...prev, twoFactorEnabled: checked }))}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Select
                        value={security.sessionTimeout}
                        onValueChange={(value) => setSecurity((prev) => ({ ...prev, sessionTimeout: value }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                      <Select
                        value={security.passwordExpiry}
                        onValueChange={(value) => setSecurity((prev) => ({ ...prev, passwordExpiry: value }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Login Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone logs into your account
                        </p>
                      </div>
                      <Switch
                        checked={security.loginNotifications}
                        onCheckedChange={(checked) => setSecurity((prev) => ({ ...prev, loginNotifications: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={handleSaveSecurity}>Save Security Settings</Button>
                    <Button variant="outline" className="ml-2 bg-transparent">
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Export your data and manage your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Download className="h-5 w-5" />
                        <h3 className="font-semibold">Export Data</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download a copy of all your inventory data including devices, licenses, and assignments.
                      </p>
                      <Button onClick={handleExportData} variant="outline">
                        Export All Data
                      </Button>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-5 w-5" />
                        <h3 className="font-semibold">Data Retention</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure how long different types of data are retained in the system.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Assignment History</Label>
                          <Select defaultValue="2years">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1year">1 Year</SelectItem>
                              <SelectItem value="2years">2 Years</SelectItem>
                              <SelectItem value="5years">5 Years</SelectItem>
                              <SelectItem value="forever">Forever</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Activity Logs</Label>
                          <Select defaultValue="1year">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6months">6 Months</SelectItem>
                              <SelectItem value="1year">1 Year</SelectItem>
                              <SelectItem value="2years">2 Years</SelectItem>
                              <SelectItem value="forever">Forever</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center gap-3 mb-2">
                        <Database className="h-5 w-5 text-red-600" />
                        <h3 className="font-semibold text-red-900">Danger Zone</h3>
                      </div>
                      <p className="text-sm text-red-700 mb-4">
                        These actions are irreversible. Please proceed with caution.
                      </p>
                      <Button variant="destructive" size="sm">
                        Delete All Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
