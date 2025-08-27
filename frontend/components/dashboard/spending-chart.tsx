"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface SpendingChartProps {
  data: Record<string, Record<string, number>>
  viewType: "daily" | "weekly" | "monthly"
}

const CATEGORY_COLORS = {
  "Food & Dining": "#f97316",
  "Transport & Mobility": "#3b82f6", 
  "Bills & Utilities": "#8b5cf6",
  "Shopping & Entertainment": "#ec4899",
  "Other": "#6b7280",
}

export function SpendingChart({ data, viewType }: SpendingChartProps) {
  // Get all unique categories
  const allCategories = new Set<string>()
  Object.values(data).forEach(periodData => {
    Object.keys(periodData).forEach(category => {
      if (category !== "Income") { // Exclude income from spending chart
        allCategories.add(category)
      }
    })
  })

  const getMaxPeriods = () => {
    if (viewType === "daily") return 90 // Show up to 90 days (3 months)
    if (viewType === "weekly") return 20 // Show up to 20 weeks
    return 12 // Show up to 12 months
  }

  const chartData = Object.entries(data)
    .map(([period, categories]) => {
      const periodData: any = { period }
      allCategories.forEach(category => {
        periodData[category] = categories[category] || 0
      })
      return periodData
    })
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-getMaxPeriods()) // Show appropriate number of periods based on view type

  const formatXAxis = (value: string) => {
    if (viewType === "daily") {
      return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    } else if (viewType === "weekly") {
      return value.replace("W", "Week ")
    } else {
      return new Date(value + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" })
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No data available for the selected period
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="period" tickFormatter={formatXAxis} fontSize={12} />
          <YAxis tickFormatter={(value) => formatCurrency(value).replace("Rp", "")} fontSize={12} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name,
            ]}
            labelFormatter={(label) => `Period: ${formatXAxis(label)}`}
          />
          <Legend />
          {Array.from(allCategories).map((category) => (
            <Bar 
              key={category}
              dataKey={category} 
              stackId="spending"
              fill={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#6b7280"} 
              name={category} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
