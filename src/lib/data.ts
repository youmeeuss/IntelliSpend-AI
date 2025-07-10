import type { Transaction, Receipt, WalletPass } from './types';

export const mockTransactions: Transaction[] = [
  { id: '1', date: '2024-07-15', description: 'Grocery Store', category: 'Groceries', amount: 75.6, location: 'Downtown' },
  { id: '2', date: '2024-07-15', description: 'Gas Station', category: 'Transport', amount: 40.0, location: 'Highway' },
  { id: '3', date: '2024-07-14', description: 'Cinema Tickets', category: 'Entertainment', amount: 30.0, location: 'Mall' },
  { id: '4', date: '2024-07-14', description: 'Restaurant', category: 'Food', amount: 55.2, location: 'Downtown' },
  { id: '5', date: '2024-07-13', description: 'Electric Bill', category: 'Bills', amount: 120.0, location: 'Home' },
  { id: '6', date: '2024-07-12', description: 'Clothing Store', category: 'Shopping', amount: 150.0, location: 'Mall' },
  { id: '7', date: '2024-07-11', description: 'Supermarket', category: 'Groceries', amount: 95.25, location: 'Suburbs' },
  { id: '8', date: '2024-07-10', description: 'Coffee Shop', category: 'Food', amount: 12.5, location: 'Downtown' },
];

export const mockReceipts: Receipt[] = [
  {
    id: 'r1',
    vendor: 'Tech Gagdets Inc.',
    date: '2024-07-10',
    totalAmount: 299.99,
    items: [{ description: 'Wireless Headphones', price: 299.99 }],
    imageUrl: 'https://placehold.co/300x400.png',
  },
  {
    id: 'r2',
    vendor: 'Fresh Foods Market',
    date: '2024-07-15',
    totalAmount: 75.6,
    items: [
      { description: 'Organic Apples', price: 5.99 },
      { description: 'Whole Milk', price: 3.49 },
      { description: 'Bread', price: 2.99 },
    ],
    imageUrl: 'https://placehold.co/300x400.png',
  },
];

export const mockWalletPasses: WalletPass[] = [
    {
        id: 'wp1',
        type: 'Receipt Summary',
        title: 'Tech Gadgets Inc.',
        description: 'Your purchase of Wireless Headphones for $299.99 on July 10, 2024.',
        cta: 'View Receipt',
    },
    {
        id: 'wp2',
        type: 'Budget Tip',
        title: 'Save on Groceries',
        description: 'You spent $170.85 on groceries this month. Try planning meals to save more!',
        cta: 'See spending',
    },
    {
        id: 'wp3',
        type: 'Investment Plan',
        title: 'Growth Portfolio',
        description: 'Your personalized growth portfolio is up 5.2% this quarter.',
        cta: 'View Investments',
    }
];

export const monthlySpending = [
  { month: 'Jan', spending: 4000 },
  { month: 'Feb', spending: 3000 },
  { month: 'Mar', spending: 5000 },
  { month: 'Apr', spending: 4500 },
  { month: 'May', spending: 6000 },
  { month: 'Jun', spending: 5500 },
  { month: 'Jul', spending: 4800 },
];

export const spendingByCategory = [
  { name: 'Groceries', value: 400, fill: 'hsl(var(--chart-1))' },
  { name: 'Shopping', value: 300, fill: 'hsl(var(--chart-2))' },
  { name: 'Food', value: 300, fill: 'hsl(var(--chart-3))' },
  { name: 'Bills', value: 200, fill: 'hsl(var(--chart-4))' },
  { name: 'Transport', value: 278, fill: 'hsl(var(--chart-5))' },
];

export const spendingDataForAI = JSON.stringify(mockTransactions, null, 2);
