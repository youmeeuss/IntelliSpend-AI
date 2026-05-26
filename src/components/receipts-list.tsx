"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { PlusCircle, Search, Calendar, Eye, Receipt as ReceiptIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppContext } from "@/context/AppContext"
import { Badge } from "./ui/badge"
import { formatCurrency } from "@/lib/utils"

const MotionTableRow = motion.create(TableRow)

export default function ReceiptsList() {
  const { receipts } = useAppContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<"30" | "90" | "year" | "all">("all")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate premium database load skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700)
    return () => clearTimeout(timer)
  }, [])

  // Filter receipts by search vendor and selected date ranges
  const filteredReceipts = useMemo(() => {
    const now = new Date()
    const sorted = [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return sorted.filter(r => {
      const matchesSearch = r.vendor.toLowerCase().includes(searchQuery.toLowerCase())
      
      let matchesDate = true
      const rDate = new Date(r.date)
      if (dateFilter === "30") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = rDate >= thirtyDaysAgo
      } else if (dateFilter === "90") {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        matchesDate = rDate >= ninetyDaysAgo
      } else if (dateFilter === "year") {
        matchesDate = rDate.getFullYear() === now.getFullYear()
      }

      return matchesSearch && matchesDate
    })
  }, [receipts, searchQuery, dateFilter])

  // Custom Glass Skeleton rows
  const SkeletonRow = () => (
    <TableRow className="border-white/5 animate-pulse hover:bg-transparent">
      <TableCell className="hidden sm:table-cell">
        <div className="h-12 w-12 bg-white/5 rounded-md" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-32 bg-white/5 rounded" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-20 bg-white/5 rounded" />
      </TableCell>
      <TableCell className="text-right">
        <div className="h-4 w-16 bg-white/5 rounded ml-auto" />
      </TableCell>
      <TableCell>
        <div className="h-8 w-12 bg-white/5 rounded ml-auto" />
      </TableCell>
    </TableRow>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-white/5 bg-card/45 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <ReceiptIcon className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">Receipt Vault</CardTitle>
              </div>
              <CardDescription className="text-xs">
                A centralized and organized digital archive of all your receipts.
              </CardDescription>
            </div>
            
            <Link href="/receipts/new">
              <Button size="sm" className="btn-gradient text-xs gap-1.5 h-8">
                <PlusCircle className="h-4 w-4 text-[#0A0E17]" />
                <span className="text-[#0A0E17]">Scan Receipt</span>
              </Button>
            </Link>
          </div>

          {/* Filtering row */}
          <div className="flex items-center gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/20 focus-visible:ring-[#00F0FF] border-white/5 text-xs h-9"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 border-white/5 text-xs flex items-center gap-1.5 bg-black/10">
                  <Calendar className="h-3.5 w-3.5" />
                  Date Range
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0A0E17] border-white/5 text-foreground w-44">
                <DropdownMenuLabel className="text-xs">Filter by Date</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuCheckboxItem 
                  checked={dateFilter === "all"} 
                  onCheckedChange={() => setDateFilter("all")}
                  className="text-xs focus:bg-white/5"
                >
                  All Receipts
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={dateFilter === "30"} 
                  onCheckedChange={() => setDateFilter("30")}
                  className="text-xs focus:bg-white/5"
                >
                  Last 30 Days
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={dateFilter === "90"} 
                  onCheckedChange={() => setDateFilter("90")}
                  className="text-xs focus:bg-white/5"
                >
                  Last 90 Days
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem 
                  checked={dateFilter === "year"} 
                  onCheckedChange={() => setDateFilter("year")}
                  className="text-xs focus:bg-white/5"
                >
                  This Year
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="max-h-[480px] overflow-y-auto pr-1">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="hidden w-[90px] sm:table-cell text-muted-foreground text-xs">Image</TableHead>
                <TableHead className="text-muted-foreground text-xs">Vendor</TableHead>
                <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                <TableHead className="text-right text-muted-foreground text-xs">Total</TableHead>
                <TableHead className="text-right text-muted-foreground text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredReceipts.map((receipt) => (
                    <MotionTableRow 
                      key={receipt.id}
                      layoutId={`rx-row-${receipt.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-white/5 hover:bg-white/5"
                    >
                      <TableCell className="hidden sm:table-cell">
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center">
                          <img
                            alt="Receipt thumb"
                            className="aspect-square object-cover"
                            src={receipt.imageUrl}
                            onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x400.png'; }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs">{receipt.vendor}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{receipt.date}</TableCell>
                      <TableCell className="text-right font-extrabold text-xs text-cyan-400">{formatCurrency(receipt.totalAmount, receipt.currency)}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] border-white/10 hover:bg-white/5">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-[#0A0E17] border-white/5">
                            <DialogTitle className="text-sm font-semibold text-gradient mb-2">Receipt from {receipt.vendor}</DialogTitle>
                            <div className="flex flex-col items-center justify-center p-3 gap-4">
                              <img 
                                src={receipt.imageUrl} 
                                alt="Full Receipt" 
                                className="max-h-[60vh] object-contain rounded-md border border-white/5" 
                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x400.png'; }}
                              />
                              <div className="w-full grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block uppercase">Date</span>
                                  <span className="font-semibold">{receipt.date}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-muted-foreground block uppercase">Total Amount</span>
                                  <span className="font-bold text-cyan-400">{formatCurrency(receipt.totalAmount, receipt.currency)}</span>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </MotionTableRow>
                  ))}
                </AnimatePresence>
              )}

              {!isLoading && filteredReceipts.length === 0 && (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                    No matching receipts archived in the vault.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
