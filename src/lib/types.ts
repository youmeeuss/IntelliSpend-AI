export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  location: string;
};

export type Receipt = {
  id: string;
  vendor: string;
  date: string;
  totalAmount: number;
  currency: string;
  items: { description: string; price: number }[];
  imageUrl: string;
  isBlurry?: boolean;
  blurExplanation?: string;
  isFraudSuspected?: boolean;
  fraudExplanation?: string;
};

export type WalletPass = {
  id: string;
  type: 'Receipt Summary' | 'Budget Tip' | 'Investment Plan';
  title: string;
  description: string;
  cta: string;
};
