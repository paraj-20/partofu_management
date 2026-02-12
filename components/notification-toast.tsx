"use client"

import { useEffect, useRef } from "react"
import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function NotificationToast() {
    const { user } = useAuth()
    const router = useRouter()
    const { data } = useSWR(user ? "/api/notifications" : null, fetcher, {
        refreshInterval: 3000,
        revalidateOnFocus: true,
        revalidateOnMount: true,
    })

    // Keep track of shown IDs to avoid double-toasting
    const shownIds = useRef<Set<number>>(new Set())
    const isFirstLoad = useRef(true)

    useEffect(() => {
        if (data?.notifications && user) {
            const unread = data.notifications.filter((n: any) => !n.is_read)

            // On first load, mark all existing unread as "shown" so we only toast TRULY new ones
            if (isFirstLoad.current) {
                unread.forEach((n: any) => shownIds.current.add(n.id))
                isFirstLoad.current = false
                return
            }

            unread.forEach((n: any) => {
                if (!shownIds.current.has(n.id)) {
                    shownIds.current.add(n.id)

                    // Show green high-priority toast
                    toast.success(n.title, {
                        description: n.message,
                        icon: <Bell className="h-4 w-4 text-[hsl(var(--success))]" />,
                        duration: 5000,
                        action: n.link ? {
                            label: "View",
                            onClick: () => router.push(n.link as string)
                        } : undefined,
                        style: {
                            borderLeft: '4px solid hsl(var(--success))',
                        }
                    })
                }
            })
        }
    }, [data, user, router])

    return null
}
