"use client"

import React from "react"

import { useAuth } from "@/hooks/use-auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { NotificationToast } from "@/components/notification-toast"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.push("/login")
    }
  }, [isLoading, isError, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <MobileNav />
      <DashboardSidebar />
      <NotificationToast />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
