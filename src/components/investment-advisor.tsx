"use client"

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Loader2, 
  Sparkles, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Layers, 
  Activity, 
  ArrowRightLeft,
  DollarSign,
  Percent,
  TrendingUpIcon,
  RefreshCw
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { generateInvestmentRecommendations } from '@/ai/flows/generate-investment-recommendations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { getInvestmentDb, saveInvestmentDb } from '@/app/actions/db'
import { fetchStockPrice, searchMutualFunds, fetchFundNav, fetchCurrencyRates } from '@/app/actions/market'
import { formatCurrency } from '@/lib/utils'

const formSchema = z.object({
  age: z.coerce.number().min(18, { message: 'You must be at least 18 years old.' }),
  income: z.coerce.number().min(0, { message: 'Income must be a positive number.' }),
  savings: z.coerce.number().min(0, { message: 'Savings must be a positive number.' }),
  riskTolerance: z.enum(['low', 'medium', 'high']),
  investmentGoals: z.string().min(10, { message: 'Please describe your goals in at least 10 characters.' }),
})

export default function InvestmentAdvisor() {
  const [activeTab, setActiveTab] = useState<'advisor' | 'stocks' | 'funds' | 'forex'>('advisor')
  const [recommendations, setRecommendations] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user, getSessionToken } = useAuth()

  // Stocks Tab State
  const [stockSymbol, setStockSymbol] = useState('AAPL')
  const [stockData, setStockData] = useState<any>(null)
  const [stockLoading, setStockLoading] = useState(false)

  // Funds Tab State
  const [fundQuery, setFundQuery] = useState('')
  const [fundList, setFundList] = useState<any[]>([])
  const [fundsLoading, setFundsLoading] = useState(false)
  const [selectedFund, setSelectedFund] = useState<any>(null)
  const [navLoading, setNavLoading] = useState(false)

  // Forex Tab State
  const [forexData, setForexData] = useState<any>(null)
  const [forexLoading, setForexLoading] = useState(false)
  const [convertAmount, setConvertAmount] = useState('100')
  const [convertFrom, setConvertFrom] = useState('USD')
  const [convertTo, setConvertTo] = useState('INR')

  useEffect(() => {
    const loadInvestmentPlan = async () => {
      if (user?.uid) {
        const token = await getSessionToken()
        if (token) {
          const dbPlan = await getInvestmentDb(token)
          if (dbPlan) {
            setRecommendations(dbPlan)
          }
        }
      }
    }
    loadInvestmentPlan()
  }, [user])

  // Load default stock & currency values on tab selections
  useEffect(() => {
    if (activeTab === 'stocks' && !stockData) {
      handleStockQuery('AAPL')
    } else if (activeTab === 'forex' && !forexData) {
      loadForexRates()
    }
  }, [activeTab])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 30,
      income: 70000,
      savings: 50000,
      riskTolerance: 'medium',
      investmentGoals: 'Save for retirement and a house down payment.',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setRecommendations('')
    try {
      const result = await generateInvestmentRecommendations(values)
      setRecommendations(result.recommendations)
      
      if (user?.uid) {
        const token = await getSessionToken()
        if (token) {
          await saveInvestmentDb(result.recommendations, token)
        }
      }

      toast({
        title: 'Recommendations Generated',
        description: 'Your personalized investment plan is ready.',
      })
    } catch (error) {
      console.error('Error generating recommendations:', error)
      toast({
        title: 'Generation Failed',
        description: 'Could not generate recommendations. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Stock Market API triggers
  const handleStockQuery = async (symbolToFetch?: string) => {
    const symbol = symbolToFetch || stockSymbol
    if (!symbol) return
    setStockLoading(true)
    try {
      const data = await fetchStockPrice(symbol)
      if (data) {
        setStockData(data)
      } else {
        toast({
          title: "Symbol Not Found",
          description: `Could not resolve stock data for "${symbol}".`,
          variant: "destructive"
        })
      }
    } catch (e) {
      toast({
        title: "Market Query Failure",
        description: "Error resolving Yahoo Finance API.",
        variant: "destructive"
      })
    } finally {
      setStockLoading(false)
    }
  }

  // Mutual Funds search triggers
  const handleFundSearch = async () => {
    if (!fundQuery.trim()) return
    setFundsLoading(true)
    setSelectedFund(null)
    try {
      const results = await searchMutualFunds(fundQuery)
      if (results) {
        setFundList(results)
        if (results.length === 0) {
          toast({
            title: "No Funds Found",
            description: "No schemes match your query parameters."
          })
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFundsLoading(false)
    }
  }

  const handleSelectFund = async (schemeCode: number) => {
    setNavLoading(true)
    try {
      const details = await fetchFundNav(schemeCode)
      if (details) {
        setSelectedFund(details)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setNavLoading(false)
    }
  }

  // Forex rates API triggers
  const loadForexRates = async () => {
    setForexLoading(true)
    try {
      const data = await fetchCurrencyRates()
      if (data) {
        setForexData(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setForexLoading(false)
    }
  }

  const calculatedForexConvert = useMemo(() => {
    if (!forexData || !forexData.rates) return 0
    const amt = parseFloat(convertAmount) || 0
    const fromRate = forexData.rates[convertFrom] || 1
    const toRate = forexData.rates[convertTo] || 1
    
    // convert from base USD, then apply target rates
    const usdAmount = amt / fromRate
    return parseFloat((usdAmount * toRate).toFixed(4))
  }, [forexData, convertAmount, convertFrom, convertTo])

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex border-b border-white/5 pb-1 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all duration-300 ${
            activeTab === 'advisor'
              ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Portfolio Advisor
        </button>

        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all duration-300 ${
            activeTab === 'stocks'
              ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Live Stocks Quote
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all duration-300 ${
            activeTab === 'funds'
              ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Mutual Fund NAVs
        </button>

        <button
          onClick={() => setActiveTab('forex')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all duration-300 ${
            activeTab === 'forex'
              ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Forex Rates
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'advisor' && (
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-white/5 bg-card/45 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Smart Investment Advisor</CardTitle>
              <CardDescription>Tell us about yourself to get personalized investment advice from our AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Age</FormLabel>
                        <FormControl>
                          <Input className="bg-black/30 border-white/5 text-foreground h-9 focus-visible:ring-[#00F0FF]" type="number" placeholder="e.g., 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Annual Income</FormLabel>
                        <FormControl>
                          <Input className="bg-black/30 border-white/5 text-foreground h-9 focus-visible:ring-[#00F0FF]" type="number" placeholder="e.g., 70000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="savings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Total Savings</FormLabel>
                        <FormControl>
                          <Input className="bg-black/30 border-white/5 text-foreground h-9 focus-visible:ring-[#00F0FF]" type="number" placeholder="e.g., 50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Risk Tolerance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/30 border-white/5 text-foreground h-9 focus:ring-[#00F0FF]">
                              <SelectValue placeholder="Select your risk tolerance" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="investmentGoals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Investment Goals</FormLabel>
                        <FormControl>
                          <Input className="bg-black/30 border-white/5 text-foreground h-9 focus-visible:ring-[#00F0FF]" placeholder="e.g., Retirement, house down payment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full bg-cyan-500 text-[#0A0E17] hover:bg-cyan-400 font-bold">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get AI Recommendation Statement
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col border-white/5 bg-card/45 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg">Your AI-Powered Recommendations</CardTitle>
              <CardDescription>Based on your profile, here's a suggested plan.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {isLoading && <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />}
              {!isLoading && !recommendations && (
                <div className="text-center text-muted-foreground">
                  <Sparkles className="mx-auto h-12 w-12 text-cyan-500/40" />
                  <p className="mt-2 text-xs">Your recommendations will appear here.</p>
                </div>
              )}
              {recommendations && (
                <div className="prose prose-sm dark:prose-invert max-w-none w-full overflow-auto max-h-[400px] text-xs text-muted-foreground pr-2 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {recommendations}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stocks' && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Symbol search console */}
          <Card className="md:col-span-5 border-white/5 bg-card/45 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-base font-bold">Stock Exchange lookup</CardTitle>
              <CardDescription className="text-xs">Secure server-side API queries to Yahoo Finance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter Stock Ticker (e.g. TSLA, AAPL, MSFT)" 
                    value={stockSymbol}
                    onChange={(e) => setStockSymbol(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStockQuery()}
                    className="pl-8 bg-black/30 border-white/5 h-9 text-xs focus-visible:ring-[#00F0FF]"
                  />
                </div>
                <Button 
                  onClick={() => handleStockQuery()}
                  disabled={stockLoading}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#0A0E17] font-bold h-9 text-xs"
                >
                  {stockLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fetch"}
                </Button>
              </div>

              {/* Quick tickers selection */}
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Quick Hotlinks</span>
                <div className="flex flex-wrap gap-1.5">
                  {['AAPL', 'TSLA', 'GOOG', 'MSFT', 'AMZN', 'INFY'].map((sym) => (
                    <button
                      key={sym}
                      onClick={() => {
                        setStockSymbol(sym)
                        handleStockQuery(sym)
                      }}
                      className="px-2 py-1 text-[10px] font-bold border border-white/5 rounded bg-white/[0.02] text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/20 transition-all"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Display card */}
          <Card className="md:col-span-7 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-1.5">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    Ticker: {stockData?.symbol || stockSymbol || "AAPL"}
                  </CardTitle>
                  <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Live Market Quote</CardDescription>
                </div>
                
                {stockData && (
                  <div className={`flex items-center gap-1 text-xs font-bold border rounded-full px-2 py-0.5 ${
                    stockData.change >= 0 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {stockData.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stockData.change >= 0 ? "+" : ""}{stockData.changePercent}%
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center py-6">
              {stockLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Connecting to Yahoo Finance...</span>
                </div>
              ) : stockData ? (
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-foreground">
                      {stockData.currency === "INR" ? "₹" : "$"}
                      {stockData.price}
                    </span>
                    <span className={`text-xs font-bold ${stockData.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stockData.change >= 0 ? "+" : ""}{stockData.change} Today
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block">Session High</span>
                      <span className="font-bold text-foreground">${stockData.high}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block">Session Low</span>
                      <span className="font-bold text-foreground">${stockData.low}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block">Est. Volume</span>
                      <span className="font-bold text-foreground">{(stockData.volume / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  Query a symbol to load live stock quotes.
                </div>
              )}
            </CardContent>
            
            <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex items-center gap-1.5 text-[10px] text-muted-foreground justify-between">
              <span>Exchange Feed: Delayed 15m</span>
              <span className="text-cyan-400 font-semibold uppercase">API Synced</span>
            </CardFooter>
          </Card>
        </div>
      )}

      {activeTab === 'funds' && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Mutual Fund Search list */}
          <Card className="md:col-span-5 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col max-h-[460px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Mutual Funds Registry</CardTitle>
              <CardDescription className="text-xs">Live queries targeting api.mfapi.in registry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search Fund (e.g. Parag Parikh, SBI)" 
                    value={fundQuery}
                    onChange={(e) => setFundQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFundSearch()}
                    className="pl-8 bg-black/30 border-white/5 h-9 text-xs focus-visible:ring-[#00F0FF]"
                  />
                </div>
                <Button 
                  onClick={handleFundSearch}
                  disabled={fundsLoading}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#0A0E17] font-bold h-9 text-xs"
                >
                  {fundsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                </Button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[300px]">
                {fundsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : fundList.length > 0 ? (
                  fundList.map((fund) => (
                    <button
                      key={fund.schemeCode}
                      onClick={() => handleSelectFund(fund.schemeCode)}
                      className="w-full text-left p-2.5 border border-white/5 bg-white/[0.01] hover:bg-white/5 rounded-lg transition-all text-xs flex justify-between items-center gap-3"
                    >
                      <span className="truncate text-muted-foreground hover:text-foreground font-semibold">{fund.schemeName}</span>
                      <span className="text-[10px] text-cyan-400 shrink-0 font-mono">Code: {fund.schemeCode}</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-[11px] text-muted-foreground">
                    Search above to load Indian Mutual Fund registries.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mutual Fund Details View */}
          <Card className="md:col-span-7 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Layers className="h-5 w-5 text-cyan-400" />
                Scheme Detail Overview
              </CardTitle>
              <CardDescription className="text-xs">Dynamic Net Asset Value (NAV) quotes</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center py-6">
              {navLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Retrieving fund scheme parameters...</span>
                </div>
              ) : selectedFund ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">{selectedFund.meta.scheme_name}</h3>
                    <span className="inline-block mt-1 text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded px-1.5 py-0.5 font-bold font-mono">
                      {selectedFund.meta.scheme_category}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 border-t border-white/5 pt-4">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Latest NAV</span>
                    <span className="text-3xl font-black text-foreground">₹{selectedFund.nav}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">Quote date: {selectedFund.date}</span>
                  </div>

                  <div className="text-xs text-muted-foreground leading-relaxed bg-black/20 p-2.5 rounded border border-white/5">
                    <strong>Asset House:</strong> {selectedFund.meta.fund_house}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  Select a scheme from the results list to query real-time NAV calculations.
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 flex items-center gap-1.5 text-[10px] text-muted-foreground justify-between">
              <span>Feed Provider: AMFI India</span>
              <span className="text-cyan-400 font-semibold uppercase">Live NAV</span>
            </CardFooter>
          </Card>
        </div>
      )}

      {activeTab === 'forex' && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Global Forex Grid */}
          <Card className="md:col-span-6 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold">Exchange Rates Deck</CardTitle>
                  <CardDescription className="text-xs">Live rates relative to USD base</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={loadForexRates}
                  disabled={forexLoading}
                  className="h-8 w-8 hover:bg-white/5"
                >
                  <RefreshCw className={`h-4 w-4 text-cyan-400 ${forexLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {forexLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                </div>
              ) : forexData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs border-b border-white/5 pb-2 text-muted-foreground font-bold">
                    <span>Currency Symbol</span>
                    <span className="text-right">Price per USD</span>
                  </div>

                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {['INR', 'EUR', 'GBP', 'AED', 'CAD', 'JPY', 'SGD'].map((curr) => {
                      const rate = forexData.rates[curr]
                      return (
                        <div key={curr} className="flex justify-between items-center text-xs text-muted-foreground py-1 border-b border-white/[0.02]">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            {curr}
                          </span>
                          <span className="font-mono text-foreground font-semibold">{rate ? rate.toFixed(4) : "N/A"}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">Exchange rates failed to initialize.</div>
              )}
            </CardContent>

            <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 text-[10px] text-muted-foreground flex justify-between">
              <span>Date: {forexData?.date || "Today"}</span>
              <span className="text-cyan-400 font-semibold uppercase">API rates</span>
            </CardFooter>
          </Card>

          {/* Quick Forex Calculator */}
          <Card className="md:col-span-6 border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Forex Arbitrage Converter</CardTitle>
              <CardDescription className="text-xs">Real-time dynamic exchange calculations</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="pl-8 bg-black/30 border-white/5 h-9 text-xs focus-visible:ring-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">From</label>
                  <Select value={convertFrom} onValueChange={setConvertFrom}>
                    <SelectTrigger className="bg-black/30 border-white/5 h-9 text-xs">
                      <SelectValue placeholder="From" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
                      {['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'JPY', 'SGD'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">To</label>
                  <Select value={convertTo} onValueChange={setConvertTo}>
                    <SelectTrigger className="bg-black/30 border-white/5 h-9 text-xs">
                      <SelectValue placeholder="To" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
                      {['USD', 'INR', 'EUR', 'GBP', 'AED', 'CAD', 'JPY', 'SGD'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {forexData && (
                <div className="border-t border-white/5 pt-4 mt-2">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Result Output</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ArrowRightLeft className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-xl font-black text-foreground">
                      {convertAmount} {convertFrom} = {calculatedForexConvert} {convertTo}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-white/[0.01] border-t border-white/5 px-6 py-4 text-[10px] text-muted-foreground flex justify-between">
              <span>Live calculations active</span>
              <span className="text-cyan-400 font-semibold uppercase">Forex Calcs</span>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

