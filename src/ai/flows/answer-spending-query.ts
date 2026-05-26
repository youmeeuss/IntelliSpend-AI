// src/ai/flows/answer-spending-query.ts
'use server';

/**
 * @fileOverview An AI agent that answers user queries about their spending habits.
 *
 * - answerSpendingQuery - A function that handles the process of answering a user's spending query.
 * - AnswerSpendingQueryInput - The input type for the answerSpendingQuery function.
 * - AnswerSpendingQueryOutput - The return type for the answerSpendingQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini} from '@genkit-ai/googleai';

const AnswerSpendingQueryInputSchema = z.object({
  query: z.string().describe("The user's question about their spending habits."),
  spendingData: z.string().describe('The user spending data.'),
});
export type AnswerSpendingQueryInput = z.infer<typeof AnswerSpendingQueryInputSchema>;

const AnswerSpendingQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query about their spending habits.'),
});
export type AnswerSpendingQueryOutput = z.infer<typeof AnswerSpendingQueryOutputSchema>;

export async function answerSpendingQuery(input: AnswerSpendingQueryInput): Promise<AnswerSpendingQueryOutput> {
  return answerSpendingQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerSpendingQueryPrompt',
  input: {schema: AnswerSpendingQueryInputSchema},
  output: {schema: AnswerSpendingQueryOutputSchema},
  model: gemini('gemini-2.5-flash'),
  config: { temperature: 0.1 },
  prompt: `You are a highly intelligent Personal Financial AI Copilot. You analyze the user's transaction and spending data to provide precise, insightful, and actionable financial advice.

When answering, adhere to the following rules:
1. **Currency Accuracy**: ALWAYS include the correct currency symbol and code based on the 'currency' field provided in each transaction (e.g., $, €, £, ₹). DO NOT convert values to USD or default to USD. Use native currency symbols throughout.
2. **Contextual awareness**: Reference vendor names and transaction locations to explain where money is going.
3. **Handle Smart / Advanced Queries**:
   - **Expense Prediction**: If the user asks to predict their next month's expenses, analyze their transaction dates and amounts. Compute their average weekly or monthly run-rate and project next month's total, pointing out recurring items (like electricity bills) or seasonal category surges.
   - **Savings Tips**: If the user asks how to save more, identify their highest spending areas (like Food or Shopping) and calculate concrete targets (e.g. "If you reduce Food expenses by 15%, you can save about ₹3,500 per month").
   - **Top Spending**: If the user asks where they spend most, sum up values by category and vendor. Identify and list the top category and top 3 vendors, along with exact transaction counts and totals.
4. **Professional tone**: Be encouraging, direct, and completely honest. If there is no transaction history or data is too sparse to answer, explain that politely and suggest they add a transaction or upload a receipt to start.

User Query: {{{query}}}

Spending Data: {{{spendingData}}}

Answer:`,
});

const answerSpendingQueryFlow = ai.defineFlow(
  {
    name: 'answerSpendingQueryFlow',
    inputSchema: AnswerSpendingQueryInputSchema,
    outputSchema: AnswerSpendingQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
