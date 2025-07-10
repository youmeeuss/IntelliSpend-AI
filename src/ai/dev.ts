import { config } from 'dotenv';
config();

import '@/ai/flows/answer-spending-query.ts';
import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/generate-investment-recommendations.ts';