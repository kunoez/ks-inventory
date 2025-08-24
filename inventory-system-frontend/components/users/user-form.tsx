"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { User, Company } from "@/lib/types"
import { dataService } from "@/lib/data-service"

interface UserFormProps {
  user?: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userData: Partial<User>) => void
}

export function UserForm({ user, open, onOpenChange, onSubmit }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "user",
    department: "",
    isActive: true,
    password: "",
    confirmPassword: "",
  })
  const [companies, setCompanies] = useState<Company[]>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      loadCompanies()
      if (user) {
        setFormData({
          email: user.email,
          name: user.name || "",
          role: user.role,
          department: user.department || "",
          isActive: user.isActive,
          password: "",
          confirmPassword: "",
        })
      } else {
        setFormData({
          email: "",
          name: "",
          role: "user",
          department: "",
          isActive: true,
          password: "",
          confirmPassword: "",
        })
      }
      setErrors([])
    }
  }, [open, user])

  const loadCompanies = async () => {
    try {
      const data = await dataService.getCompanies()
      setCompanies(data)
    } catch (error) {
      console.error("Failed to load companies:", error)
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    if (!formData.email) {
      newErrors.push("Email is required")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push("Invalid email format")
    }

    if (!formData.name) {
      newErrors.push("Name is required")
    }

    // Password validation for new users
    if (!user) {
      if (!formData.password) {
        newErrors.push("Password is required for new users")
      } else if (formData.password.length < 8) {
        newErrors.push("Password must be at least 8 characters")
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.push("Passwords do not match")
      }
    }

    // Password validation for updates (if password is provided)
    if (user && formData.password) {
      if (formData.password.length < 8) {
        newErrors.push("Password must be at least 8 characters")
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.push("Passwords do not match")
      }
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const userData: any = {
      email: formData.email,
      name: formData.name,
      role: formData.role as User["role"],
      department: formData.department || undefined,
      isActive: formData.isActive,
      authMethod: user?.authMethod || "local", // Default to local for new users
    }

    // Only include password if it's provided
    if (formData.password) {
      userData.password = formData.password
    }

    onSubmit(userData)
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors([]) // Clear errors when user makes changes
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {user ? "Update user information and permissions" : "Create a new user account"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="John Doe"
                disabled={!!user?.azureId || user?.authMethod === "azure"}
              />
              {(user?.azureId || user?.authMethod === "azure") && (
                <p className="text-xs text-muted-foreground">
                  This user is managed by Azure AD. Name cannot be edited here.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => updateField("department", e.target.value)}
                placeholder="IT Department"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(!user || formData.password) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {user ? "New Password (leave blank to keep current)" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => updateField("isActive", checked)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Account is active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{user ? "Update User" : "Create User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}