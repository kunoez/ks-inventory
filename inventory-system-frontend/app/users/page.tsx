"use client"

import { useState, useEffect } from "react"
import { Plus, Shield, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AppLayout } from "@/components/layout/app-layout"
import { UserTable } from "@/components/users/user-table"
import { UserForm } from "@/components/users/user-form"
import apiClient from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | undefined>()
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getUsers()
      setUsers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleAddUser = () => {
    setSelectedUser(undefined)
    setIsFormOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.deleteUser(userId)
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleFormSubmit = async (userData: Partial<User>) => {
    try {
      if (selectedUser) {
        await apiClient.updateUser(selectedUser.id, userData)
        toast({
          title: "Success",
          description: "User updated successfully",
        })
      } else {
        await apiClient.createUser(userData)
        toast({
          title: "Success",
          description: "User created successfully",
        })
      }
      setIsFormOpen(false)
      loadUsers()
    } catch (error) {
      toast({
        title: "Error",
        description: selectedUser ? "Failed to update user" : "Failed to create user",
        variant: "destructive",
      })
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage system users and their access permissions</p>
            </div>
            <Button onClick={handleAddUser} className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">Active system users</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.role === "admin").length}
                </div>
                <p className="text-xs text-muted-foreground">Users with admin privileges</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.role === "user").length}
                </div>
                <p className="text-xs text-muted-foreground">Standard access users</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTable
                users={users}
                isLoading={isLoading}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            </CardContent>
          </Card>

          <UserForm
            user={selectedUser}
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={handleFormSubmit}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}