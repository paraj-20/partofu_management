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

type CustomField = {
  name: string
  type: 'text' | 'checkbox' | 'number' | 'dropdown'
  value: any
  options?: string
}

type Tier = {
  name: string
  price: string
  features: string[]
  scope: string
  idealFor: string
  deliveryTime: string
  customFields: CustomField[]
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
    delivery_time: string
    custom_fields: CustomField[]
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
  const [tiers, setTiers] = useState<Tier[]>([{ name: "", price: "", features: [""], scope: "", idealFor: "", deliveryTime: "3 days", customFields: [] }])
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
          deliveryTime: t.delivery_time || "3 days",
          customFields: t.custom_fields || [],
        })) || [{ name: "", price: "", features: [""], scope: "", idealFor: "", deliveryTime: "3 days", customFields: [] }]
      )
    } else {
      setName("")
      setCategory("tech")
      setDescription("")
      setTiers([{ name: "", price: "", features: [""], scope: "", idealFor: "", deliveryTime: "3 days", customFields: [] }])
    }
  }, [pkg, open])

  function addTier() {
    setTiers([...tiers, { name: "", price: "", features: [""], scope: "", idealFor: "", deliveryTime: "3 days", customFields: [] }])
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

  function addCustomField(tierIndex: number) {
    const newTiers = [...tiers]
    newTiers[tierIndex].customFields.push({ name: "", type: 'text', value: "" })
    setTiers(newTiers)
  }

  function removeCustomField(tierIndex: number, fieldIndex: number) {
    const newTiers = [...tiers]
    newTiers[tierIndex].customFields = newTiers[tierIndex].customFields.filter((_, i) => i !== fieldIndex)
    setTiers(newTiers)
  }

  function updateCustomField(tierIndex: number, fieldIndex: number, updates: Partial<CustomField>) {
    const newTiers = [...tiers]
    newTiers[tierIndex].customFields[fieldIndex] = { ...newTiers[tierIndex].customFields[fieldIndex], ...updates }
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
                        value={tier.name || ""}
                        onChange={(e) => updateTier(i, "name", e.target.value)}
                        placeholder="e.g. Starter"
                        className="bg-secondary border-border text-foreground h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</Label>
                      <Input
                        value={tier.price || ""}
                        onChange={(e) => updateTier(i, "price", e.target.value)}
                        placeholder="e.g. 15,000 INR"
                        className="bg-secondary border-border text-foreground h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Delivery Time</Label>
                      <Select value={tier.deliveryTime} onValueChange={(val) => updateTier(i, "deliveryTime", val)}>
                        <SelectTrigger className="bg-secondary border-border text-foreground h-9">
                          <SelectValue placeholder="Select delivery time" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border border-2 max-h-[300px] overflow-y-auto">
                          <SelectItem value="1 day">1 day</SelectItem>
                          <SelectItem value="2 days">2 days</SelectItem>
                          <SelectItem value="3 days">3 days</SelectItem>
                          <SelectItem value="4 days">4 days</SelectItem>
                          <SelectItem value="5 days">5 days</SelectItem>
                          <SelectItem value="7 days">7 days</SelectItem>
                          <SelectItem value="10 days">10 days</SelectItem>
                          <SelectItem value="15 days">15 days</SelectItem>
                          <SelectItem value="20 days">20 days</SelectItem>
                          <SelectItem value="30 days">30 days</SelectItem>
                          <SelectItem value="1 month">1 month</SelectItem>
                          <SelectItem value="2 months">2 months</SelectItem>
                          <SelectItem value="3 months">3 months</SelectItem>
                          <SelectItem value="4 months">4 months</SelectItem>
                          <SelectItem value="5 months">5 months</SelectItem>
                          <SelectItem value="6 months">6 months</SelectItem>
                          <SelectItem value="1 year">1 year</SelectItem>
                        </SelectContent>
                      </Select>
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

                  {/* Custom Fields Management */}
                  <div className="flex flex-col gap-2 mb-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Fields</Label>
                    <div className="flex flex-col gap-3">
                      {tier.customFields.map((field, cfIndex) => (
                        <div key={cfIndex} className="flex flex-col gap-2 p-3 bg-secondary/30 rounded-lg border border-border/40">
                          <div className="flex gap-2 items-center">
                            <Input
                              value={field.name || ""}
                              onChange={(e) => updateCustomField(i, cfIndex, { name: e.target.value })}
                              placeholder="Field Label (e.g. Revisions)"
                              className="bg-secondary border-border text-foreground h-8 flex-1 text-sm"
                            />
                            <Select
                              value={field.type}
                              onValueChange={(val: any) => updateCustomField(i, cfIndex, { type: val, value: val === 'checkbox' ? false : "" })}
                            >
                              <SelectTrigger className="bg-secondary border-border text-foreground h-8 w-[110px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border border-2">
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="dropdown">Dropdown</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeCustomField(i, cfIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="pl-1">
                            {field.type === 'text' && (
                              <Input
                                value={field.value || ""}
                                onChange={(e) => updateCustomField(i, cfIndex, { value: e.target.value })}
                                placeholder="Value"
                                className="bg-secondary border-border text-foreground h-8 text-sm"
                              />
                            )}
                            {field.type === 'number' && (
                              <Input
                                type="number"
                                value={field.value ?? ""}
                                onChange={(e) => updateCustomField(i, cfIndex, { value: e.target.value })}
                                placeholder="0"
                                className="bg-secondary border-border text-foreground h-8 text-sm"
                              />
                            )}
                            {field.type === 'checkbox' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!field.value}
                                  onChange={(e) => updateCustomField(i, cfIndex, { value: e.target.checked })}
                                  className="h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                                />
                                <span className="text-xs text-muted-foreground">Enabled by default</span>
                              </div>
                            )}
                            {field.type === 'dropdown' && (
                              <div className="flex flex-col gap-2">
                                <Input
                                  value={field.options || ""}
                                  onChange={(e) => updateCustomField(i, cfIndex, { options: e.target.value })}
                                  placeholder="Options (comma separated)"
                                  className="bg-secondary border-border text-foreground h-8 text-sm"
                                />
                                {field.options && (
                                  <Select value={field.value} onValueChange={(val) => updateCustomField(i, cfIndex, { value: val })}>
                                    <SelectTrigger className="bg-secondary border-border text-foreground h-8 text-sm">
                                      <SelectValue placeholder="Select default value" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border border-2 max-h-[200px] overflow-y-auto">
                                      {field.options.split(',').map(opt => opt.trim()).filter(Boolean).map((opt, idx) => (
                                        <SelectItem key={idx} value={opt}>{opt}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit text-primary h-8 hover:bg-primary/5 px-2 border-primary/20"
                        onClick={() => addCustomField(i)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Field
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
