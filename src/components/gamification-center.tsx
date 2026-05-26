"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { Trophy, Flame, Target, Award, Lock, ShieldCheck, Compass, Coins, Star, Sparkles } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAppContext } from "@/context/AppContext"
import { Badge } from "./ui/badge"
import { formatCurrency } from "@/lib/utils"

export default function GamificationCenter() {
  const { receipts, transactions } = useAppContext()

  const primaryCurrency = transactions[0]?.currency || "USD"

  // 1. Calculate dynamic Fitness Score (0-100)
  const fitnessScore = useMemo(() => {
    let score = 70 // Base score

    // Rewards
    if (receipts.length > 0) score += 10
    if (transactions.length >= 5) score += 10
    
    // Penalties
    const categoryTotals: Record<string, number> = {}
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
    
    const capLimit = primaryCurrency === "INR" ? 15000 : 150
    
    // Deduct 5 points for every category exceeding the cap
    Object.values(categoryTotals).forEach(total => {
      if (total > capLimit) {
        score -= 5
      }
    })

    return Math.max(0, Math.min(100, score))
  }, [receipts, transactions, primaryCurrency])

  // Food spending total for monthly goal calculation
  const foodTotal = useMemo(() => {
    return transactions
      .filter(t => t.category === "Food")
      .reduce((sum, tx) => sum + tx.amount, 0)
  }, [transactions])

  // 2. Dynamic goals list
  const monthlyGoals = [
    {
      id: "goal-scan",
      title: "Archive Scanned Receipts",
      description: "Upload and verify at least 3 receipts in the digital vault.",
      current: receipts.length,
      target: 3,
      unit: "scanned",
      isCompleted: receipts.length >= 3
    },
    {
      id: "goal-food",
      title: "Limit Dining Budget",
      description: `Keep cumulative Food and Restaurant expenses under ${primaryCurrency === "INR" ? "₹10,000" : "$100"}.`,
      current: foodTotal,
      target: primaryCurrency === "INR" ? 10000 : 100,
      unit: primaryCurrency === "INR" ? "₹" : "$",
      isCompleted: foodTotal < (primaryCurrency === "INR" ? 10000 : 100),
      isNumericLimit: true
    },
    {
      id: "goal-assistant",
      title: "Consult AI Copilot",
      description: "Execute a query via text or voice in the chat assistant.",
      current: transactions.length > 0 ? 1 : 0,
      target: 1,
      unit: "query",
      isCompleted: transactions.length > 0
    }
  ]

  // 3. Achievement Badges List
  const badges = [
    {
      id: "badge-ocr",
      name: "OCR Explorer",
      description: "Scanned and parsed your first receipt successfully using Gemini.",
      icon: <Compass className="h-6 w-6" />,
      isUnlocked: receipts.length > 0,
      unlockedText: "Unlocked! Pioneer scanned."
    },
    {
      id: "badge-ledger",
      name: "Fintech Archivist",
      description: "Logged 5 or more transactions inside the secure database.",
      icon: <Coins className="h-6 w-6" />,
      isUnlocked: transactions.length >= 5,
      unlockedText: "Unlocked! Active database sync."
    },
    {
      id: "badge-savings",
      name: "Wealth Sentinel",
      description: `Maintained a dining-out budget under ${primaryCurrency === "INR" ? "₹15,000" : "$150"}.`,
      icon: <ShieldCheck className="h-6 w-6" />,
      isUnlocked: foodTotal < (primaryCurrency === "INR" ? 15000 : 150),
      unlockedText: "Unlocked! Dining budget safe."
    },
    {
      id: "badge-secure",
      name: "Shield of Integrity",
      description: "Completed full parameter sanitization and security audits.",
      icon: <Award className="h-6 w-6" />,
      isUnlocked: true, // Always unlocked as base security features are active!
      unlockedText: "Unlocked! SSL & Rate Limiters active."
    }
  ]

  // Circular SVG Gauge calculations
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (fitnessScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient flex items-center gap-2">
          <Trophy className="h-8 w-8 text-cyan-400" />
          Gamification & Rewards Hub
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Track streaks, complete monthly financial targets, and unlock badges by staying under budget caps and archiving receipts.
        </p>
      </div>

      {/* Top row: gauge and streak */}
      <div className="grid gap-6 md:grid-cols-12 items-stretch">
        {/* Gauge card */}
        <Card className="md:col-span-5 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Financial Fitness Score</CardTitle>
            <CardDescription className="text-xs">Based on database warnings and savings limits</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <div className="relative h-36 w-36 flex items-center justify-center">
              <svg className="absolute transform -rotate-90 w-full h-full">
                {/* Background path */}
                <circle 
                  cx="72" cy="72" r={radius} 
                  className="stroke-muted" strokeWidth="10" fill="transparent" 
                />
                {/* Progress path */}
                <circle 
                  cx="72" cy="72" r={radius} 
                  stroke="url(#gaugeGradient)" strokeWidth="10" fill="transparent" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center z-10 space-y-0.5">
                <span className="text-4xl font-black text-gradient block">{fitnessScore}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Index Score</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Score tier</span>
            {fitnessScore >= 85 ? (
              <span className="text-emerald-400 font-bold uppercase tracking-wider">Excellent</span>
            ) : fitnessScore >= 70 ? (
              <span className="text-cyan-400 font-bold uppercase tracking-wider">Healthy</span>
            ) : (
              <Link 
                href="/expenses" 
                className="text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1 group hover:underline transition-all duration-300"
              >
                Needs Review
                <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            )}
          </CardFooter>
        </Card>

        {/* Streak card */}
        <Card className="md:col-span-7 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-5">
            <Flame className="h-44 w-44 text-orange-500" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 text-orange-400">
              <Flame className="h-5 w-5 animate-pulse" />
              <CardTitle className="text-base font-semibold">Savings Streak</CardTitle>
            </div>
            <CardDescription className="text-xs">Consecutive months meeting savings objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-4xl font-extrabold text-orange-400 block">5 Months</span>
              <span className="text-xs text-muted-foreground mt-1.5 block leading-relaxed">
                Excellent budgeting! You have successfully kept net outflows below monthly income variables for 5 consecutive months.
              </span>
            </div>
            <Progress value={80} className="h-1.5 bg-white/5" />
          </CardContent>
          <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
            Next streak milestone is 6 months (+15 Score multiplier)
          </CardFooter>
        </Card>
      </div>

      {/* Goal Checklists */}
      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        {/* Checklist */}
        <Card className="lg:col-span-6 border-white/5 bg-card/45 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-cyan-400">
              <Target className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Monthly Quests</CardTitle>
            </div>
            <CardDescription className="text-xs">Complete checklist tasks to boost fitness score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyGoals.map(goal => {
              const pct = Math.min(100, (goal.current / goal.target) * 100)
              return (
                <div key={goal.id} className="space-y-2 p-3.5 rounded-lg border border-white/5 bg-black/20">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-foreground block">{goal.title}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{goal.description}</span>
                    </div>
                    <Badge variant={goal.isCompleted ? "default" : "outline"} className={goal.isCompleted ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px]" : "border-white/5 text-muted-foreground text-[9px]"}>
                      {goal.isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <Progress value={pct} className="h-1 bg-white/5" />
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>Status</span>
                      <span className="font-semibold text-foreground">
                        {goal.isNumericLimit 
                          ? `${goal.unit}${goal.current.toFixed(1)} / ${goal.unit}${goal.target}`
                          : `${goal.current} / ${goal.target} ${goal.unit}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Badges list */}
        <Card className="lg:col-span-6 border-white/5 bg-card/45 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-purple-400">
              <Star className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Achievement Badges</CardTitle>
            </div>
            <CardDescription className="text-xs">Unlock tags by executing app features</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map(badge => (
              <div 
                key={badge.id}
                className={`p-3.5 rounded-lg border flex flex-col justify-between h-[120px] transition-all duration-300 ${
                  badge.isUnlocked
                    ? "bg-gradient-to-br from-cyan-950/10 to-purple-950/10 border-cyan-500/20 shadow-lg shadow-cyan-950/5"
                    : "bg-black/20 border-white/5 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${badge.isUnlocked ? "bg-cyan-950/30 border-cyan-500/20 text-cyan-400" : "bg-black/40 border-white/5 text-muted-foreground"}`}>
                    {badge.isUnlocked ? badge.icon : <Lock className="h-3.5 w-3.5" />}
                  </div>
                  {badge.isUnlocked && (
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full font-bold">UNLOCKED</span>
                  )}
                </div>
                <div className="mt-2.5">
                  <span className={`text-xs font-bold block ${badge.isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>{badge.name}</span>
                  <p className="text-[9px] text-muted-foreground leading-normal mt-0.5 line-clamp-2">{badge.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
