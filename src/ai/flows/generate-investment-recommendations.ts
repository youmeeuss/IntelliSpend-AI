'use server';

/**
 * @fileOverview Flow for generating personalized investment recommendations based on user input and risk profile.
 *
 * - generateInvestmentRecommendations - A function that generates investment recommendations.
 * - InvestmentRecommendationsInput - The input type for the generateInvestmentRecommendations function.
 * - InvestmentRecommendationsOutput - The output type for the generateInvestmentRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini} from '@genkit-ai/googleai';

const InvestmentRecommendationsInputSchema = z.object({
  income: z.number().describe('Annual income of the user.'),
  savings: z.number().describe('Total savings of the user.'),
  riskTolerance: z
    .enum(['low', 'medium', 'high'])
    .describe('Risk tolerance of the user (low, medium, or high).'),
  investmentGoals: z
    .string()
    .describe('The investment goals of the user, e.g., retirement, buying a house, etc.'),
  age: z.number().describe('The age of the user.'),
});

export type InvestmentRecommendationsInput = z.infer<
  typeof InvestmentRecommendationsInputSchema
>;

const InvestmentRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('Personalized investment recommendations based on user input.'),
});

export type InvestmentRecommendationsOutput = z.infer<
  typeof InvestmentRecommendationsOutputSchema
>;

export async function generateInvestmentRecommendations(
  input: InvestmentRecommendationsInput
): Promise<InvestmentRecommendationsOutput> {
  return generateInvestmentRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentRecommendationsPrompt',
  model: gemini('gemini-2.5-flash'),
  input: {schema: InvestmentRecommendationsInputSchema},
  output: {schema: InvestmentRecommendationsOutputSchema},
  prompt: `You are an expert financial advisor. Based on the user's financial situation, risk tolerance, investment goals and age, provide personalized investment recommendations.
IMPORTANT: Present your recommendations in a highly readable, structured Markdown format. 
Use bullet points for step-by-step guidance. Use Markdown tables to break down recommended asset allocations, budgets, or plans so they are easy to understand at a glance. Make it simple and easy to digest for human brains.

User Income: {{income}}
User Savings: {{savings}}
User Risk Tolerance: {{riskTolerance}}
User Investment Goals: {{investmentGoals}}
User Age: {{age}}

Provide investment recommendations:`,
});

const generateInvestmentRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateInvestmentRecommendationsFlow',
    inputSchema: InvestmentRecommendationsInputSchema,
    outputSchema: InvestmentRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
