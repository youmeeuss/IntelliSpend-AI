"use client"

import { useState, useEffect } from 'react';
import { Upload, Loader2, Save, ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { extractReceiptData, ExtractReceiptDataOutput } from '@/ai/flows/extract-receipt-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import type { Transaction, Receipt } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';

export default function ReceiptScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractReceiptDataOutput | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { transactions, addTransaction, addReceipt } = useAppContext();

  // AI Receipt Insights calculation
  const getOcrInsights = () => {
    if (!extractedData) return null;

    // 1. Top Purchased Category (overall in ledger)
    const categoryTotals: Record<string, number> = {};
    let totalAll = 0;
    
    transactions.forEach(tx => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      totalAll += tx.amount;
    });

    let topCategory = 'Food';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    });

    const catPercent = totalAll > 0 ? Math.round(((categoryTotals[category] || 0) / totalAll) * 100) : 0;

    // 2. Recurring Merchant
    const merchantCount = transactions.filter(
      tx => tx.description.toLowerCase().trim() === vendor.toLowerCase().trim()
    ).length;
    const isRecurring = merchantCount > 0;

    // 3. Unusual Spending (variance compared to historical average of this category)
    const sameCatTxs = transactions.filter(tx => tx.category === category);
    const catAvg = sameCatTxs.length > 0 
      ? sameCatTxs.reduce((sum, tx) => sum + tx.amount, 0) / sameCatTxs.length
      : 0;
    
    let unusualDiffPercent = 0;
    let isUnusual = false;
    if (catAvg > 0 && totalAmount > catAvg * 1.5) { // 1.5x average threshold
      isUnusual = true;
      unusualDiffPercent = Math.round(((totalAmount - catAvg) / catAvg) * 100);
    }

    return {
      topCategory,
      topCategoryAmount,
      catPercent,
      merchantCount,
      isRecurring,
      catAvg,
      isUnusual,
      unusualDiffPercent
    };
  };

  const insights = getOcrInsights();

  // Shifting status messages for OCR AI processing
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Scanning receipt...",
    "Extracting merchant...",
    "Categorizing expenses...",
    "Generating insights..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // State values bound to inputs
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('');
  const [category, setCategory] = useState<'Groceries' | 'Transport' | 'Entertainment' | 'Bills' | 'Shopping' | 'Food'>('Food');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Warnings / Detection States
  const [duplicateFound, setDuplicateFound] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerId, setTimerId] = useState<any | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [timerId]);

  // Trigger save when countdown hits 0
  useEffect(() => {
    if (countdown === 0) {
      handleSaveReceipt();
      setCountdown(null);
    }
  }, [countdown]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedData(null);
      setDuplicateFound(false);
      setCountdown(null);
      if (timerId) {
        clearInterval(timerId);
        setTimerId(null);
      }
      // Populate photo preview uri immediately
      const reader = new FileReader();
      reader.onload = () => setPhotoUri(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleScanReceipt = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a receipt image to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);
    setDuplicateFound(false);
    setCountdown(null);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }

    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
      });
      setPhotoUri(dataUri);

      const result = await extractReceiptData({ photoDataUri: dataUri });
      setExtractedData(result);

      // Populate input states
      setVendor(result.vendor || '');
      setDate(result.date || '');
      setTotalAmount(result.totalAmount || 0);
      setCurrency(result.currency || 'USD');
      setCategory(result.category || 'Food');
      setPaymentMethod(result.paymentMethod || 'Unknown');

      // Duplicate Receipt Detection
      const isDup = transactions.some(
        (tx) =>
          tx.description.toLowerCase().trim() === (result.vendor || '').toLowerCase().trim() &&
          tx.date === result.date &&
          Math.abs(tx.amount - (result.totalAmount || 0)) < 0.01
      );
      setDuplicateFound(isDup);

      toast({
        title: 'Scan Successful',
        description: 'AI has extracted and verified your receipt.',
      });

      // Auto-save logic if no flags/warnings exist
      const hasWarnings = result.isBlurry || result.isFraudSuspected || isDup;
      if (!hasWarnings) {
        setCountdown(3);
        const id = setInterval(() => {
          setCountdown((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
              clearInterval(id);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerId(id);
      }
    } catch (error: any) {
      console.error('Error scanning receipt:', error);
      toast({
        title: 'Scan Failed',
        description: error?.message?.includes('429') 
          ? 'API quota exceeded. Please try again later.' 
          : 'Could not extract data from the receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAutoSave = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setCountdown(null);
    toast({
      title: "Auto-Save Paused",
      description: "You can now review or adjust the fields manually.",
    });
  };

  const handleSaveReceipt = () => {
    const finalVendor = vendor || 'Unknown Vendor';
    const finalDate = date || new Date().toISOString().split('T')[0];
    const finalAmount = totalAmount || 0;
    const finalCurrency = currency || 'USD';

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: finalDate,
      description: finalVendor,
      category: category,
      amount: finalAmount,
      currency: finalCurrency,
      location: 'Scanned Receipt',
    };

    const newReceipt: Receipt = {
      id: `r-${Date.now()}`,
      vendor: finalVendor,
      date: finalDate,
      totalAmount: finalAmount,
      currency: finalCurrency,
      items: extractedData?.items || [],
      imageUrl: photoUri || 'https://placehold.co/300x400.png',
      isBlurry: extractedData?.isBlurry || false,
      blurExplanation: extractedData?.blurExplanation || '',
      isFraudSuspected: extractedData?.isFraudSuspected || false,
      fraudExplanation: extractedData?.fraudExplanation || '',
    };

    addTransaction(newTransaction);
    addReceipt(newReceipt);

    toast({
      title: 'Receipt Saved',
      description: `${finalVendor} transaction has been saved successfully.`,
    });

    setFile(null);
    setPhotoUri(null);
    setExtractedData(null);
    setDuplicateFound(false);
    setCountdown(null);
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  const handleManualSave = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setCountdown(null);
    handleSaveReceipt();
  };

  return (
    <div className="space-y-6">
      {!photoUri && (
        <div className="border-2 border-dashed border-white/10 hover:border-cyan-500/30 rounded-xl p-8 text-center bg-black/15 hover:bg-black/25 transition-all duration-300 relative group cursor-pointer">
          <input
            id="receipt-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-full bg-cyan-950/15 border border-cyan-500/10 group-hover:scale-105 transition-transform duration-300">
              <Upload className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Drag and drop your receipt here</p>
              <p className="text-xs text-muted-foreground">Or click here to browse local files (PNG, JPG, max 5MB)</p>
            </div>
          </div>
        </div>
      )}

      {photoUri && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Panel: Image preview & scan status */}
          <div className="space-y-4">
            <div className="relative border border-white/5 rounded-xl overflow-hidden bg-black/35 shadow-2xl aspect-[3/4] flex items-center justify-center">
              <img src={photoUri} alt="Receipt preview" className="object-contain w-full h-full" />
              
              {isLoading && (
                <>
                  {/* Glowing Laser Scan Bar */}
                  <motion.div
                    className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00F0FF] absolute left-0 z-20"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                  />
                  {/* Scanner overlay tint */}
                  <div className="absolute inset-0 bg-cyan-950/20 pointer-events-none z-10" />
                </>
              )}
            </div>

            {!extractedData && !isLoading && (
              <div className="flex gap-2">
                <Button onClick={handleScanReceipt} className="flex-1 btn-gradient">
                  <Upload className="h-4 w-4 mr-2 text-[#0A0E17]" />
                  <span className="text-[#0A0E17] font-semibold">Start AI Extraction</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFile(null);
                    setPhotoUri(null);
                  }}
                  className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
            )}

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center p-6 space-y-3 text-center border border-white/5 rounded-xl bg-[#111625]/45 backdrop-blur-xl shadow-lg"
              >
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                <div className="text-sm font-semibold text-gradient">{loadingSteps[loadingStep]}</div>
                <div className="text-xs text-muted-foreground">Running OCR and high-fidelity LLM structural analysis...</div>
              </motion.div>
            )}
          </div>

          {/* Right Panel: Extracted Results / Form details */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {extractedData && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 rounded-xl border border-white/5 bg-card/45 p-6 backdrop-blur-xl shadow-2xl relative animate-in"
                >
                  {/* Warnings Section */}
                  <div className="space-y-3">
                    {extractedData.isFraudSuspected && (
                      <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-950/20 p-4 text-red-400 text-sm">
                        <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-300">Fraud / Alteration Suspected</h4>
                          <p className="text-xs mt-1 text-red-400/90">{extractedData.fraudExplanation || "The receipt calculations are inconsistent or the values look altered."}</p>
                        </div>
                      </div>
                    )}

                    {extractedData.isBlurry && (
                      <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-950/20 p-4 text-yellow-400 text-sm">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-300">Blurry Receipt Warning</h4>
                          <p className="text-xs mt-1 text-yellow-400/90">{extractedData.blurExplanation || "The receipt text legibility is low, which could affect accuracy."}</p>
                        </div>
                      </div>
                    )}

                    {duplicateFound && (
                      <div className="flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-950/20 p-4 text-orange-400 text-sm">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-orange-300">Duplicate Receipt Detected</h4>
                          <p className="text-xs mt-1 text-orange-400/90">A matching receipt from {vendor} for {formatCurrency(totalAmount, currency)} on {date} already exists in your database.</p>
                        </div>
                      </div>
                    )}

                    {/* Countdown / Auto-save banner */}
                    {countdown !== null && (
                      <div className="flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-4 text-cyan-400 text-sm">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                          <span className="font-medium">✨ Auto-saving receipt in <span className="font-bold text-lg">{countdown}</span>s...</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 bg-transparent text-xs"
                          onClick={handleCancelAutoSave}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* AI Receipt Insights Panel */}
                  {insights && (
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gradient">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        AI Receipt Insights
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Insight 1: Top Category */}
                        <div className="rounded-md bg-black/20 border border-white/5 p-2.5 text-center flex flex-col justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">Top Category</span>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{category}</span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">
                              {insights.catPercent}% of total ledger
                            </span>
                          </div>
                        </div>

                        {/* Insight 2: Recurring Merchant */}
                        <div className="rounded-md bg-black/20 border border-white/5 p-2.5 text-center flex flex-col justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">Recurring Merchant</span>
                          <div>
                            <span className={cn(
                              "text-xs font-bold block",
                              insights.isRecurring ? "text-cyan-400" : "text-muted-foreground"
                            )}>
                              {insights.isRecurring ? "Frequent Visitor" : "First Time"}
                            </span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">
                              {insights.isRecurring ? `${insights.merchantCount} previous visits` : "New addition"}
                            </span>
                          </div>
                        </div>

                        {/* Insight 3: Unusual Spending */}
                        <div className="rounded-md bg-black/20 border border-white/5 p-2.5 text-center flex flex-col justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block mb-1">Spend Alert</span>
                          <div>
                            <span className={cn(
                              "text-xs font-bold block",
                              insights.isUnusual ? "text-amber-400 font-semibold" : "text-emerald-400"
                            )}>
                              {insights.isUnusual ? `+${insights.unusualDiffPercent}% High` : "Typical Spend"}
                            </span>
                            <span className="text-[9px] text-muted-foreground block mt-0.5">
                              {insights.isUnusual ? `Above avg ${formatCurrency(insights.catAvg, currency)}` : `Within normal range`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 className="text-base font-semibold text-gradient">Extracted Receipt Data</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Vendor / Shop</Label>
                      <Input value={vendor} onChange={(e) => setVendor(e.target.value)} className="bg-black/20 focus-visible:ring-[#00F0FF] h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Date</Label>
                      <Input value={date} onChange={(e) => setDate(e.target.value)} className="bg-black/20 focus-visible:ring-[#00F0FF] h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</Label>
                      <Input type="number" step="any" value={totalAmount} onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)} className="bg-black/20 focus-visible:ring-[#00F0FF] h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Currency</Label>
                      <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-black/20 focus-visible:ring-[#00F0FF] h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Category</Label>
                      <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                        <SelectTrigger className="bg-black/20 focus-visible:ring-[#00F0FF] h-9 text-sm">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0E17] border-white/5 text-foreground">
                          <SelectItem value="Groceries">Groceries</SelectItem>
                          <SelectItem value="Transport">Transport</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Bills">Bills</SelectItem>
                          <SelectItem value="Shopping">Shopping</SelectItem>
                          <SelectItem value="Food">Food</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Payment Method</Label>
                      <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="bg-black/20 focus-visible:ring-[#00F0FF] h-9 text-sm" />
                    </div>
                  </div>

                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Line Items</Label>
                      <div className="rounded-md border border-white/5 bg-black/10 overflow-hidden max-h-[160px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-white/5">
                            <TableRow className="border-white/5">
                              <TableHead className="text-muted-foreground py-2 text-xs">Description</TableHead>
                              <TableHead className="text-right text-muted-foreground py-2 text-xs">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {extractedData.items.map((item, index) => (
                              <TableRow key={index} className="border-white/5 hover:bg-white/5">
                                <TableCell className="font-medium py-1.5 text-xs">{item.description}</TableCell>
                                <TableCell className="text-right font-medium py-1.5 text-xs">{formatCurrency(item.price, currency)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 border-white/10 hover:bg-white/5 text-muted-foreground hover:text-foreground text-xs h-9" 
                      onClick={() => {
                        if (timerId) clearInterval(timerId);
                        setFile(null);
                        setPhotoUri(null);
                        setExtractedData(null);
                        setCountdown(null);
                        setDuplicateFound(false);
                      }}
                    >
                      Discard
                    </Button>
                    <Button type="button" className="flex-1 btn-gradient text-xs h-9" onClick={handleManualSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Receipt
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
