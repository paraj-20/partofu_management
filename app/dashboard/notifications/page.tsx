"use client"

import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Bell,
    CheckCheck,
    Trash2,
    Check,
    Clock,
    Package,
    Settings,
    UserPlus,
    ArrowRight,
    MoreVertical,
    X
} from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Notification = {
    id: number
    user_id: number
    type: string
    title: string
    message: string
    link: string | null
    is_read: boolean
    created_at: string
}

export default function NotificationsPage() {
    const { user } = useAuth()
    const { data, mutate } = useSWR("/api/notifications", fetcher)
    const notifications: Notification[] = data?.notifications || []
    const unreadCount = notifications.filter(n => !n.is_read).length

    async function handleMarkRead(notificationId?: number, markAll = false) {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId, markAllAsRead: markAll }),
            })
            if (!res.ok) throw new Error()
            mutate()
            if (markAll) toast.success("All notifications marked as read")
        } catch {
            toast.error("Failed to update notification")
        }
    }

    async function handleDelete(notificationId?: number, deleteAll = false) {
        if (deleteAll && !confirm("Delete all notifications?")) return
        try {
            const res = await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId, deleteAll }),
            })
            if (!res.ok) throw new Error()
            mutate()
            if (deleteAll) toast.success("All notifications deleted")
            else toast.success("Notification deleted")
        } catch {
            toast.error("Failed to delete notification")
        }
    }

    function getIcon(type: string) {
        switch (type) {
            case 'task_assigned': return <UserPlus className="h-4 w-4 text-primary" />
            case 'package_added': return <Package className="h-4 w-4 text-amber-500" />
            case 'settings_changed': return <Settings className="h-4 w-4 text-blue-500" />
            default: return <Bell className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-muted-foreground mt-1">Stay updated with your latest activities.</p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkRead(undefined, true)}
                            className="bg-card border-border hover:bg-secondary/20"
                        >
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(undefined, true)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {notifications.length === 0 ? (
                    <Card className="bg-card border-border border-dashed py-16">
                        <CardContent className="flex flex-col items-center justify-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                                <Bell className="h-6 w-6 text-muted-foreground opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground font-medium">No notifications yet</p>
                                <p className="text-xs text-muted-foreground mt-1">We'll alert you here when something happens.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <div key={n.id} className="relative group">
                            <Card
                                className={`transition-all duration-200 border-border/60 hover:shadow-md ${!n.is_read ? 'bg-primary/[0.03] border-primary/20 shadow-sm' : 'bg-card'
                                    }`}
                            >
                                <CardContent className="p-4 sm:p-5">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground'
                                            }`}>
                                            {getIcon(n.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div>
                                                    <h3 className={`text-sm font-semibold truncate ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                        {n.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!n.is_read && (
                                                        <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1 rounded-full border-0">New</Badge>
                                                    )}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-card border-border">
                                                            {!n.is_read && (
                                                                <DropdownMenuItem onClick={() => handleMarkRead(n.id)} className="gap-2 cursor-pointer">
                                                                    <Check className="h-4 w-4" /> Mark as read
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleDelete(n.id)} className="text-destructive gap-2 cursor-pointer focus:text-destructive focus:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                                {n.message}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(n.created_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </div>

                                                {n.link && (
                                                    <Link
                                                        href={n.link}
                                                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                                        onClick={() => !n.is_read && handleMarkRead(n.id)}
                                                    >
                                                        View details <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
