"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, HelpCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { ProfileModal } from "@/components/profile/profile-modal"
import { FAQModal } from "@/components/faq/faq-modal"

export function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [faqModalOpen, setFaqModalOpen] = useState(false)

  useEffect(() => {
    const fetchUserPhoto = async () => {
      if (!user?.azureId) return
      
      try {
        // Try to get the access token from localStorage (if stored from Azure AD login)
        const tokenData = localStorage.getItem('azureTokens')
        if (!tokenData) return
        
        const tokens = JSON.parse(tokenData)
        const accessToken = tokens.access_token
        
        if (!accessToken) return
        
        // Fetch user photo from Microsoft Graph API
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
    
    fetchUserPhoto()
  }, [user])

  const handleLogout = async () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl)
    }
    await logout()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex-shrink-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">KOI</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Koch Inventory</h1>
            <p className="text-xs text-gray-500">By Koch Solutions GmbH</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-500">Welcome back,</span>
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={photoUrl || undefined} alt={user?.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-900">{user?.name}</p>
                  <p className="text-xs leading-none text-gray-500">{user?.email}</p>
                  <p className="text-xs leading-none text-gray-500 capitalize">
                    {user?.role} • {user?.department}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setProfileModalOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => router.push('/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setFaqModalOpen(true)}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & FAQ</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
      
      {/* FAQ Modal */}
      <FAQModal open={faqModalOpen} onOpenChange={setFaqModalOpen} />
    </header>
  )
}
