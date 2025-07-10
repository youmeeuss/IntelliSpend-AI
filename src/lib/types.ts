export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: 'Groceries' | 'Transport' | 'Entertainment' | 'Bills' | 'Shopping' | 'Food';
  amount: number;
  location: string;
};

export type Receipt = {
  id: string;
  vendor: string;
  date: string;
  totalAmount: number;
  items: { description: string; price: number }[];
  imageUrl: string;
};

export type WalletPass = {
  id: string;
  type: 'Receipt Summary' | 'Budget Tip' | 'Investment Plan';
  title: string;
  description: string;
  cta: string;
};
