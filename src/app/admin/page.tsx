"use client"

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getAdminMetricsDb } from '@/app/actions/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { 
  Users, 
  CreditCard, 
  ShieldAlert, 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Bot, 
  Scan, 
  Loader2,
  LineChart,
  Activity
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const { user, getSessionToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'Admin') {
      router.push('/');
      return;
    }

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const token = await getSessionToken();
        if (!token) {
          setError("No session token available");
          return;
        }
        const data = await getAdminMetricsDb(token);
        if (data) {
          setMetrics(data);
        } else {
          setError("Failed to retrieve admin stats");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user, authLoading, router]);

  if (authLoading || (user && user.role !== 'Admin')) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user || user.role !== 'Admin') {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-amber-500 animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Admin Analytics Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Platform-wide diagnostics, transaction totals, AI utility logging, and document integrity audits.
        </p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      ) : error ? (
        <Card className="border-red-500/20 bg-red-950/10 p-6 text-center text-red-400">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <h3 className="font-semibold text-lg">Error Loading Admin Metrics</h3>
          <p className="text-sm mt-1">{error}</p>
        </Card>
      ) : (
        <>
          {/* STATS GRID */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* CARD 1: TOTAL USERS */}
            <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:border-[#00F0FF]/20 hover:translate-y-[-2px] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Users</CardTitle>
                <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/10">
                  <Users className="h-4 w-4 text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalUsers}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Active platform profiles</p>
              </CardContent>
            </Card>

            {/* CARD 2: TOTAL TRANSACTIONS */}
            <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:border-emerald-500/20 hover:translate-y-[-2px] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transactions</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/10">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalTransactions}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Ledger entries synchronized</p>
              </CardContent>
            </Card>

            {/* CARD 3: FRAUD ALERTS */}
            <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:border-red-500/20 hover:translate-y-[-2px] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fraud Alerts</CardTitle>
                <div className="p-2 rounded-lg bg-red-950/20 border border-red-500/10">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-400">{metrics.fraudAlerts}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Anomalies flagged by AI</p>
              </CardContent>
            </Card>

            {/* CARD 4: BLURRY RECEIPTS */}
            <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:border-amber-500/20 hover:translate-y-[-2px] transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blurry Scans</CardTitle>
                <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-400">{metrics.blurryReceipts}</div>
                <p className="text-[10px] text-muted-foreground mt-1">OCR extraction warning flags</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            {/* AI SYSTEM UTILITY & LOGGING STATS */}
            <Card className="md:col-span-4 border-white/5 bg-card/45 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Brain className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">AI Usage Statistics</CardTitle>
                </div>
                <CardDescription className="text-xs">Count of AI agent triggers by model features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* UTILITY 1: CHAT ASSISTANT */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Bot className="h-3.5 w-3.5 text-cyan-400" /> AI Copilot Sessions
                      </span>
                      <span className="text-foreground">{metrics.aiUsageStats.chatSessions}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400" 
                        style={{ width: `${Math.min(100, (metrics.aiUsageStats.chatSessions / 1000) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* UTILITY 2: OCR SCANNER */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Scan className="h-3.5 w-3.5 text-purple-400" /> Receipt OCR Extractions
                      </span>
                      <span className="text-foreground">{metrics.aiUsageStats.ocrScans}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-400" 
                        style={{ width: `${Math.min(100, (metrics.aiUsageStats.ocrScans / 500) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* UTILITY 3: INVESTMENT RECS */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <LineChart className="h-3.5 w-3.5 text-emerald-400" /> Portfolios Generated
                      </span>
                      <span className="text-foreground">{metrics.aiUsageStats.investmentPlans}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400" 
                        style={{ width: `${Math.min(100, (metrics.aiUsageStats.investmentPlans / 200) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2 text-[10px] text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-cyan-400" /> Gateway Status:
                    </span>
                    <span className="text-emerald-400 font-semibold uppercase tracking-wider">Online (Healthy)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active LLM Model:</span>
                    <span className="font-mono text-foreground text-[10px]">gemini-2.5-flash</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MOST COMMON CATEGORIES */}
            <Card className="md:col-span-8 border-white/5 bg-card/45 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle className="text-base font-semibold">Ledger Categories Breakdown</CardTitle>
                </div>
                <CardDescription className="text-xs">Category frequency & cumulative expenditures across all users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.mostCommonCategories && metrics.mostCommonCategories.length > 0 ? (
                  <div className="space-y-3.5">
                    {metrics.mostCommonCategories.map((c: any, index: number) => {
                      const maxVal = Math.max(...metrics.mostCommonCategories.map((o: any) => o.amount));
                      const barPercent = maxVal > 0 ? (c.amount / maxVal) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center gap-4 text-xs">
                          <div className="w-24 font-medium truncate text-muted-foreground">{c.name}</div>
                          <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500/80 to-blue-500/80 rounded-full" 
                              style={{ width: `${barPercent}%` }} 
                            />
                          </div>
                          <div className="w-28 text-right font-medium text-foreground">
                            {formatCurrency(c.amount, 'INR')} <span className="text-[10px] text-muted-foreground">({c.count} txs)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    No transaction entries to aggregate.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FLAGGED RECEIPTS FOR AUDIT */}
          <Card className="border-white/5 bg-card/45 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-1.5 text-red-400">
                <ShieldAlert className="h-5 w-5" />
                <CardTitle className="text-base font-semibold">Flagged Document Audit Trail</CardTitle>
              </div>
              <CardDescription className="text-xs">Audit log of low-fidelity or high-variance receipts extracted by Genkit agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="text-muted-foreground text-xs font-semibold">Vendor</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-semibold text-right">Amount</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-semibold pl-6">Anomaly Explanation</TableHead>
                      <TableHead className="text-muted-foreground text-xs font-semibold text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.flaggedReceipts && metrics.flaggedReceipts.length > 0 ? (
                      metrics.flaggedReceipts.map((rx: any, index: number) => (
                        <TableRow key={index} className="border-white/5 hover:bg-white/5 text-xs">
                          <TableCell className="font-semibold text-foreground">{rx.vendor}</TableCell>
                          <TableCell className="text-muted-foreground">{rx.date}</TableCell>
                          <TableCell className="text-right font-semibold text-foreground">
                            {formatCurrency(rx.totalAmount, rx.currency)}
                          </TableCell>
                          <TableCell className="text-red-400/90 pl-6 leading-relaxed max-w-[320px] truncate" title={rx.reason}>
                            {rx.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-red-500/10 border-red-500/20 text-red-400 text-[10px] h-5 px-1.5">
                              Flagged
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="border-transparent">
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                          All scanned documents are within normal math and clarity limits. No flags raised.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
