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
import { Plus, Edit3, Trash2, Check, X, Code, Palette, TrendingUp, Users } from "lucide-react"

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

type CustomField = {
  id: string
  name: string
  type: 'text' | 'checkbox' | 'number' | 'dropdown'
  value: any
}

type PackageTier = {
  id: number
  name: string
  price: string
  features: string[]
  scope: string
  ideal_for: string
  add_ons: string[]
  included: string[]
  not_included: string[]
  delivery_time: string
  custom_fields: CustomField[]
}

type PackageItem = {
  id: number
  name: string
  category: string
  description: string
  is_active: boolean
  tiers: PackageTier[]
  created_at: string
}

function categoryIcon(category: string) {
  switch (category) {
    case "tech":
      return <Code className="h-4 w-4" />
    case "branding":
      return <Palette className="h-4 w-4" />
    case "growth":
      return <TrendingUp className="h-4 w-4" />
    case "consulting":
      return <Users className="h-4 w-4" />
    default:
      return <Code className="h-4 w-4" />
  }
}

function categoryColor(category: string) {
  switch (category) {
    case "tech":
      return "bg-primary/20 text-primary"
    case "branding":
      return "bg-[hsl(var(--chart-3))]/20 text-[hsl(var(--chart-3))]"
    case "growth":
      return "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
    case "consulting":
      return "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

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
        <div className="flex flex-col gap-6">
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${categoryColor(pkg.category)}`}>
                      {categoryIcon(pkg.category)}
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-lg">{pkg.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{pkg.category}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEditPkg(pkg)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                        <span className="sr-only">Edit package</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete package</span>
                      </Button>
                    </div>
                  )}
                </div>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                )}
              </CardHeader>
              <CardContent>
                {pkg.tiers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tiers configured</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      // Compute unique features across all tiers to create a comparison matrix
                      // We preserve the order by looking at tiers in sequence
                      const allFeatures: string[] = []
                      pkg.tiers.forEach(tier => {
                        tier.features.forEach(f => {
                          if (!allFeatures.includes(f)) {
                            allFeatures.push(f)
                          }
                        })
                      })

                      return pkg.tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className="border border-border rounded-lg p-4 bg-secondary/30 flex flex-col h-full"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-foreground">{tier.name}</h4>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="text-primary border-primary/30">
                                {formatPrice(tier.price)}
                              </Badge>
                              {tier.delivery_time && (
                                <span className="text-xs font-medium text-muted-foreground mt-0.5">
                                  Est: {tier.delivery_time}
                                </span>
                              )}
                            </div>
                          </div>

                          {tier.scope && (
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]">
                              {tier.scope}
                            </p>
                          )}

                          <div className="flex-1">
                            <ul className="flex flex-col gap-2.5 mb-4">
                              {(() => {
                                // Double check uniqueness with trimmed values
                                const uniqueSorted = Array.from(new Set(allFeatures.map(f => f.trim()))).filter(Boolean);

                                return uniqueSorted.map((f, i) => {
                                  const hasFeature = tier.features.some(tf => tf.trim() === f)
                                  return (
                                    <li
                                      key={i}
                                      className="flex items-start gap-2 text-xs text-foreground font-medium"
                                    >
                                      {hasFeature ? (
                                        <Check className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                                      )}
                                      <span className="leading-tight">{f}</span>
                                    </li>
                                  )
                                })
                              })()}
                            </ul>
                          </div>

                          {/* Custom Fields Display */}
                          {tier.custom_fields && tier.custom_fields.length > 0 && (
                            <div className="mt-2 pt-3 border-t border-border/40 mb-4">
                              <h5 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Details</h5>
                              <div className="flex flex-col gap-2">
                                {tier.custom_fields.map((cf, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">{cf.name}</span>
                                    <span className="text-foreground font-medium">
                                      {cf.type === 'checkbox' ? (cf.value ? 'Yes' : 'No') : cf.value || '-'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {tier.ideal_for && (
                            <div className="pt-3 border-t border-border/50 mt-auto">
                              <p className="text-[10px] text-muted-foreground italic">
                                <span className="font-semibold not-italic mr-1 text-[9px] uppercase tracking-wider">Best for:</span>
                                {tier.ideal_for}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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
