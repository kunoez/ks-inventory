"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Laptop, Key, BarChart3, FileText } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const actions = [
    {
      title: "Add Device",
      description: "Register new hardware",
      icon: Laptop,
      href: "/devices",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Add License",
      description: "Register new software license",
      icon: Key,
      href: "/licenses",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Add Employee",
      description: "Register new team member",
      icon: Users,
      href: "/employees",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "View Reports",
      description: "Generate detailed reports",
      icon: BarChart3,
      href: "#",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50 bg-transparent"
              >
                <action.icon className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 gap-2">
            <Link href="/devices">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Export Device Report
              </Button>
            </Link>
            <Link href="/licenses">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Export License Report
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
