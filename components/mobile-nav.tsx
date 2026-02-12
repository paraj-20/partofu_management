"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    Package,
    Settings,
    LogOut,
    Shield,
    Menu,
    Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Team", icon: Users },
    { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/dashboard/packages", label: "Packages", icon: Package },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [open, setOpen] = React.useState(false)

    const { data } = useSWR(user ? "/api/notifications" : null, fetcher, {
        refreshInterval: 30000
    })

    const unreadCount = data?.notifications?.filter((n: any) => !n.is_read).length || 0

    return (
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="h-8 w-8" />
                <span className="font-bold text-foreground">PartOfU</span>
            </div>

            <div className="flex items-center gap-1">
                <Link href="/dashboard/notifications" className="relative p-2 text-muted-foreground hover:text-foreground mr-1">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--success))] text-[10px] font-bold text-white border-2 border-card">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] bg-card border-r border-border p-0">
                        <SheetHeader className="p-4 border-b border-border text-left">
                            <SheetTitle className="flex items-center gap-2">
                                <img src="/logo.png" alt="Logo" className="h-6 w-6" />
                                PartOfU
                            </SheetTitle>
                        </SheetHeader>

                        <nav className="flex flex-col gap-1 p-4">
                            {navItems.map((item) => {
                                const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        )}
                                    >
                                        <div className="relative">
                                            <item.icon className="h-5 w-5" />
                                            {item.label === "Notifications" && unreadCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--success))] text-[10px] font-bold text-white border-2 border-card">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
                            {user && (
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{user.role}</p>
                                    </div>
                                </div>
                            )}
                            <Button variant="secondary" className="w-full justify-start" onClick={logout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
