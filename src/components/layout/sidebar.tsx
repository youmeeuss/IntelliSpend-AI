"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, LayoutDashboard, LineChart, Receipt, Settings, Wallet, CreditCard, LogOut, WalletCards, User, ShieldAlert, Brain, Trophy, BarChart2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/investments", label: "Investments", icon: LineChart },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/predictions", label: "AI Forecasts", icon: Brain },
  { href: "/gamification", label: "Rewards Hub", icon: Trophy },
  { href: "/wallet", label: "Wallet", icon: Wallet },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside className="hidden h-screen w-16 flex-col border-r bg-card sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full logo-glow text-lg font-semibold text-[#0A0E17] md:h-8 md:w-8 md:text-base transition-all duration-300 hover:scale-105"
          >
            <WalletCards className="h-4 w-4 transition-all group-hover:rotate-12" />
            <span className="sr-only">IntelliSpend AI</span>
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname === item.href && "bg-accent text-accent-foreground hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          {user?.role === 'Admin' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-amber-500 hover:text-amber-600 transition-colors md:h-8 md:w-8",
                    pathname === "/admin" && "bg-accent"
                  )}
                >
                  <ShieldAlert className="h-5 w-5 animate-pulse" />
                  <span className="sr-only">Admin Controls</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Admin Controls</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                  pathname === "/profile" && "bg-accent text-accent-foreground hover:text-accent-foreground"
                )}
              >
                <User className="h-5 w-5" />
                <span className="sr-only">My Profile</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">My Profile</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                  pathname === "/settings" && "bg-accent text-accent-foreground hover:text-accent-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  )
}
