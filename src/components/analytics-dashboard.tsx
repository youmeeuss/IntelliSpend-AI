"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts"
import { BarChart2, Calendar, TrendingUp, Lightbulb, Grid, Sparkles, Filter } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppContext } from "@/context/AppContext"
import { formatCurrency } from "@/lib/utils"

export default function AnalyticsDashboard() {
  const { transactions } = useAppContext()
  const [yearFilter, setYearFilter] = useState("2024")
  const [monthFilter, setMonthFilter] = useState("all")

  const monthsMap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // 1. Filter transactions dynamically based on selected date parameters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const parts = t.date.split("-")
        if (parts.length >= 2) {
          const year = parts[0]
          const monthNum = parseInt(parts[1], 10).toString()
          const matchesYear = year === yearFilter
          const matchesMonth = monthFilter === "all" || monthNum === monthFilter
          return matchesYear && matchesMonth
        }
      } catch (e) {}
      return false
    })
  }, [transactions, yearFilter, monthFilter])

  // 2. Radar Chart - Category Outflow Weights Comparison
  const radarData = useMemo(() => {
    const categoriesList = ["Groceries", "Transport", "Entertainment", "Bills", "Shopping", "Food"]
    const totals: Record<string, number> = {}
    categoriesList.forEach(c => { totals[c] = 0 })

    filteredTransactions.forEach(t => {
      if (totals[t.category] !== undefined && t.amount > 0) {
        totals[t.category] += t.amount
      }
    })

    return Object.entries(totals).map(([subject, amount]) => ({
      subject,
      amount: parseFloat(amount.toFixed(2)),
      fullMark: 500
    }))
  }, [filteredTransactions])

  // 3. Area Chart - Month-Over-Month Outflow Trends and OLS Forecast
  const trendData = useMemo(() => {
    // Group spend by month index
    const monthlySpend: number[] = Array(12).fill(0)

    // Add user transaction aggregates
    transactions.forEach(t => {
      try {
        const parts = t.date.split("-")
        if (parts[0] === yearFilter) {
          const monthIdx = parseInt(parts[1], 10) - 1
          if (monthIdx >= 0 && monthIdx < 12) {
            // Add user expenses to month sums
            if (t.amount > 0) {
              monthlySpend[monthIdx] += t.amount
            }
          }
        }
      } catch (e) {}
    })

    // Calculate OLS linear regression slope for months with spending
    const activeMonths = monthlySpend.map((val, idx) => ({ val, idx })).filter(m => m.val > 0)
    let slope = 100 // default rise
    let intercept = 4000

    if (activeMonths.length > 1) {
      const n = activeMonths.length
      const x = activeMonths.map(m => m.idx + 1)
      const y = activeMonths.map(m => m.val)
      
      const xMean = x.reduce((a, b) => a + b, 0) / n
      const yMean = y.reduce((a, b) => a + b, 0) / n

      let num = 0
      let den = 0
      for (let i = 0; i < n; i++) {
        num += (x[i] - xMean) * (y[i] - yMean)
        den += Math.pow(x[i] - xMean, 2)
      }
      slope = den !== 0 ? num / den : 0
      intercept = yMean - slope * xMean
    }

    // Compile 12 months data
    return monthsMap.map((month, idx) => {
      const actual = monthlySpend[idx]
      let type = "Actual"
      let value = actual

      // If no actual data recorded and is in the future, project trend
      if (actual === 0 && idx >= activeMonths.length) {
        type = "Forecasted"
        value = Math.max(0, parseFloat((slope * (idx + 1) + intercept).toFixed(2)))
      }

      return {
        month,
        outflow: value,
        type
      }
    })
  }, [transactions, yearFilter])

  // 4. Custom Heatmap - Day-Of-Week Spending Density
  const heatmapData = useMemo(() => {
    // Grid: Weekday (Mon-Sun) vs Week Index of the Month (0 to 4)
    // 0: Mon, 1: Tue, ..., 6: Sun
    const grid: number[][] = Array(5).fill(0).map(() => Array(7).fill(0))

    filteredTransactions.forEach(t => {
      try {
        const date = new Date(t.date)
        const day = date.getDay() // 0 is Sunday, 1 is Monday...
        // Map to Mon-Sun: Mon (0) to Sun (6)
        const dayIndex = day === 0 ? 6 : day - 1
        
        // Week index (0-4)
        const weekIndex = Math.min(4, Math.floor((date.getDate() - 1) / 7))
        grid[weekIndex][dayIndex] += t.amount
      } catch (e) {}
    })

    // Find max value to scale color opacities
    let maxVal = 1
    grid.forEach(row => {
      row.forEach(val => {
        if (val > maxVal) maxVal = val
      })
    })

    return { grid, maxVal }
  }, [filteredTransactions])

  // 5. Automated AI Insights Generation
  const aiInsights = useMemo(() => {
    const list: string[] = []

    if (filteredTransactions.length === 0) {
      return ["No transactions recorded matching the selected year and month parameters. Add transactions to generate active insights."]
    }

    const primaryCurrency = filteredTransactions[0]?.currency || "USD"

    // Insight 1: Category Dominance
    const categoryTotals: Record<string, number> = {}
    filteredTransactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
    const sorted = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1])
    const topCategory = sorted[0]
    if (topCategory && topCategory[1] > 0) {
      const totalSpend = filteredTransactions.reduce((s, tx) => s + tx.amount, 0)
      const pct = ((topCategory[1] / totalSpend) * 100).toFixed(1)
      list.push(
        `Category Concentration: **${topCategory[0]}** represents **${pct}%** of all spending in this period. Setting a category cap is recommended.`
      )
    }

    // Insight 2: Weekend Spending Surges
    let weekendSum = 0, weekendCount = 0
    let weekdaySum = 0, weekdayCount = 0

    filteredTransactions.forEach(t => {
      try {
        const day = new Date(t.date).getDay()
        if (day === 0 || day === 6) {
          weekendSum += t.amount
          weekendCount++
        } else {
          weekdaySum += t.amount
          weekdayCount++
        }
      } catch (e) {}
    })

    const avgWeekend = weekendCount > 0 ? weekendSum / weekendCount : 0
    const avgWeekday = weekdayCount > 0 ? weekdaySum / weekdayCount : 0

    if (avgWeekend > avgWeekday && avgWeekday > 0) {
      const pctIncrease = (((avgWeekend - avgWeekday) / avgWeekday) * 100).toFixed(0)
      list.push(
        `Weekend Surge: Average transaction sizes are **${pctIncrease}% larger** on weekends (Sat-Sun) compared to weekdays. Restrain impulse leisure spending.`
      )
    } else if (avgWeekday > 0) {
      list.push("Spend Frequency: Outflows are evenly distributed across the weekly cycle. Keep monitoring recurring weekday card sweeps.")
    }

    // Insight 3: Bills and Subscriptions
    const billItems = filteredTransactions.filter(t => t.category === "Bills")
    if (billItems.length > 0) {
      const billSum = billItems.reduce((s, t) => s + t.amount, 0)
      list.push(
        `Fixed Outflows: You have **${billItems.length} recurring subscription statement bills**, totaling **${formatCurrency(billSum, primaryCurrency)}** this period.`
      )
    }

    // Insight 4: Dynamic Budget Score Warning
    const totalOutflow = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    if (totalOutflow > 5000) {
      list.push("Outflow Velocity: Higher-than-average monthly burn rate. Consider checking the AI investment recommender to lock away surplus capital.")
    } else {
      list.push("Capital Reserves: Outflow velocity is within conservative parameters. You are ready to increase SIP portfolios.")
    }

    return list
  }, [filteredTransactions])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient flex items-center gap-2">
            <BarChart2 className="h-8 w-8 text-cyan-400" />
            Advanced Analytics Console
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Statistical category comparisons, calendar intensity heatmaps, OLS regression trend forecasting, and smart AI statements.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5 shrink-0">
          <Filter className="h-4 w-4 text-cyan-400 ml-1" />
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-24 bg-black/30 border-white/5 h-8 text-xs text-foreground focus-visible:ring-[#00F0FF]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-28 bg-black/30 border-white/5 h-8 text-xs text-foreground focus-visible:ring-[#00F0FF]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
              <SelectItem value="all">All Months</SelectItem>
              {monthsMap.map((m, idx) => (
                <SelectItem key={m} value={(idx + 1).toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Radar category comparison */}
        <Card className="lg:col-span-5 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Category Balance Radar</CardTitle>
            <CardDescription className="text-xs">Outflow distribution across category subjects</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {filteredTransactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" fontSize={9} />
                  <Radar
                    name="Spending"
                    dataKey="amount"
                    stroke="#00F0FF"
                    fill="#00F0FF"
                    fillOpacity={0.2}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#111625", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                    formatter={(val) => [`$${val}`, "Outflow"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-muted-foreground">No ledger transactions fit these boundaries.</div>
            )}
          </CardContent>
          <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            Radar charts map balance. Spike directions indicate areas to enforce spending ceilings.
          </CardFooter>
        </Card>

        {/* Area Trend Line analysis */}
        <Card className="lg:col-span-7 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">MoM Outflow Trend Analysis</CardTitle>
            </div>
            <CardDescription className="text-xs">Actual historical spending compared to OLS linear projections</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111625", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  formatter={(val, name, props: any) => [`$${val}`, props.payload.type]}
                />
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="outflow" 
                  stroke="#00F0FF" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#trendGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
          <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex justify-between text-[10px] text-muted-foreground">
            <span>Model Projection Mode</span>
            <span className="text-purple-400 font-semibold">OLS Linear Trend</span>
          </CardFooter>
        </Card>
      </div>

      {/* Row 2: Heatmap and AI Insights */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Heatmap Grid */}
        <Card className="lg:col-span-6 border-white/5 bg-card/45 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Grid className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Spending Intensity Heatmap</CardTitle>
            </div>
            <CardDescription className="text-xs">Calendar day spending density inside selected months</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Heatmap Matrix */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground font-bold">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
              <div className="space-y-1">
                {heatmapData.grid.map((week, wIdx) => (
                  <div key={`week-${wIdx}`} className="grid grid-cols-7 gap-1">
                    {week.map((dayAmount, dIdx) => {
                      // Scale color opacity based on spend
                      const pct = heatmapData.maxVal > 0 ? dayAmount / heatmapData.maxVal : 0
                      const bgStyle = dayAmount > 0 
                        ? `rgba(0, 240, 255, ${Math.max(0.1, Math.min(0.85, pct))})`
                        : "rgba(255, 255, 255, 0.02)"
                      const borderStyle = dayAmount > 0
                        ? "rgba(0, 240, 255, 0.25)"
                        : "rgba(255, 255, 255, 0.02)"

                      return (
                        <div 
                          key={`day-${dIdx}`}
                          style={{ backgroundColor: bgStyle, borderColor: borderStyle }}
                          className="aspect-square rounded border flex items-center justify-center transition-all duration-300 hover:scale-105 group relative cursor-pointer"
                        >
                          {dayAmount > 0 && (
                            <span className="text-[8px] font-bold text-[#0A0E17] opacity-0 group-hover:opacity-100 transition-all duration-300">
                              ${dayAmount.toFixed(0)}
                            </span>
                          )}
                          
                          {/* Tooltip trigger */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#111625] border border-white/5 p-1 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-20 whitespace-nowrap mb-1">
                            {dayAmount > 0 ? `Spend: $${dayAmount.toFixed(2)}` : "No Activity"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 text-[10px] text-muted-foreground leading-relaxed flex items-center justify-between">
            <span>Low Intensity</span>
            <div className="flex gap-0.5">
              <span className="h-2 w-2 rounded bg-cyan-500/10" />
              <span className="h-2 w-2 rounded bg-cyan-500/30" />
              <span className="h-2 w-2 rounded bg-cyan-500/50" />
              <span className="h-2 w-2 rounded bg-cyan-500/80" />
            </div>
            <span>High Intensity</span>
          </CardFooter>
        </Card>

        {/* AI Insights Card */}
        <Card className="lg:col-span-6 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Lightbulb className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Dynamic Financial Insights</CardTitle>
            </div>
            <CardDescription className="text-xs">AI-synthesized ledger recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pr-2">
            {aiInsights.map((insight, idx) => {
              // Parse basic bold markers dynamically for formatting
              const formatted = insight.split("**").map((text, i) => 
                i % 2 === 1 ? <strong key={i} className="text-foreground font-extrabold">{text}</strong> : text
              )
              return (
                <div key={idx} className="flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <p>{formatted}</p>
                </div>
              )
            })}
          </CardContent>
          <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Insight Engine Mode</span>
            <span className="text-cyan-400 font-semibold uppercase">Rule-Based Synthesizer</span>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  )
}
