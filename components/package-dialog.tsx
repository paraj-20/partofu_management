"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, X, Trash2, ChevronUp, ChevronDown } from "lucide-react"

type Tier = {
  name: string
  price: string
  features: string[]
  scope: string
  idealFor: string
}

type PackageData = {
  id?: number
  name: string
  category: string
  description: string
  tiers?: {
    name: string
    price: string
    features: string[]
    scope: string
    ideal_for: string
  }[]
}

export function PackageDialog({
  open,
  onOpenChange,
  pkg,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg?: PackageData | null
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("tech")
  const [description, setDescription] = useState("")
  const [tiers, setTiers] = useState<Tier[]>([{ name: "", price: "", features: [""], scope: "", idealFor: "" }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pkg) {
      setName(pkg.name || "")
      setCategory(pkg.category || "tech")
      setDescription(pkg.description || "")
      setTiers(
        pkg.tiers?.map((t) => ({
          name: t.name,
          price: t.price,
          features: t.features && t.features.length > 0 ? t.features : [""],
          scope: t.scope || "",
          idealFor: t.ideal_for || "",
        })) || [{ name: "", price: "", features: [""], scope: "", idealFor: "" }]
      )
    } else {
      setName("")
      setCategory("tech")
      setDescription("")
      setTiers([{ name: "", price: "", features: [""], scope: "", idealFor: "" }])
    }
  }, [pkg, open])

  function addTier() {
    setTiers([...tiers, { name: "", price: "", features: [""], scope: "", idealFor: "" }])
  }

  function removeTier(index: number) {
    setTiers(tiers.filter((_, i) => i !== index))
  }

  function updateTier(index: number, field: keyof Tier, value: any) {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  function addFeature(tierIndex: number) {
    const newTiers = [...tiers]
    newTiers[tierIndex].features.push("")
    setTiers(newTiers)
  }

  function removeFeature(tierIndex: number, featureIndex: number) {
    const newTiers = [...tiers]
    newTiers[tierIndex].features = newTiers[tierIndex].features.filter((_, i) => i !== featureIndex)
    setTiers(newTiers)
  }

  function updateFeature(tierIndex: number, featureIndex: number, value: string) {
    const newTiers = [...tiers]
    newTiers[tierIndex].features[featureIndex] = value
    setTiers(newTiers)
  }

  function moveFeature(tierIndex: number, featureIndex: number, direction: 'up' | 'down') {
    const newTiers = [...tiers]
    const features = [...newTiers[tierIndex].features]
    if (direction === 'up' && featureIndex > 0) {
      [features[featureIndex], features[featureIndex - 1]] = [features[featureIndex - 1], features[featureIndex]]
    } else if (direction === 'down' && featureIndex < features.length - 1) {
      [features[featureIndex], features[featureIndex + 1]] = [features[featureIndex + 1], features[featureIndex]]
    }
    newTiers[tierIndex].features = features
    setTiers(newTiers)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Package name is required")
      return
    }
    setLoading(true)

    try {
      const sanitizedTiers = tiers
        .filter((t) => t.name.trim())
        .map(t => ({
          ...t,
          features: t.features.filter(f => f.trim())
        }))

      const body = {
        ...(pkg?.id ? { packageId: pkg.id } : {}),
        name,
        category,
        description,
        tiers: sanitizedTiers,
      }

      const res = await fetch("/api/packages", {
        method: pkg?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()
      toast.success(pkg?.id ? "Package updated" : "Package created")
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[85vh] overflow-y-auto cyber-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl font-bold tracking-tight">
            {pkg?.id ? "Edit Package" : "Create Package"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground font-medium">Package Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Development"
                className="bg-secondary/50 border-border text-foreground focus:ring-1 ring-primary/30"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/50 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border border-2">
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="branding">Branding</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground font-medium">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give a brief overview of what this package offers..."
              className="bg-secondary/50 border-border text-foreground min-h-[80px] focus:ring-1 ring-primary/30"
            />
          </div>

          {/* Tiers Container */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-foreground text-lg font-bold tracking-tight">Tiers & Pricing</h3>
              <Button type="button" variant="outline" size="sm" onClick={addTier} className="text-primary hover:bg-primary/10 border-primary/20">
                <Plus className="h-4 w-4 mr-1.5" /> Add Tier
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {tiers.map((tier, i) => (
                <div key={i} className="border border-border/60 rounded-xl p-5 bg-secondary/10 relative group hover:border-primary/30 transition-colors">
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tier Name</Label>
                      <Input
                        value={tier.name}
                        onChange={(e) => updateTier(i, "name", e.target.value)}
                        placeholder="e.g. Starter"
                        className="bg-secondary border-border text-foreground h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</Label>
                      <Input
                        value={tier.price}
                        onChange={(e) => updateTier(i, "price", e.target.value)}
                        placeholder="e.g. 15,000 INR"
                        className="bg-secondary border-border text-foreground h-9"
                      />
                    </div>
                  </div>

                  {/* Features Management */}
                  <div className="flex flex-col gap-2 mb-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Features (Order matters for comparison)</Label>
                    <div className="flex flex-col gap-2">
                      {tier.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex gap-2 items-center">
                          <div className="flex flex-col gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => moveFeature(i, fIndex, 'up')}
                              disabled={fIndex === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                              <span className="sr-only">Move up</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => moveFeature(i, fIndex, 'down')}
                              disabled={fIndex === tier.features.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                              <span className="sr-only">Move down</span>
                            </Button>
                          </div>
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(i, fIndex, e.target.value)}
                            placeholder={`Feature #${fIndex + 1}`}
                            className="bg-secondary border-border text-foreground h-9 flex-1"
                          />
                          {tier.features.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeFeature(i, fIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit text-primary h-8 hover:bg-primary/5 -mt-1 px-2"
                        onClick={() => addFeature(i)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Feature
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scope</Label>
                      <Input
                        value={tier.scope}
                        onChange={(e) => updateTier(i, "scope", e.target.value)}
                        placeholder="What's included?"
                        className="bg-secondary border-border text-foreground h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ideal For</Label>
                      <Input
                        value={tier.idealFor}
                        onChange={(e) => updateTier(i, "idealFor", e.target.value)}
                        placeholder="Who is this for?"
                        className="bg-secondary border-border text-foreground h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-border mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {pkg?.id ? "Save Changes" : "Create Package"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
