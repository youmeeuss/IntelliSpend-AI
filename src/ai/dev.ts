import { config } from 'dotenv';
config();
config({ path: '.env.local', override: true });

import '@/ai/flows/answer-spending-query.ts';
import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/generate-investment-recommendations.ts';