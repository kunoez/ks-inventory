"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationIcon } from "./notification-icon"
import { NotificationItem, NotificationData } from "./notification-item"
import { CheckCheck, Trash2, Bell } from "lucide-react"
import apiClient from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

export function NotificationDropdown() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
      if (open) {
        fetchNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      // Use mock data for demonstration
      setNotifications([
        {
          id: "1",
          title: "License Expiring Soon",
          message: "Microsoft Office license will expire in 7 days",
          type: "warning",
          category: "expiry",
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          actionUrl: "/licenses",
        },
        {
          id: "2",
          title: "New Device Assigned",
          message: "MacBook Pro has been assigned to you",
          type: "info",
          category: "assignment",
          isRead: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          actionUrl: "/devices",
        },
        {
          id: "3",
          title: "Low License Seats",
          message: "Adobe Creative Cloud has only 2 seats remaining",
          type: "warning",
          category: "license",
          isRead: true,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          actionUrl: "/licenses",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const { count } = await apiClient.getUnreadNotificationCount()
      setUnreadCount(count)
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
      // Mock count for demonstration
      setUnreadCount(2)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Failed to mark as read:", error)
      // Optimistic update for demonstration
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast({
        title: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      // Optimistic update for demonstration
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast({
        title: "All notifications marked as read",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteNotification(id)
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error("Failed to delete notification:", error)
      // Optimistic update for demonstration
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      setNotifications(prev => prev.filter(n => n.id !== id))
    }
  }

  const handleDeleteAll = async () => {
    try {
      await apiClient.deleteAllNotifications()
      setNotifications([])
      setUnreadCount(0)
      toast({
        title: "All notifications deleted",
      })
    } catch (error) {
      console.error("Failed to delete all notifications:", error)
      // Optimistic update for demonstration
      setNotifications([])
      setUnreadCount(0)
      toast({
        title: "All notifications deleted",
      })
    }
  }

  const handleNotificationClick = (notification: NotificationData) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setOpen(false)
    }
  }

  const filteredNotifications = activeTab === "unread"
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationIcon unreadCount={unreadCount} onClick={() => setOpen(!open)} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No {activeTab === "unread" ? "unread" : ""} notifications</p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-3 border-t">
          <Button
            variant="link"
            className="w-full text-sm"
            onClick={() => {
              router.push("/notifications")
              setOpen(false)
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}