"use client"

import { useState, useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, X, CreditCard, Download, UploadCloud, FileSpreadsheet } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAppContext } from "@/context/AppContext"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { formatCurrency } from "@/lib/utils"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { useToast } from "@/hooks/use-toast"

const MotionTableRow = motion.create(TableRow)

// Excel spreadsheet exporter
function exportToCSV(transactions: any[]) {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Location'];
  const rows = transactions.map(t => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    t.category,
    t.amount,
    t.currency,
    `"${(t.location || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `intellispend_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Print-friendly PDF statement report generator
function printPDFReport(transactions: any[]) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const primaryCurrency = transactions[0]?.currency || 'USD';
  const currencySymbol = primaryCurrency === 'INR' ? '₹' : primaryCurrency === 'EUR' ? '€' : primaryCurrency === 'GBP' ? '£' : '$';

  const rows = transactions.map(t => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px; font-size: 11px; color: #475569;">${t.date}</td>
      <td style="padding: 10px; font-weight: bold; font-size: 11px; color: #0f172a;">${t.description}</td>
      <td style="padding: 10px; font-size: 11px; color: #475569;">
        <span style="border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; background: #f8fafc; font-size: 10px;">${t.category}</span>
      </td>
      <td style="padding: 10px; text-align: right; color: ${t.amount < 0 ? '#10b981' : '#ef4444'}; font-weight: bold; font-size: 11px;">${t.amount < 0 ? '+' : '-'}${currencySymbol}${Math.abs(t.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>IntelliSpend AI - Financial Summary Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
          .header { border-bottom: 2px solid #00F0FF; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
          .brand span { color: #A855F7; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 5px; }
          .stats { display: flex; gap: 20px; margin-bottom: 35px; }
          .stat-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; flex: 1; background: #fafafa; }
          .stat-title { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
          .stat-value { font-size: 20px; font-weight: 800; margin-top: 5px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; padding: 10px; font-size: 11px; font-weight: bold; text-align: left; color: #334155; text-transform: uppercase; }
          .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">IntelliSpend <span>AI</span></div>
            <div class="subtitle">Personal Fintech Ledger Report</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Generated: ${new Date().toLocaleDateString()}
          </div>
        </div>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-title">Net Outflow Balance</div>
            <div class="stat-value">${total < 0 ? '-' : ''}${currencySymbol}${Math.abs(total).toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Ledger Item Count</div>
            <div class="stat-value">${transactions.length} Records</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Database Status</div>
            <div class="stat-value" style="color: #10b981;">SYNCED</div>
          </div>
        </div>
        <h3 style="font-size: 14px; font-weight: bold; color: #0f172a; margin-bottom: 10px;">Transaction Statement Details</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows : '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #64748b; font-size: 11px;">No records match these criteria.</td></tr>'}
          </tbody>
        </table>
        <div class="footer">
          IntelliSpend AI | Secure Financial Intelligence Platform | Deployed Cloud Statement
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function ExpensesOverview() {
  const { transactions, addTransaction } = useAppContext()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Available categories in application schema
  const categoriesList = ["Groceries", "Transport", "Entertainment", "Bills", "Shopping", "Food"]

  const categoryColors: Record<string, string> = {
    Groceries: "hsl(var(--chart-1))",     // Cyan
    Shopping: "hsl(var(--chart-2))",      // Purple
    Food: "hsl(var(--chart-3))",          // Google Blue
    Bills: "hsl(var(--chart-4))",         // Teal
    Transport: "hsl(var(--chart-5))",     // Indigo
    Entertainment: "hsl(var(--accent))",  // Magenta
  }

  // 1. Calculate dynamic spending by category based on transactions context
  const dynamicCategorySpending = useMemo(() => {
    const totals: Record<string, number> = {}
    categoriesList.forEach(cat => {
      totals[cat] = 0
    })

    transactions.forEach(t => {
      if (t.amount > 0) {
        if (totals[t.category] !== undefined) {
          totals[t.category] += t.amount
        } else {
          totals[t.category] = t.amount
        }
      }
    })

    const colorsPalette = [
      "#00F0FF", // Cyan
      "#A855F7", // Purple
      "#3B82F6", // Google Blue
      "#0D9488", // Teal
      "#6366F1", // Indigo
      "#EC4899", // Pink
      "#F59E0B", // Amber
      "#10B981", // Emerald
      "#EF4444", // Red
      "#84CC16", // Lime
      "#06B6D4", // Sky
      "#F43F5E"  // Rose
    ]

    const chartData = Object.entries(totals)
      .filter(([_, value]) => value > 0)
      .map(([name, value], idx) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        fill: categoryColors[name] || colorsPalette[idx % colorsPalette.length],
      }))

    return chartData.length > 0 ? chartData : [{ name: "No Expenses", value: 1, fill: "rgba(255, 255, 255, 0.05)" }]
  }, [transactions])

  // Calculate sum of active transactions
  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0)
  }, [transactions])

  // Toggle category checkboxes inside filtering menu
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
  }

  // 2. Perform dynamic filtering on search and category checks
  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(tx.category)
        return matchesSearch && matchesCategory
      })
  }, [transactions, searchQuery, selectedCategories])

  // CSV parsing & import logic
  const handleCSVImport = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Format",
        description: "Please upload a valid .csv bank statement file.",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text) return

        const lines = text.split("\n")
        let count = 0

        const firstLine = lines[0]?.toLowerCase() || ""
        const hasHeaders = firstLine.includes("date") || firstLine.includes("description") || firstLine.includes("amount")
        const startIndex = hasHeaders ? 1 : 0

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          // Handle double quotes correctly
          const cols: string[] = []
          let current = ""
          let inQuotes = false

          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              cols.push(current.trim())
              current = ""
            } else {
              current += char
            }
          }
          cols.push(current.trim())

          // Minimum required fields: Date, Description, Category, Amount
          if (cols.length >= 4) {
            const date = cols[0] || new Date().toISOString().split("T")[0]
            const description = cols[1] || "CSV Imported Transaction"
            let category = cols[2] || "Shopping"
            
            // Standardize category capitalizations
            const matchedCat = categoriesList.find(c => c.toLowerCase() === category.toLowerCase())
            if (matchedCat) category = matchedCat

            const amount = parseFloat(cols[3].replace(/[^\d.-]/g, "")) || 0
            const currency = cols[4] || "USD"
            const location = cols[5] || ""

            const rawAmount = parseFloat(cols[3].replace(/[^\d.-]/g, "")) || 0

            if (rawAmount !== 0) {
              // Standard ledger: negative values are outflows (stored positive),
              // positive values are inflows/credits (stored negative)
              const finalAmount = rawAmount < 0 ? Math.abs(rawAmount) : -rawAmount

              const newTx = {
                id: "tx-csv-" + Math.random().toString(36).substr(2, 9),
                date,
                description,
                category: category,
                amount: finalAmount,
                currency,
                location
              }
              addTransaction(newTx)
              count++
            }
          }
        }

        toast({
          title: "Import Complete",
          description: `Successfully loaded and synced ${count} transactions into MongoDB.`
        })
      } catch (err) {
        toast({
          title: "Parser Error",
          description: "Something went wrong while parsing the CSV. Ensure headers map correctly.",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
  }

  // Drag-and-drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVImport(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCSVImport(e.target.files[0])
    }
  }

  const downloadSampleTemplate = () => {
    const csvContent = "Date,Description,Category,Amount,Currency,Location\n2026-05-20,Starbucks Coffee,Food,6.50,USD,New York\n2026-05-21,Target Supermarket,Groceries,42.80,USD,Los Angeles\n2026-05-22,Shell Gas,Transport,35.00,USD,Chicago\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "intellispend_sample_statement.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid gap-8 lg:grid-cols-5 items-start"
    >
      {/* LEFT PANEL: PIE CHART & CSV IMPORT */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl flex flex-col justify-between">
          <CardHeader className="pb-1">
            <div className="flex items-center gap-2 text-cyan-400">
              <CreditCard className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
            </div>
            <CardDescription className="text-xs">Dynamic breakdown of your current outflows</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6 pt-2">
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicCategorySpending}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    innerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0.10 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}
                  >
                    {dynamicCategorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-background stroke-2" />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ backgroundColor: "#111625", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                    formatter={(value) => [`$${value}`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Grid Legend */}
            <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-white/5 text-[10px] text-muted-foreground max-h-[85px] overflow-y-auto pr-1 mt-2">
              {dynamicCategorySpending.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 min-w-0">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CSV BANK IMPORT CARD */}
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <UploadCloud className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Import Bank Statement</CardTitle>
            </div>
            <CardDescription className="text-xs">Directly parse and upload statement history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 relative cursor-pointer ${
                dragActive 
                  ? "border-cyan-400 bg-cyan-950/20" 
                  : "border-white/10 hover:border-cyan-500/30 bg-black/10"
              }`}
            >
              <input 
                type="file" 
                id="csv-file-upload" 
                accept=".csv"
                onChange={handleFileChange}
                className="hidden" 
              />
              <label htmlFor="csv-file-upload" className="cursor-pointer space-y-2 block">
                <FileSpreadsheet className="h-8 w-8 text-cyan-400 mx-auto opacity-75 animate-pulse" />
                <div className="text-xs font-semibold text-foreground">Drag CSV file here or <span className="text-cyan-400 hover:underline">browse files</span></div>
                <p className="text-[9px] text-muted-foreground">Accepts fields: Date, Description, Category, Amount</p>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT PANEL: TRANSACTION TABLE */}
      <div className="lg:col-span-3">
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl h-full">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">All Transactions</CardTitle>
                <CardDescription className="text-xs">Search, filter, and review ledger entries in real-time</CardDescription>
              </div>
              
              {/* Reset filter button if filters are active */}
              {(searchQuery || selectedCategories.length > 0) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-8 border border-white/5 hover:bg-white/5 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Filter Search Inputs */}
            <div className="flex items-center gap-3 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-black/20 focus-visible:ring-[#00F0FF] border-white/5 text-xs h-9"
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 border-white/5 text-xs flex items-center gap-1.5 bg-black/10">
                    <Filter className="h-3.5 w-3.5" />
                    Filter
                    {selectedCategories.length > 0 && (
                      <Badge className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/10 h-4 px-1 rounded text-[9px] border-cyan-500/20">
                        {selectedCategories.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0A0E17] border-white/5 text-foreground w-44">
                  <DropdownMenuLabel className="text-xs">Category</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  {categoriesList.map(cat => (
                    <DropdownMenuCheckboxItem
                      key={cat}
                      checked={selectedCategories.includes(cat)}
                      onCheckedChange={() => handleCategoryToggle(cat)}
                      className="text-xs focus:bg-white/5"
                    >
                      {cat}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 border-white/5 text-xs flex items-center gap-1.5 bg-black/10">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0A0E17] border-white/5 text-foreground w-44">
                  <DropdownMenuLabel className="text-xs">Export Format</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => exportToCSV(filteredTransactions)} className="text-xs focus:bg-white/5 cursor-pointer">
                    Export to Excel (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => printPDFReport(filteredTransactions)} className="text-xs focus:bg-white/5 cursor-pointer">
                    Export PDF Statement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="max-h-[380px] overflow-y-auto pr-1">
            <Table>
              <TableHeader className="bg-white/[0.01]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Description</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Category</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                  <TableHead className="text-right text-muted-foreground text-xs">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filteredTransactions.map((transaction) => (
                    <MotionTableRow 
                      key={transaction.id}
                      layoutId={`tx-row-${transaction.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-white/5 hover:bg-white/5 cursor-pointer"
                    >
                      <TableCell className="font-semibold text-xs">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 bg-cyan-950/10 text-[9px] px-2 py-0.5">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{transaction.date}</TableCell>
                      <TableCell className={`text-right font-bold text-xs ${transaction.amount < 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {transaction.amount < 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                      </TableCell>
                    </MotionTableRow>
                  ))}
                </AnimatePresence>

                {filteredTransactions.length === 0 && (
                  <TableRow className="hover:bg-transparent border-none">
                    <TableCell colSpan={4} className="h-32 text-center text-xs text-muted-foreground">
                      No matching transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
