"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PackageDialog } from "@/components/package-dialog"
import { toast } from "sonner"
import { Plus, Edit3, Trash2, Check, X, Code, Palette, TrendingUp, Users, ChevronUp, ChevronDown } from "lucide-react"
import { PackageCard, type PackageItem } from "@/components/package-card"
import { Accordion } from "@/components/ui/accordion"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PackagesPage() {
  const { user } = useAuth()
  const { data, mutate } = useSWR("/api/packages", fetcher)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPkg, setEditPkg] = useState<PackageItem | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const [currency, setCurrency] = useState("INR")
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [loadingCurrency, setLoadingCurrency] = useState(true)

  const { data: settingsData } = useSWR("/api/settings/currency", fetcher)

  useEffect(() => {
    if (settingsData?.currency) {
      setCurrency(settingsData.currency)
    }
  }, [settingsData])

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR")
        const data = await res.json()
        setRates(data.rates)
      } catch (error) {
        console.error("Failed to fetch rates:", error)
        toast.error("Failed to update exchange rates")
      } finally {
        setLoadingCurrency(false)
      }
    }
    fetchRates()
  }, [])

  async function handleCurrencyChange(newCurrency: string) {
    if (!isAdmin) return
    setCurrency(newCurrency)
    try {
      await fetch("/api/settings/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: newCurrency }),
      })
      toast.success(`Currency updated to ${newCurrency}`)
      globalMutate("/api/settings/currency")
    } catch {
      toast.error("Failed to save currency setting")
    }
  }

  function formatPrice(priceVal: string | number | null | undefined): string {
    if (priceVal === null || priceVal === undefined || priceVal === "") return "Custom"
    const priceStr = String(priceVal)
    if (!priceStr.trim()) return "Custom"

    // Check if price is numeric (e.g. "15000" or "15,000")
    const numericPart = priceStr.replace(/,/g, "").replace(/[^0-9.]/g, "")
    const numericVal = parseFloat(numericPart)

    if (isNaN(numericVal)) return priceStr // Return original if not a number (e.g. "Contact us")

    // If we have rates and target currency isn't INR (assuming base is INR based on prompt)
    if (rates && currency !== "INR") {
      const rate = rates[currency]
      if (rate) {
        const converted = numericVal * rate
        // Round nicely: 
        // > 1000 -> no decimals
        // < 1000 -> 2 decimals
        const finalVal = converted > 1000 ? Math.round(converted) : converted.toFixed(2)

        const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency
        return `${symbol}${Number(finalVal).toLocaleString()}`
      }
    }

    // Default INR format
    return `₹${numericVal.toLocaleString('en-IN')}`
  }

  const packages: PackageItem[] = data?.packages || []
  const isAdmin = user?.role === "admin"

  const filteredPackages =
    activeCategory === "all"
      ? packages
      : packages.filter((p) => p.category === activeCategory)

  async function handleDelete(packageId: number) {
    if (!confirm("Delete this package and all its tiers?")) return
    try {
      const res = await fetch("/api/packages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Package deleted")
      mutate()
    } catch {
      toast.error("Failed to delete")
    }
  }

  async function handleMovePackage(currentIdx: number, direction: 'up' | 'down') {
    if (!isAdmin) return
    const newIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1
    if (newIdx < 0 || newIdx >= packages.length) return

    const newPackages = [...packages]
    const temp = newPackages[currentIdx]
    newPackages[currentIdx] = newPackages[newIdx]
    newPackages[newIdx] = temp

    // Optimistic update
    mutate({ ...data, packages: newPackages }, false)

    try {
      const packageIds = newPackages.map(p => p.id)
      const res = await fetch("/api/packages/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageIds }),
      })
      if (!res.ok) throw new Error()
      mutate()
    } catch {
      toast.error("Failed to reorder packages")
      mutate() // revert
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Packages</h1>
          <p className="text-muted-foreground mt-1">View and manage service packages and pricing tiers.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/50 p-1 px-2 rounded-lg border border-border/50">
              <span className="text-xs font-medium text-muted-foreground mr-1">Currency:</span>
              <Select value={currency} onValueChange={handleCurrencyChange} disabled={loadingCurrency}>
                <SelectTrigger className="h-8 w-[80px] text-xs bg-transparent border-none focus:ring-0 shadow-none px-0">
                  <SelectValue placeholder="INR" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditPkg(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Package
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="bg-secondary">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="tech">Tech</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="consulting">Consulting</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredPackages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No packages found.</p>
          {isAdmin && (
            <Button
              variant="ghost"
              className="mt-4 text-primary"
              onClick={() => {
                setEditPkg(null)
                setDialogOpen(true)
              }}
            >
              Create your first package
            </Button>
          )}
        </div>
      ) : (
        <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredPackages.map((pkg, idx) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg as any}
              isAdmin={isAdmin}
              activeCategory={activeCategory}
              isFirst={packages.findIndex(p => p.id === pkg.id) === 0}
              isLast={packages.findIndex(p => p.id === pkg.id) === packages.length - 1}
              onEdit={() => {
                setEditPkg(pkg as any)
                setDialogOpen(true)
              }}
              onDelete={() => handleDelete(pkg.id)}
              onMove={(direction) => handleMovePackage(packages.findIndex(p => p.id === pkg.id), direction)}
              formatPrice={formatPrice}
            />
          ))}
        </Accordion>
      )}

      {isAdmin && (
        <PackageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          pkg={editPkg}
          onSuccess={() => {
            mutate()
            globalMutate("/api/notifications")
          }}
        />
      )}
    </div>
  )
}
