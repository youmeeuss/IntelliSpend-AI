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

const AnswerSpendingQueryInputSchema = z.object({
  query: z.string().describe('The user's question about their spending habits.'),
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
  prompt: `You are a personal financial assistant. You will answer user questions about their spending habits using the provided data.

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
