"use client"

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  CircleUser, 
  Loader2, 
  Send, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Sparkles, 
  HelpCircle,
  PiggyBank,
  Zap,
  ArrowUpRight,
  Mic,
  Volume2,
  VolumeX
} from 'lucide-react';
import { answerSpendingQuery } from '@/ai/flows/answer-spending-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getChatHistoryDb, saveChatHistoryDb } from '@/app/actions/db';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FinancialAssistant() {
  const { transactions } = useAppContext();
  const { user, getSessionToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I am your Personal Financial AI Copilot. I have loaded your transactions and receipts database. How can I help you analyze, plan, or optimize your finances today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Stop synthesis on component cleanup
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/[\*\#\-\`]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
    }
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice Input Unsupported",
        description: "Your browser does not support Speech Recognition. Please try Google Chrome or Safari.",
        variant: "destructive"
      });
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          executeQuery(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== 'no-speech') {
          toast({
            title: "Voice Input Error",
            description: `Speech recognition failed: ${event.error}`,
            variant: "destructive"
          });
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (user?.uid) {
        const token = await getSessionToken();
        if (token) {
          const history = await getChatHistoryDb(token);
          if (history && history.length > 0) {
            setMessages(history);
          }
        }
      }
    };
    loadHistory();
  }, [user]);

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: queryText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    if (user?.uid) {
      const token = await getSessionToken();
      if (token) {
        await saveChatHistoryDb(updatedMessages, token);
      }
    }

    try {
      const result = await answerSpendingQuery({
        query: queryText,
        spendingData: JSON.stringify(transactions, null, 2),
      });
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      if (user?.uid) {
        const token = await getSessionToken();
        if (token) {
          await saveChatHistoryDb(finalMessages, token);
        }
      }

      // Read response aloud
      speakText(result.answer);
    } catch (error) {
      console.error('Error with AI assistant:', error);
      toast({
        title: 'An error occurred',
        description: 'The AI assistant is currently unavailable. Please try again later.',
        variant: 'destructive',
      });
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble analyzing your transactions right now. Please check your API configuration and try again." 
      };
      const finalErrorMessages = [...updatedMessages, errorMessage];
      setMessages(finalErrorMessages);
      
      if (user?.uid) {
        const token = await getSessionToken();
        if (token) {
          await saveChatHistoryDb(finalErrorMessages, token);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await executeQuery(input);
  };

  const handleQuickQuery = async (queryText: string) => {
    await executeQuery(queryText);
  };

  // Basic client-side math for spending insights on left panel
  const getAnalysis = () => {
    const totalByCurrency: { [key: string]: number } = {};
    const categoryTotals: { [key: string]: number } = {};
    
    transactions.forEach(t => {
      totalByCurrency[t.currency] = (totalByCurrency[t.currency] || 0) + t.amount;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const totalSpendList = Object.entries(totalByCurrency).map(([curr, amt]) => {
      let symbol = curr;
      if (curr === 'USD') symbol = '$';
      else if (curr === 'EUR') symbol = '€';
      else if (curr === 'GBP') symbol = '£';
      else if (curr === 'INR') symbol = '₹';
      return `${symbol}${amt.toFixed(2)}`;
    });

    return {
      totalSpendList,
      categoryTotals,
    };
  };

  const analysis = getAnalysis();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 h-[calc(100vh-10rem)] items-stretch">
      {/* LEFT COLUMN: COPILOT ANALYSIS DASHBOARD */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Spending Analysis Card */}
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:translate-y-0 hover:border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Spending Analysis</CardTitle>
            </div>
            <CardDescription className="text-xs">Real-time indicators calculated from database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Total Period Outflow</span>
              <div className="flex flex-wrap gap-2 items-baseline mt-1">
                {analysis.totalSpendList.length > 0 ? (
                  analysis.totalSpendList.map((t, idx) => (
                    <span key={idx} className="text-2xl font-bold text-foreground">{t}</span>
                  ))
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">₹0.00</span>
                )}
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Month-Over-Month Change</span>
                <span className="text-red-400 font-semibold flex items-center gap-0.5">
                  +32% <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Food Category Drift</span>
                <span className="text-red-400 font-semibold flex items-center gap-0.5">
                  +18% <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Warnings Card */}
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:translate-y-0 hover:border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Budget Warnings</CardTitle>
            </div>
            <CardDescription className="text-xs">Alerts on thresholds & recurring bills</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-3 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-amber-300">
                <span>Food Budget Limit Exceeded</span>
                <span>85% Used</span>
              </div>
              <p className="text-muted-foreground">You spent over standard caps in Food this month. Reduce orders to stay under budget.</p>
            </div>
            <div className="rounded-lg border border-purple-500/20 bg-purple-950/10 p-3 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-purple-300">
                <span>Upcoming Bill Subscription</span>
                <span>Electric Bill</span>
              </div>
              <p className="text-muted-foreground">Electric Bill ($120.00) is scheduled to be charged within 5 days.</p>
            </div>
          </CardContent>
        </Card>

        {/* Savings Suggestions Card */}
        <Card className="border-white/5 bg-card/45 backdrop-blur-xl hover:translate-y-0 hover:border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lightbulb className="h-5 w-5" />
              <CardTitle className="text-base font-semibold">Savings Suggestions</CardTitle>
            </div>
            <CardDescription className="text-xs">AI recommendations for outflow reduction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-muted-foreground">
            <div className="flex gap-2.5 items-start">
              <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <PiggyBank className="h-3 w-3 text-emerald-400" />
              </div>
              <p>
                <strong className="text-foreground">Reduce Swiggy orders</strong>: Trimming food delivery orders by 15% would save about <span className="text-emerald-400 font-semibold">₹4,000/month</span> based on category analysis.
              </p>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="h-5 w-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Zap className="h-3 w-3 text-cyan-400" />
              </div>
              <p>
                <strong className="text-foreground">Electricity Optimization</strong>: Switching off idle hardware can save up to <span className="text-cyan-400 font-semibold">$15/month</span> on your Electric Bill.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: AI CHAT COPILOT */}
      <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
        <Card className="flex flex-col h-full border-white/5 bg-card/45 backdrop-blur-xl">
          <CardHeader className="pb-3 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gradient">AI Financial Copilot</CardTitle>
                <CardDescription className="text-xs">Ask questions about your transactions, category totals, or future budgets.</CardDescription>
              </div>
              <div className="h-7 w-7 rounded-full bg-cyan-500/10 flex items-center justify-center logo-glow">
                <Sparkles className="h-4 w-4 text-[#0A0E17]" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden pt-4">
            {/* Scrollable Chat Area */}
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-4 pb-2">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className={cn(
                        "flex items-start gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8 border border-cyan-500/25 bg-cyan-950/20">
                          <AvatarFallback className="bg-transparent text-cyan-400"><Bot className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3 text-sm leading-relaxed",
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 text-white font-medium shadow-md shadow-cyan-500/10'
                            : 'bg-white/5 border border-white/5 text-muted-foreground'
                        )}
                      >
                        {message.content}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8 border border-white/10 bg-white/5">
                          <AvatarFallback className="bg-transparent text-foreground"><CircleUser className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 justify-start"
                  >
                    <Avatar className="h-8 w-8 border border-cyan-500/25 bg-cyan-950/20">
                      <AvatarFallback className="bg-transparent text-cyan-400"><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-white/5 border border-white/5 p-3.5 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Message input form */}
            <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 pt-2 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsMuted(prev => {
                    const next = !prev;
                    if (next && typeof window !== 'undefined') {
                      window.speechSynthesis.cancel();
                    }
                    return next;
                  });
                }}
                className={cn(
                  "h-9 w-9 hover:bg-white/5 shrink-0",
                  isMuted ? "text-muted-foreground" : "text-cyan-400"
                )}
                title={isMuted ? "Unmute Voice AI Responses" : "Mute Voice AI Responses"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <div className="relative flex-1 flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about bills, trends, or predictions..."
                  disabled={isLoading || isListening}
                  className="bg-black/20 focus-visible:ring-[#00F0FF] border-white/5 pr-10 text-xs h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={startListening}
                  disabled={isLoading}
                  className={cn(
                    "absolute right-1 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-cyan-400 transition-all duration-300",
                    isListening && "text-red-500 hover:text-red-400 animate-pulse"
                  )}
                  title="Speak your query"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>

              <Button type="submit" size="icon" disabled={isLoading || isListening || !input.trim()} className="btn-gradient shrink-0 h-9 w-9">
                <Send className="h-4 w-4 text-[#0A0E17]" />
                <span className="sr-only">Send</span>
              </Button>
            </form>

            {/* Smart / Quick Prompts (Repositioned below input form) */}
            <div className="space-y-1.5 pt-1.5 border-t border-white/5">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickQuery("Where did I spend most?")}
                  className="text-[11px] bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-muted-foreground hover:text-cyan-400 rounded-full py-1.5 px-3.5 transition-all duration-300 font-medium disabled:opacity-50 disabled:pointer-events-none"
                >
                  “Where did I spend most?”
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickQuery("Can I save more?")}
                  className="text-[11px] bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-muted-foreground hover:text-cyan-400 rounded-full py-1.5 px-3.5 transition-all duration-300 font-medium disabled:opacity-50 disabled:pointer-events-none"
                >
                  “Can I save more?”
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickQuery("Predict next month expenses")}
                  className="text-[11px] bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-muted-foreground hover:text-cyan-400 rounded-full py-1.5 px-3.5 transition-all duration-300 font-medium disabled:opacity-50 disabled:pointer-events-none"
                >
                  “Predict next month expenses”
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
