"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Key, UserPlus, UserMinus, Calendar, Phone } from "lucide-react"
import apiClient from "@/lib/api-client"

interface Activity {
  id: string
  type: "device" | "license" | "phone"
  action: "assigned" | "returned" | "revoked"
  status: string
  timestamp: string
  assignedDate: string
  returnedDate?: string
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
    department?: string
  } | null
  item: {
    id: string
    name: string
    type?: string
    manufacturer?: string
    model?: string
  } | null
  actionBy: string
  notes?: string
}

export function RecentActivity() {
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadActivities() {
      try {
        // Get recent activity from the API
        const response = await apiClient.getRecentActivity()
        
        // Set the activities
        setAllActivities(response.activities || [])
      } catch (error: any) {
        console.error("Error loading activities:", error)
        // If it's a 401 error, the user needs to log in
        if (error?.response?.status === 401) {
          console.log("User not authenticated, skipping activity load")
        }
        // If API fails, set empty activities
        setAllActivities([])
      } finally {
        setLoading(false)
      }
    }

    // Only load activities if we have a valid token
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      loadActivities()
    } else {
      setLoading(false)
    }
  }, [])

  const getActivityIcon = (type: "device" | "license" | "phone", action: "assigned" | "returned" | "revoked") => {
    if (type === "device") {
      return action === "assigned" ? (
        <UserPlus className="h-4 w-4 text-green-600" />
      ) : (
        <UserMinus className="h-4 w-4 text-red-600" />
      )
    } else if (type === "license") {
      return action === "assigned" ? (
        <Key className="h-4 w-4 text-blue-600" />
      ) : (
        <UserMinus className="h-4 w-4 text-orange-600" />
      )
    } else {
      // Phone
      return action === "assigned" ? (
        <Phone className="h-4 w-4 text-purple-600" />
      ) : (
        <UserMinus className="h-4 w-4 text-red-600" />
      )
    }
  }

  const getActivityDescription = (activity: Activity) => {
    const typeLabel = activity.type === "device" ? "Device" : 
                     activity.type === "license" ? "License" : 
                     "Phone Contract"
    return `${typeLabel} ${activity.action}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading activities...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest assignments and returns</CardDescription>
      </CardHeader>
      <CardContent>
        {allActivities.length > 0 ? (
          <div className="space-y-4">
            {allActivities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.employee && getInitials(`${activity.employee.firstName} ${activity.employee.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type, activity.action)}
                    <span className="text-sm font-medium">
                      {activity.employee && `${activity.employee.firstName} ${activity.employee.lastName}`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getActivityDescription(activity)} • {activity.item && activity.item.name}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={activity.status === "active" ? "default" : "secondary"} className="text-xs">
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}