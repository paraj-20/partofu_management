import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Edit3, Trash2, Check, X, Code, Palette, TrendingUp, Users, ChevronUp, ChevronDown } from "lucide-react"

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

export type PackageItem = {
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

interface PackageCardProps {
    pkg: PackageItem
    isAdmin: boolean
    activeCategory: string
    isFirst: boolean
    isLast: boolean
    onEdit: () => void
    onDelete: () => void
    onMove: (direction: 'up' | 'down') => void
    formatPrice: (priceVal: string | number | null | undefined) => string
}

export function PackageCard({
    pkg,
    isAdmin,
    activeCategory,
    isFirst,
    isLast,
    onEdit,
    onDelete,
    onMove,
    formatPrice,
}: PackageCardProps) {
    // Compute unique features across all tiers to create a comparison matrix
    const allFeatures: string[] = []
    pkg.tiers.forEach(tier => {
        tier.features.forEach(f => {
            if (!allFeatures.includes(f)) {
                allFeatures.push(f)
            }
        })
    })

    return (
        <AccordionItem
            value={`pkg-${pkg.id}`}
            className="border rounded-2xl bg-card overflow-hidden data-[state=open]:ring-2 ring-primary/40 transition-all duration-300 border-border shadow-sm group/item data-[state=open]:col-span-1 data-[state=open]:md:col-span-2 data-[state=open]:lg:col-span-3 flex flex-col"
        >
            <div className="flex flex-col relative flex-1">
                <AccordionTrigger className="w-full flex-1 p-6 hover:bg-secondary/10 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 relative flex flex-col items-start text-left gap-4 [&>svg]:absolute [&>svg]:bottom-7 [&>svg]:right-6 [&>svg]:text-muted-foreground/60 hover:[&>svg]:text-foreground [&>svg]:h-5 [&>svg]:w-5 transition-all">

                    <div className="flex flex-col items-start gap-5 flex-1 w-full z-0 pr-2">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${categoryColor(pkg.category)} transition-transform duration-300 group-hover/item:scale-105 shadow-sm`}>
                            {categoryIcon(pkg.category)}
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            <h3 className="text-foreground text-xl font-bold leading-snug line-clamp-2">{pkg.name}</h3>
                            {pkg.description ? (
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mt-1 min-h-[4.5rem]">{pkg.description}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mt-1 min-h-[4.5rem] capitalize flex items-center">
                                    {pkg.category} Package with custom configurations.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-auto pt-5 border-t border-border/50 w-full mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-md">{pkg.category}</span>
                        <span className="text-xs font-medium text-muted-foreground">{pkg.tiers.length} Tier{pkg.tiers.length !== 1 ? 's' : ''} Associated</span>
                    </div>
                </AccordionTrigger>

                {isAdmin && (
                    <div className="flex items-center gap-1.5 absolute top-5 right-5 z-10 opacity-0 group-hover/item:opacity-100 transition-all duration-200 focus-within:opacity-100">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/90 backdrop-blur-sm border border-border shadow-sm text-muted-foreground hover:text-primary disabled:opacity-50"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onMove('up')
                            }}
                            disabled={isFirst || activeCategory !== "all"}
                        >
                            <ChevronUp className="h-4 w-4" />
                            <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/90 backdrop-blur-sm border border-border shadow-sm text-muted-foreground hover:text-primary disabled:opacity-50"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onMove('down')
                            }}
                            disabled={isLast || activeCategory !== "all"}
                        >
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">Move down</span>
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/90 backdrop-blur-sm border border-border shadow-sm text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onEdit()
                            }}
                        >
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Edit package</span>
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-background/90 backdrop-blur-sm border border-border shadow-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onDelete()
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete package</span>
                        </Button>
                    </div>
                )}
            </div>

            <AccordionContent className="px-5 pb-5 pt-0 border-t border-border/50 bg-secondary/10">
                <div className="pt-4">
                    {pkg.description && (
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed max-w-4xl">{pkg.description}</p>
                    )}

                    {pkg.tiers.length === 0 ? (
                        <div className="text-center py-6 bg-card rounded-lg border border-border mt-2">
                            <p className="text-muted-foreground text-sm">No pricing tiers configured yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pkg.tiers.map((tier) => (
                                <div
                                    key={tier.id}
                                    className="border border-border/70 rounded-xl p-4 bg-card flex flex-col h-full shadow-sm hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="text-base font-bold text-foreground truncate pr-2">{tier.name}</h4>
                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                {formatPrice(tier.price)}
                                            </Badge>
                                            {tier.delivery_time && (
                                                <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase mt-0.5">
                                                    Est: {tier.delivery_time}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {tier.scope && (
                                        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2rem] leading-relaxed">
                                            {tier.scope}
                                        </p>
                                    )}

                                    <div className="flex-1 mt-1">
                                        <ul className="flex flex-col gap-2 mb-3">
                                            {(() => {
                                                const uniqueSorted = Array.from(new Set(allFeatures.map(f => f.trim()))).filter(Boolean);

                                                return uniqueSorted.map((f, i) => {
                                                    const hasFeature = tier.features.some(tf => tf.trim() === f)
                                                    return (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-2 text-xs font-medium"
                                                        >
                                                            {hasFeature ? (
                                                                <Check className="h-3.5 w-3.5 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                                                            ) : (
                                                                <X className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            <span className={hasFeature ? "text-foreground leading-snug" : "text-muted-foreground/60 leading-snug"}>{f}</span>
                                                        </li>
                                                    )
                                                })
                                            })()}
                                        </ul>
                                    </div>

                                    {tier.custom_fields && tier.custom_fields.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/60 mb-3">
                                            <h5 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Additional Details</h5>
                                            <div className="flex flex-col gap-2">
                                                {tier.custom_fields.map((cf, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs bg-secondary/30 rounded-md py-1.5 px-2.5">
                                                        <span className="text-muted-foreground font-medium">{cf.name}</span>
                                                        <span className="text-foreground font-semibold">
                                                            {cf.type === 'checkbox' ? (cf.value ? 'Yes' : 'No') : cf.value || '-'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {tier.ideal_for && (
                                        <div className="pt-3 border-t border-border/50 mt-auto">
                                            <p className="text-[10px] text-muted-foreground italic flex items-center leading-snug">
                                                <span className="font-bold not-italic mr-1.5 text-[9px] uppercase tracking-wider text-foreground">Best for:</span>
                                                {tier.ideal_for}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}
