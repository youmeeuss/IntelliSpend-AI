"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockTransactions as initialTransactions, mockReceipts as initialReceipts } from '@/lib/data';
import type { Transaction, Receipt } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { getTransactionsDb, addTransactionDb, getReceiptsDb, addReceiptDb } from '@/app/actions/db';

interface AppContextType {
  transactions: Transaction[];
  receipts: Receipt[];
  addTransaction: (tx: Transaction) => void;
  addReceipt: (receipt: Receipt) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [mounted, setMounted] = useState(false);
  const { user, getSessionToken } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      if (user?.uid) {
        const token = await getSessionToken();
        if (!token) return;

        // 1. Fetch transactions from MongoDB
        const dbTxs = await getTransactionsDb(token);
        if (dbTxs !== null) {
          setTransactions(dbTxs as Transaction[]);
        } else {
          // Fallback to local storage
          const savedTx = localStorage.getItem('transactions');
          if (savedTx) {
            try { setTransactions(JSON.parse(savedTx)); } catch (e) {}
          } else {
            setTransactions(initialTransactions);
          }
        }

        // 2. Fetch receipts from MongoDB
        const dbRxs = await getReceiptsDb(token);
        if (dbRxs !== null) {
          setReceipts(dbRxs as Receipt[]);
        } else {
          // Fallback to local storage
          const savedRx = localStorage.getItem('receipts');
          if (savedRx) {
            try { setReceipts(JSON.parse(savedRx)); } catch (e) {}
          } else {
            setReceipts(initialReceipts);
          }
        }
      } else {
        // Load default values or fallback local storage if logged out
        const savedTx = localStorage.getItem('transactions');
        const savedRx = localStorage.getItem('receipts');
        if (savedTx) {
          try { setTransactions(JSON.parse(savedTx)); } catch (e) {}
        } else {
          setTransactions(initialTransactions);
        }
        if (savedRx) {
          try { setReceipts(JSON.parse(savedRx)); } catch (e) {}
        } else {
          setReceipts(initialReceipts);
        }
      }
    };

    loadData();
  }, [user, mounted]);

  const addTransaction = async (tx: Transaction) => {
    setTransactions(prev => {
      const updated = [tx, ...prev];
      localStorage.setItem('transactions', JSON.stringify(updated));
      return updated;
    });

    if (user?.uid) {
      const token = await getSessionToken();
      if (token) {
        await addTransactionDb(tx, token);
      }
    }
  };

  const addReceipt = async (receipt: Receipt) => {
    setReceipts(prev => {
      const updated = [receipt, ...prev];
      localStorage.setItem('receipts', JSON.stringify(updated));
      return updated;
    });

    if (user?.uid) {
      const token = await getSessionToken();
      if (token) {
        await addReceiptDb(receipt, token);
      }
    }
  };

  if (!mounted) {
      return null; // Prevents hydration mismatch on first render
  }

  return (
    <AppContext.Provider value={{ transactions, receipts, addTransaction, addReceipt }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
