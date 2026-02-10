"use client"

import React from "react"

import useSWR from "swr"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CheckSquare, Package, Clock, TrendingUp, AlertCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  description?: string
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: statsData } = useSWR("/api/stats", fetcher)
  const { data: activityData } = useSWR("/api/activity", fetcher)

  const stats = statsData?.stats
  const logs = activityData?.logs || []

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {"Here's what's happening with your team today."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Members"
          value={stats?.totalUsers ?? "..."}
          icon={Users}
          description={stats?.pendingUsers ? `${stats.pendingUsers} pending` : undefined}
        />
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks ?? "..."}
          icon={CheckSquare}
          description={`${stats?.completedTasks ?? 0} completed`}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressTasks ?? "..."}
          icon={TrendingUp}
        />
        <StatCard
          title="Packages"
          value={stats?.totalPackages ?? "..."}
          icon={Package}
        />
      </div>

      {/* Pending Approvals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Users Alert */}
        {user?.role === "admin" && stats?.pendingUsers > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[hsl(var(--warning))]" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You have{" "}
                <span className="text-foreground font-semibold">{stats.pendingUsers}</span>{" "}
                user{stats.pendingUsers > 1 ? "s" : ""} waiting for approval.
              </p>
              <a
                href="/dashboard/users"
                className="text-primary text-sm hover:underline mt-2 inline-block"
              >
                Review now
              </a>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            ) : (
              <div className="flex flex-col gap-3">
                {logs.slice(0, 8).map((log: { id: number; user_name: string; action: string; details: string; created_at: string }) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.user_name || "System"}</span>{" "}
                        <span className="text-muted-foreground">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">To Do</span>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {stats?.todoTasks ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <Badge className="bg-primary/20 text-primary border-0">
                  {stats?.inProgressTasks ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-0">
                  {stats?.completedTasks ?? 0}
                </Badge>
              </div>
              {stats?.totalTasks > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>
                      {Math.round(((stats?.completedTasks ?? 0) / stats.totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.round(((stats?.completedTasks ?? 0) / stats.totalTasks) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
