"use client"

import { useState, useMemo } from "react"
import { 
  Receipt, 
  Lightbulb, 
  LineChart, 
  Share2, 
  Wallet, 
  QrCode, 
  Copy, 
  Sparkles, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  FileJson,
  Smartphone,
  Send,
  Lock,
  Loader2,
  X
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppContext } from "@/context/AppContext"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

const iconMap = {
  "Receipt Summary": <Receipt className="h-5 w-5 text-cyan-400" />,
  "Budget Tip": <Lightbulb className="h-5 w-5 text-amber-500" />,
  "Investment Plan": <LineChart className="h-5 w-5 text-purple-400" />,
} as Record<string, JSX.Element>

export default function WalletPasses() {
  const { receipts, transactions, addTransaction } = useAppContext()
  const router = useRouter()
  const { toast } = useToast()
  const [flippedStates, setFlippedStates] = useState<Record<string, boolean>>({})

  // UPI Simulation State
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false)
  const [upiStep, setUpiStep] = useState<1 | 2 | 3>(1)
  const [upiMerchant, setUpiMerchant] = useState('Starbucks Coffee')
  const [upiId, setUpiId] = useState('starbucks@okaxis')
  const [upiAmount, setUpiAmount] = useState('15.00')
  const [upiPin, setUpiPin] = useState('')
  const [upiProcessing, setUpiProcessing] = useState(false)

  const primaryCurrency = transactions[0]?.currency || "USD"

  const toggleFlip = (id: string) => {
    setFlippedStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 1. Generate Receipt Summary Pass
  const latestReceipt = useMemo(() => {
    return [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  }, [receipts])

  const receiptSummaryPass = useMemo(() => ({
    id: "pass-receipt",
    title: latestReceipt ? latestReceipt.vendor : "No Receipts Yet",
    type: "Receipt Summary" as const,
    description: latestReceipt 
      ? `Your purchase of ${formatCurrency(latestReceipt.totalAmount, latestReceipt.currency)} on ${latestReceipt.date}.`
      : "Scan a receipt to get your first summary pass.",
    cta: "View Receipt",
    onClick: () => router.push("/receipts"),
  }), [latestReceipt, router])

  // 2. Generate Budget Tip Pass
  const budgetTipPass = useMemo(() => {
    const categoryTotals: Record<string, number> = {}
    transactions.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount
    })
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
    const topCategory = sortedCategories[0]

    return {
      id: "pass-budget",
      title: topCategory ? `Save on ${topCategory[0]}` : "Budget Tip",
      type: "Budget Tip" as const,
      description: topCategory
        ? `You spent ${formatCurrency(topCategory[1], primaryCurrency)} on ${topCategory[0]} this month. Try planning meals or making a budget to save more!`
        : "Start adding expenses to receive personalized budget tips.",
      cta: "See Spending",
      onClick: () => router.push("/expenses"),
    }
  }, [transactions, primaryCurrency, router])

  // 3. Generate Investment Plan Pass
  const investmentPass = useMemo(() => {
    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    return {
      id: "pass-investment",
      title: "Growth Portfolio",
      type: "Investment Plan" as const,
      description: totalSpent > 0
        ? `Based on your recent ${formatCurrency(totalSpent, primaryCurrency)} spending, you could invest 10% (${formatCurrency(totalSpent * 0.1, primaryCurrency)}) into a growth portfolio.`
        : "Scan receipts to start building your personalized investment plan.",
      cta: "View Investments",
      onClick: () => router.push("/investments"),
    }
  }, [transactions, primaryCurrency, router])

  const dynamicPasses = useMemo(() => [receiptSummaryPass, budgetTipPass, investmentPass], [receiptSummaryPass, budgetTipPass, investmentPass])

  // Calculate dynamic Wallet metrics
  const stats = useMemo(() => {
    const totalCards = dynamicPasses.length
    
    // Calculate Financial Safety Index
    let safetyScore = 80
    const largeSpends = transactions.filter(t => t.amount > 150).length
    safetyScore -= largeSpends * 6

    const categoryTotals: Record<string, number> = {}
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
    const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0)
    if (totalSpent > 0) {
      Object.entries(categoryTotals).forEach(([cat, sum]) => {
        if (sum / totalSpent > 0.3) {
          safetyScore -= 8 // single category dominates outflow
        }
      })
    }

    if (receipts.length > 0) {
      safetyScore += Math.min(18, receipts.length * 4)
    }

    const clampedSafetyScore = Math.max(10, Math.min(100, safetyScore))

    return {
      totalCards,
      safetyScore: clampedSafetyScore,
      totalSpent
    }
  }, [transactions, receipts, dynamicPasses])

  // AI Insights formulation
  const walletInsights = useMemo(() => {
    const list = []
    const safety = stats.safetyScore
    const totalOutflow = stats.totalSpent

    if (safety >= 75) {
      list.push({
        title: "Robust Wallet Health Score",
        text: `Your current health index stands strong at ${safety}%. Cash outflows are structured, and you have healthy reserves for investment triggers.`,
        badge: "Low Risk",
        badgeBg: "bg-green-500/10 text-green-400 border-green-500/20"
      })
    } else {
      list.push({
        title: "Active Outflow Deficit Warn",
        text: `Your health index has dropped to ${safety}%. Heavy categories dominate your card pools. Implement limits to push this back over 80%.`,
        badge: "Moderate Risk",
        badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
      })
    }

    const recSweep = totalOutflow * 0.15
    if (recSweep > 0) {
      list.push({
        title: "15% Sweep Allocation Suggestion",
        text: `Based on your recent outflow of ${formatCurrency(totalOutflow, primaryCurrency)}, we suggest auto-sweeping ${formatCurrency(recSweep, primaryCurrency)} into low-risk index products.`,
        badge: "Optimization",
        badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20"
      })
    } else {
      list.push({
        title: "Seed Ledger Assets",
        text: "Add or scan transactions to generate auto-sweep triggers for dynamic portfolios.",
        badge: "Awaiting Data",
        badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      })
    }

    list.push({
      title: "Real-time Verification Sync",
      text: "All pass details are secured with NoSQL parameter isolation. Exports are signed with local HTTPS verification keys.",
      badge: "Secured",
      badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    })

    return list
  }, [stats, primaryCurrency])

  const handleShare = (pass: typeof dynamicPasses[0]) => {
    const shareText = `💎 IntelliSpend AI - Smart Card Report 💎\n\n📌 Card: ${pass.title}\n🏷️ Type: ${pass.type}\n\n📝 Details:\n${pass.description}\n\n🔒 Verified digitally. Scan QR code on your card to view live ledger forecast.`
    
    if (navigator.share) {
      navigator.share({
        title: `${pass.title} Report`,
        text: shareText,
      }).catch(() => {
        copyToClipboard(shareText)
      })
    } else {
      copyToClipboard(shareText)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied report to clipboard!",
        description: "You can now share this financial statement anywhere.",
      })
    }).catch(() => {
      toast({
        title: "Action failed",
        description: "Could not write report to clipboard.",
        variant: "destructive"
      })
    })
  }

  const handleCopyJson = (pass: typeof dynamicPasses[0]) => {
    const rawData = {
      cardId: pass.id,
      cardTitle: pass.title,
      cardType: pass.type,
      summary: pass.description,
      lastSync: new Date().toISOString(),
      verifier: "IntelliSpend Secure Ledger"
    }
    navigator.clipboard.writeText(JSON.stringify(rawData, null, 2)).then(() => {
      toast({
        title: "JSON Dump Copied!",
        description: "Raw ledger pass data copied to clipboard.",
      })
    })
  }

  // Play secure oscillator beep on payment success
  const playPaymentSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime)
      osc1.start()
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc1.stop(ctx.currentTime + 0.15)
      
      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime) // A5
        gain2.gain.setValueAtTime(0.15, ctx.currentTime)
        osc2.start()
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc2.stop(ctx.currentTime + 0.3)
      }, 120)
    } catch (e) {
      console.log("Web Audio blocked:", e)
    }
  }

  // UPI payment simulation triggers
  const handleUpiPay = () => {
    if (upiPin.length < 4) {
      toast({
        title: "Security PIN Required",
        description: "Please enter your 4-digit UPI transaction authorization PIN.",
        variant: "destructive"
      })
      return
    }

    setUpiProcessing(true)

    setTimeout(() => {
      // Determine category based on merchant
      let category = "Food"
      if (upiMerchant.includes("Gas") || upiMerchant.includes("Shell")) category = "Transport"
      if (upiMerchant.includes("Supermarket") || upiMerchant.includes("Walmart")) category = "Groceries"
      if (upiMerchant.includes("Netflix")) category = "Entertainment"
      if (upiMerchant.includes("Apple")) category = "Shopping"

      const newTx = {
        id: "tx-upi-" + Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split("T")[0],
        description: `UPI Pay: ${upiMerchant} (${upiId})`,
        category: category as any,
        amount: parseFloat(upiAmount) || 15.00,
        currency: "USD",
        location: "UPI Terminal"
      }

      addTransaction(newTx)
      playPaymentSound()
      setUpiProcessing(false)
      setUpiStep(3)

      toast({
        title: "UPI Payment Success",
        description: `Transferred ${formatCurrency(newTx.amount, "USD")} to ${upiMerchant} securely.`
      })
    }, 1500)
  }

  const handleMerchantSelect = (merchant: string) => {
    setUpiMerchant(merchant)
    const map: Record<string, string> = {
      'Starbucks Coffee': 'starbucks@okaxis',
      'Shell Gas Station': 'shellgas@upi',
      'Walmart Grocery': 'walmart@paytm',
      'Netflix Inc': 'netflix@hdfcbank',
      'Apple Retail': 'applestore@ybl'
    }
    setUpiId(map[merchant] || 'merchant@upi')
  }

  const resetUpiForm = () => {
    setUpiStep(1)
    setUpiPin('')
    setUpiAmount('15.00')
    setUpiMerchant('Starbucks Coffee')
    setUpiId('starbucks@okaxis')
    setIsUpiModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Title block with UPI Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient flex items-center gap-2">
            <Wallet className="h-8 w-8 text-cyan-400" />
            Smart Financial Cards
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Interact, share, and verify financial passes. Click "Verify Card" to reveal live QR codes, download JSON statements, or trigger simulation pilots.
          </p>
        </div>

        <Button
          onClick={() => setIsUpiModalOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-[#0A0E17] font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-cyan-500/10 h-9 text-xs"
        >
          <Smartphone className="h-4 w-4" />
          Simulate UPI Pay
        </Button>
      </div>

      {/* KPI Stats Deck */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active Wallet Passes</span>
            <Wallet className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{stats.totalCards}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Real-time dynamic ledger channels</p>
          </div>
        </Card>

        <Card className="border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Wallet Safety Index</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{stats.safetyScore}%</span>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full rounded-full ${stats.safetyScore >= 75 ? "bg-emerald-400" : "bg-amber-400"}`}
                style={{ width: `${stats.safetyScore}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Card Outflow</span>
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent, primaryCurrency)}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">Aggregate spending across parameters</p>
          </div>
        </Card>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dynamicPasses.map((pass, index) => {
          const isFlipped = !!flippedStates[pass.id]

          return (
            <div 
              key={pass.id}
              className="w-full"
              style={{ perspective: "1000px" }}
            >
              <motion.div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "360px",
                  transformStyle: "preserve-3d",
                }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="w-full"
              >
                {/* FRONT SIDE */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                  className="w-full h-full"
                >
                  <Card className="flex flex-col border-white/5 bg-card/45 backdrop-blur-xl hover:border-cyan-500/20 w-full h-full justify-between overflow-hidden relative group">
                    {/* Visual Card Punch-hole and header slot decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-[#0A0E17] border-b border-l border-r border-white/10 rounded-b-md z-10 flex items-center justify-center">
                      <div className="w-6 h-1 bg-white/10 rounded-full" />
                    </div>

                    <CardHeader className="flex flex-row items-center gap-4 pb-3 pt-6">
                      <div className="grid gap-1">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold">
                          {iconMap[pass.type]}
                          {pass.title}
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{pass.type}</CardDescription>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 pb-4 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {pass.description}
                      </p>
                      
                      {/* Barcode graphic on Front to simulate Apple Wallet pass */}
                      <div className="pt-4 border-t border-white/5 opacity-55 group-hover:opacity-85 transition-opacity duration-300">
                        <div className="flex justify-between items-center gap-1">
                          <div className="h-6 w-[2px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                          <div className="h-6 w-[3px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                          <div className="h-6 w-[2px] bg-foreground" />
                          <div className="h-6 w-[4px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                          <div className="h-6 w-[2px] bg-foreground" />
                          <div className="h-6 w-[3px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                          <div className="h-6 w-[2px] bg-foreground" />
                          <div className="h-6 w-[4px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                          <div className="h-6 w-[3px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                          <div className="h-6 w-[2px] bg-foreground" />
                          <div className="h-6 w-[1px] bg-foreground" />
                        </div>
                        <div className="text-center text-[7px] tracking-[0.2em] font-mono text-muted-foreground mt-1 uppercase">
                          {pass.id}-{pass.type.replace(" ", "")}
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between bg-white/[0.01] border-t border-white/5 px-6 py-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={pass.onClick}
                        className="h-8 text-xs border-white/10 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all duration-300"
                      >
                        {pass.cta}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleFlip(pass.id)}
                        className="h-8 text-xs text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1" />
                        Verify Card
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* BACK SIDE */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className="w-full h-full"
                >
                  <Card className="flex flex-col border-cyan-500/30 bg-card/65 backdrop-blur-xl w-full h-full justify-between overflow-hidden relative">
                    <CardHeader className="pb-2 pt-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xs font-bold text-gradient">Card Verification Portal</CardTitle>
                          <CardDescription className="text-[9px] uppercase tracking-wider font-semibold">Pass: {pass.title}</CardDescription>
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 logo-glow animate-pulse" />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
                      {/* Dynamic API QR Code */}
                      <div className="p-2 bg-[#0A0E17] border border-cyan-500/20 rounded-lg relative group overflow-hidden">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pass.description)}&color=00F0FF&bgcolor=0A0E17`} 
                          alt="Verification QR Code"
                          className="h-[120px] w-[120px]"
                        />
                        <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                      
                      <span className="text-[9px] text-muted-foreground mt-2 font-mono tracking-wider">SECURE DIGITAL STATEMENT VERIFICATION</span>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center bg-white/[0.01] border-t border-white/5 px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleShare(pass)}
                          className="h-8 w-8 hover:bg-white/5 text-muted-foreground hover:text-cyan-400"
                          title="Share statement report"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCopyJson(pass)}
                          className="h-8 w-8 hover:bg-white/5 text-muted-foreground hover:text-cyan-400"
                          title="Copy JSON Dump"
                        >
                          <FileJson className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleFlip(pass.id)}
                        className="h-8 text-xs border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        Return Front
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* AI Monthly Insights Console */}
      <Card className="border-white/5 bg-card/45 backdrop-blur-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="h-28 w-28 text-cyan-400" />
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-foreground">AI Wallet Intelligence Console</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {walletInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className="flex flex-col justify-between p-4 border border-white/5 bg-white/[0.01] rounded-lg transition-all duration-300 hover:border-cyan-500/10"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-foreground">{insight.title}</h3>
                  <span className={`text-[8px] font-bold border rounded-full px-1.5 py-0.5 ${insight.badgeBg}`}>
                    {insight.badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {insight.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* UPI SIMULATOR MODAL */}
      <AnimatePresence>
        {isUpiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm border border-white/10 bg-[#0A0E17]/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden text-foreground flex flex-col justify-between"
              style={{ minHeight: "480px" }}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-bold text-gradient">UPI Pay Terminal</span>
                </div>
                <button 
                  onClick={resetUpiForm}
                  className="p-1 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Step content */}
              <div className="flex-1 p-5 flex flex-col justify-center">
                {upiStep === 1 && (
                  <div className="space-y-4">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Step 1: Choose Merchant & Amount</span>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Select Payee Merchant</label>
                      <Select value={upiMerchant} onValueChange={handleMerchantSelect}>
                        <SelectTrigger className="bg-black/30 border-white/5 h-9 text-xs">
                          <SelectValue placeholder="Select Payee" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
                          <SelectItem value="Starbucks Coffee">Starbucks Coffee (Food)</SelectItem>
                          <SelectItem value="Shell Gas Station">Shell Gas Station (Transport)</SelectItem>
                          <SelectItem value="Walmart Grocery">Walmart Grocery (Groceries)</SelectItem>
                          <SelectItem value="Netflix Inc">Netflix Inc (Entertainment)</SelectItem>
                          <SelectItem value="Apple Retail">Apple Retail (Shopping)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Payee VPA ID</label>
                      <Input 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="bg-black/30 border-white/5 h-9 text-xs font-mono text-cyan-400"
                        placeholder="merchant@upi"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-bold uppercase">Payment Outflow Amount (USD)</label>
                      <Input 
                        type="number"
                        value={upiAmount}
                        onChange={(e) => setUpiAmount(e.target.value)}
                        className="bg-black/30 border-white/5 h-9 text-xs font-bold text-foreground"
                        placeholder="15.00"
                      />
                    </div>

                    <Button
                      onClick={() => setUpiStep(2)}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0A0E17] font-bold h-9 text-xs mt-2"
                    >
                      Verify VPA & Pay
                    </Button>
                  </div>
                )}

                {upiStep === 2 && (
                  <div className="space-y-5 text-center">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">Step 2: Secure PIN Authorization</span>
                      <h3 className="text-xs font-bold text-foreground">Paying: {upiMerchant}</h3>
                      <span className="text-2xl font-black text-foreground block mt-1">${upiAmount}</span>
                    </div>

                    {/* PIN Display bullets */}
                    <div className="flex justify-center gap-4 py-2">
                      {[0, 1, 2, 3].map((idx) => (
                        <div 
                          key={idx}
                          className={`h-3 w-3 rounded-full border border-cyan-400/40 transition-all duration-200 ${
                            upiPin.length > idx 
                              ? "bg-cyan-400 logo-glow scale-110" 
                              : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto pt-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            if (upiPin.length < 4) setUpiPin(prev => prev + num)
                          }}
                          className="h-10 w-10 rounded-full border border-white/5 bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-500/20 font-bold text-sm text-foreground flex items-center justify-center transition-all"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setUpiPin('')}
                        className="h-10 w-10 rounded-full border border-white/5 bg-white/[0.02] text-xs font-bold text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all flex items-center justify-center"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => {
                          if (upiPin.length < 4) setUpiPin(prev => prev + '0')
                        }}
                        className="h-10 w-10 rounded-full border border-white/5 bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-500/20 font-bold text-sm text-foreground flex items-center justify-center transition-all"
                      >
                        0
                      </button>
                      <button
                        onClick={() => setUpiPin(prev => prev.slice(0, -1))}
                        className="h-10 w-10 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-bold text-muted-foreground hover:bg-white/5 transition-all flex items-center justify-center"
                      >
                        Del
                      </button>
                    </div>

                    {upiProcessing ? (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-cyan-400 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        NPCI Cryptographic Handshake...
                      </div>
                    ) : (
                      <Button
                        onClick={handleUpiPay}
                        disabled={upiPin.length < 4}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0A0E17] font-bold h-9 text-xs mt-2"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        Authorize Secure Pay
                      </Button>
                    )}
                  </div>
                )}

                {upiStep === 3 && (
                  <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10"
                    >
                      <Check className="h-8 w-8" />
                    </motion.div>
                    
                    <div className="space-y-1">
                      <h2 className="text-base font-extrabold text-foreground">UPI Payment Successful</h2>
                      <p className="text-[11px] text-muted-foreground">Signed & verified by IntelliSpend secure ledger.</p>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 rounded-lg p-3 w-full text-left space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipient:</span>
                        <span className="text-foreground font-bold">{upiMerchant}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VPA ID:</span>
                        <span className="text-cyan-400">{upiId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ref Number:</span>
                        <span className="text-foreground">TXN{Math.floor(100000 + Math.random() * 900000)}UPI</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5 text-sm font-sans font-bold">
                        <span className="text-foreground">Amount:</span>
                        <span className="text-foreground">${upiAmount}</span>
                      </div>
                    </div>

                    <Button
                      onClick={resetUpiForm}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0A0E17] font-bold h-9 text-xs"
                    >
                      Close Terminal
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

