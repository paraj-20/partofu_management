"use client"

import useSWR from "swr"
import { useRouter } from "next/navigation"

export type User = {
  userId: number
  email: string
  name: string
  role: "admin" | "member"
  status: string
  avatarUrl: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "same-origin" })
  if (!res.ok) {
    const info = await res.json().catch(() => ({}))
    const error = new Error("Not authenticated") as Error & { status: number; info: unknown }
    error.status = res.status
    error.info = info
    throw error
  }
  return res.json()
}

export function useAuth() {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useSWR<{ user: User }>("/api/auth/session", fetcher, {
    revalidateOnFocus: true,
    shouldRetryOnError: true,
    errorRetryCount: 2,
    errorRetryInterval: 500,
    dedupingInterval: 2000,
  })

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    mutate(undefined, false)
    router.push("/login")
  }

  return {
    user: data?.user ?? null,
    isLoading,
    isError: !!error,
    logout,
    mutate,
  }
}
