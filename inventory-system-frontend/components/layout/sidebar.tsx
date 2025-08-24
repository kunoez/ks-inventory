"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Laptop,
  Key,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Phone,
  UserCog,
} from "lucide-react"
import { useState } from "react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Devices",
    href: "/devices",
    icon: Laptop,
  },
  {
    name: "Licenses",
    href: "/licenses",
    icon: Key,
  },
  {
    name: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    name: "Phones",
    href: "/phones",
    icon: Phone,
  },
  {
    name: "Financial",
    href: "/financial",
    icon: DollarSign,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "User Management",
    href: "/users",
    icon: UserCog,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-300 h-full flex-shrink-0",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <nav className="flex-1 p-3 pt-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                    : "text-gray-400 hover:bg-gray-700/50 hover:text-white",
                )}
              >
                <item.icon className={cn(
                  "flex-shrink-0 transition-transform duration-200",
                  isActive ? "h-5 w-5" : "h-4 w-4 group-hover:scale-110"
                )} />
                {!collapsed && (
                  <span className="truncate text-sm">{item.name}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700">
        {!collapsed && (
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Version</p>
                <p className="text-sm font-medium text-gray-300">v1.0.0</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="System Online" />
            </div>
          </div>
        )}
        <div className={cn("flex items-center", collapsed ? "justify-center p-3" : "justify-end px-4 pb-4")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
