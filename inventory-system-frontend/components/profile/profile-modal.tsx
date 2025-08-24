"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Briefcase,
  MapPin,
  Package,
  Key,
  Smartphone,
  Edit,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api-client"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserStats {
  devicesAssigned: number
  licensesUsed: number
  phoneContracts: number
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats>({
    devicesAssigned: 0,
    licensesUsed: 0,
    phoneContracts: 0,
  })

  useEffect(() => {
    if (open && user) {
      fetchUserPhoto()
      fetchUserStats()
    }
  }, [open, user])

  const fetchUserPhoto = async () => {
    if (!user?.azureId) return
    
    try {
      const tokenData = localStorage.getItem('azureTokens')
      if (!tokenData) return
      
      const tokens = JSON.parse(tokenData)
      const accessToken = tokens.access_token
      
      if (!accessToken) return
      
      const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setPhotoUrl(url)
      }
    } catch (error) {
      console.error('Failed to fetch user photo:', error)
    }
  }

  const fetchUserStats = async () => {
    try {
      // Fetch user's assigned items from API
      const statsData = await apiClient.getCurrentUserStats()
      setStats({
        devicesAssigned: statsData.devicesAssigned || 0,
        licensesUsed: statsData.licensesUsed || 0,
        phoneContracts: statsData.phoneContracts || 0,
      })
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      // Fallback to zeros if API fails
      setStats({
        devicesAssigned: 0,
        licensesUsed: 0,
        phoneContracts: 0,
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleEditProfile = () => {
    onOpenChange(false)
    router.push('/settings')
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Your profile information and activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={photoUrl || undefined} alt={user.name} />
              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="capitalize">
                  {user.role}
                </Badge>
                {user.department && (
                  <Badge variant="outline" className="capitalize">
                    {user.department}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              {user.department && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{user.department}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.location}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Assigned Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Assigned Resources</h4>
            <div className="grid grid-cols-3 gap-3">
              <Card className="cursor-pointer hover:bg-gray-50" onClick={() => router.push('/devices')}>
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-semibold">{stats.devicesAssigned}</p>
                  <p className="text-xs text-muted-foreground">Devices</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50" onClick={() => router.push('/licenses')}>
                <CardContent className="p-4 text-center">
                  <Key className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-semibold">{stats.licensesUsed}</p>
                  <p className="text-xs text-muted-foreground">Licenses</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-gray-50" onClick={() => router.push('/phones')}>
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-semibold">{stats.phoneContracts}</p>
                  <p className="text-xs text-muted-foreground">Phone Contracts</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Account Details</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-mono">{user.id.slice(0, 8)}...</span>
              </div>
              {user.azureId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Azure AD</span>
                  <Badge variant="outline" className="text-xs">
                    <Building className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleEditProfile}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}