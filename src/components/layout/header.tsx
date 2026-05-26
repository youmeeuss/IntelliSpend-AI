"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Receipt,
  Search,
  Wallet,
  Bot,
  CreditCard,
  WalletCards,
  Brain,
  AlertCircle,
  Calendar,
  TrendingUp,
  Check,
  CheckCheck,
  FileText,
  Sparkles,
  Trophy,
  BarChart2
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppContext } from "@/context/AppContext"
import { formatCurrency } from "@/lib/utils"

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'report' | 'alert' | 'bill' | 'warning';
  isRead: boolean;
  date: string;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/investments", label: "Investments", icon: LineChart },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/predictions", label: "AI Forecasts", icon: Brain },
  { href: "/gamification", label: "Rewards Hub", icon: Trophy },
  { href: "/wallet", label: "Wallet", icon: Wallet },
]

export function Header() {
  const { user, logout } = useAuth()
  const { transactions } = useAppContext()
  const pathname = usePathname()
  const pageTitle = navItems.find(item => item.href === pathname)?.label || "Dashboard"

  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Dynamic ledger-based notifications analyzer
  useEffect(() => {
    const list: NotificationItem[] = []
    const primaryCurrency = transactions[0]?.currency || "USD"

    // 1. Monthly Report Summary
    if (transactions.length > 0) {
      const totalOutflow = transactions.reduce((sum, tx) => sum + tx.amount, 0)
      list.push({
        id: "note-monthly-report",
        title: "Monthly Spending Report",
        description: `Your monthly summary is ready. Total period outflow is ${formatCurrency(totalOutflow, primaryCurrency)}.`,
        type: "report",
        isRead: false,
        date: "Just now"
      })
    }

    // 2. Spending Alerts: Large Transactions (> 100)
    const largeTxs = transactions.filter(t => t.amount > 100)
    largeTxs.forEach((tx) => {
      list.push({
        id: `note-large-spend-${tx.id}`,
        title: "High Outflow Alert",
        description: `Large transaction of ${formatCurrency(tx.amount, tx.currency)} recorded at "${tx.description}".`,
        type: "alert",
        isRead: false,
        date: tx.date
      })
    })

    // 3. Bill Reminders: Category "Bills"
    const bills = transactions.filter(t => t.category === "Bills")
    bills.forEach((bill) => {
      list.push({
        id: `note-bill-reminder-${bill.id}`,
        title: "Upcoming Bill Reminder",
        description: `Scheduled renewal payment of ${formatCurrency(bill.amount, bill.currency)} for "${bill.description}".`,
        type: "bill",
        isRead: false,
        date: bill.date
      })
    })

    // 4. Budget Warnings: Any category cumulative spend > 150
    const categoryTotals: Record<string, number> = {}
    transactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
    Object.entries(categoryTotals).forEach(([category, total]) => {
      if (total > 150) {
        list.push({
          id: `note-budget-warning-${category}`,
          title: `${category} Budget Alert`,
          description: `Cumulative spending in ${category} has reached ${formatCurrency(total, primaryCurrency)}.`,
          type: "warning",
          isRead: false,
          date: "Today"
        })
      }
    })

    setNotifications(list)
  }, [transactions])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <WalletCards className="h-6 w-6 text-[#00F0FF]" />
              <span className="text-gradient">IntelliSpend AI</span>
            </Link>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        <h1 className="font-semibold text-xl hidden sm:block">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-8 sm:w-[200px] md:w-[300px]"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-white/5">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400 logo-glow animate-pulse" />
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#0A0E17] border-white/5 p-4 text-foreground mr-4 shadow-2xl rounded-lg backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gradient">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Notifications ({unreadCount})
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                >
                  <CheckCheck className="h-3 w-3" />
                  Read All
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {notifications.map((note) => {
                let icon = <FileText className="h-3.5 w-3.5 text-cyan-400" />
                let iconBg = "bg-cyan-950/20 border-cyan-500/10"
                if (note.type === "alert") {
                  icon = <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                  iconBg = "bg-red-950/20 border-red-500/10"
                } else if (note.type === "bill") {
                  icon = <Calendar className="h-3.5 w-3.5 text-purple-400" />
                  iconBg = "bg-purple-950/20 border-purple-500/10"
                } else if (note.type === "warning") {
                  icon = <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  iconBg = "bg-amber-950/20 border-amber-500/10"
                }

                return (
                  <div 
                    key={note.id}
                    onClick={() => markAsRead(note.id)}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                      note.isRead 
                        ? "bg-transparent border-transparent opacity-50" 
                        : "bg-white/5 border-white/5 hover:border-cyan-500/20"
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center border shrink-0 ${iconBg}`}>
                      {icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground leading-none">{note.title}</span>
                        <span className="text-[9px] text-muted-foreground">{note.date}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{note.description}</p>
                    </div>
                    {!note.isRead && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(note.id);
                        }}
                        className="h-4 w-4 rounded-full bg-white/5 hover:bg-cyan-500/10 text-muted-foreground hover:text-cyan-400 flex items-center justify-center shrink-0"
                        title="Mark as read"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                )
              })}

              {notifications.length === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  All caught up! No active financial notifications.
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-muted-foreground/10 p-0 shadow-sm">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                <AvatarFallback className="text-xs font-bold bg-[#4285F4]/10 text-[#4285F4]">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold leading-none">{user?.displayName || "Valued User"}</p>
                  {user?.role && (
                    <Badge className={user.role === 'Admin' ? "text-[10px] h-4 bg-red-100 text-red-800 hover:bg-red-100 border-none px-1" : "text-[10px] h-4 bg-blue-100 text-blue-800 hover:bg-blue-100 border-none px-1"}>
                      {user.role}
                    </Badge>
                  )}
                </div>
                <p className="text-xs leading-none text-muted-foreground break-all">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer">
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer">
                Security & Devices
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-700 cursor-pointer"
              onClick={() => logout()}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
