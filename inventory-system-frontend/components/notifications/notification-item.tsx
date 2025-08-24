"use client"

import { formatDistanceToNow } from "date-fns"
import { AlertCircle, AlertTriangle, CheckCircle, Info, Package, Users, Key, Calendar, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  category: 'device' | 'license' | 'employee' | 'system' | 'expiry' | 'assignment' | 'maintenance'
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

interface NotificationItemProps {
  notification: NotificationData
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: () => void
}

export function NotificationItem({ notification, onMarkAsRead, onDelete, onClick }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'device':
        return <Package className="h-4 w-4" />
      case 'license':
        return <Key className="h-4 w-4" />
      case 'employee':
        return <Users className="h-4 w-4" />
      case 'expiry':
        return <Calendar className="h-4 w-4" />
      case 'maintenance':
        return <Settings className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      className={cn(
        "flex gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0",
        !notification.isRead && "bg-blue-50/50"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={cn(
              "text-sm",
              !notification.isRead && "font-semibold"
            )}>
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {getCategoryIcon() && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getCategoryIcon()}
                  <span className="capitalize">{notification.category}</span>
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  )
}