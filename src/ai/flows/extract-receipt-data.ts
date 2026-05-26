'use server';

/**
 * @fileOverview An AI agent for extracting data from receipts.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {gemini} from '@genkit-ai/googleai';

const ExtractReceiptDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  date: z.string().describe('The date on the receipt in YYYY-MM-DD format.'),
  vendor: z.string().describe('The name of the vendor (shop name).'),
  location: z.string().optional().describe('The physical address, city, or location of the vendor, if present.'),
  totalAmount: z.number().describe('The total amount on the receipt.'),
  currency: z.string().describe('The 3-letter ISO currency code (e.g., USD, EUR, GBP, INR).'),
  tax: z.number().optional().describe('The total tax amount, if present.'),
  category: z.enum(['Groceries', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Food'])
    .describe('The expense category. Map it to one of: Groceries, Transport, Entertainment, Bills, Shopping, Food.'),
  paymentMethod: z.string().describe('The payment method used (e.g. Credit Card, Debit Card, Cash, Mobile Pay, Unknown).'),
  isBlurry: z.boolean().describe('True if the receipt image is blurry, low resolution, or hard to read.'),
  blurExplanation: z.string().optional().describe('Details of why it is blurry or hard to read.'),
  isFraudSuspected: z.boolean().describe('True if fraud or critical mathematical inconsistency is suspected (e.g. item totals + tax do not equal the total amount, or date is in the far future).'),
  fraudExplanation: z.string().optional().describe('Details of why fraud or mathematical discrepancy is suspected.'),
  items: z.array(
    z.object({
      description: z.string().describe('Description of the item'),
      price: z.number().describe('Price of the item'),
      quantity: z.number().optional().describe('Quantity of the item'),
    })
  ).optional().describe('Comprehensive list of items on the receipt.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  model: gemini('gemini-2.5-flash'),
  input: {schema: ExtractReceiptDataInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are a highly advanced, meticulous, and completely honest receipt data extractor and validator. Your job is to extract data from this bill and perform advanced validation checks (math verification, fraud detection, blur detection, currency identification).

Perform the following tasks:
1. **Extract Core Data**: Extract the date (in YYYY-MM-DD format), shop/vendor name, location, total amount, tax amount (if visible, otherwise 0), and all individual items (description, price, quantity).
2. **Determine Currency**: Identify the currency symbol (e.g., $, €, £, ₹, or words) and map to a 3-letter ISO code (e.g., USD, EUR, GBP, INR).
3. **Determine Category**: Categorize the transaction into exactly one of these: 'Groceries', 'Transport', 'Entertainment', 'Bills', 'Shopping', or 'Food'.
4. **Identify Payment Method**: Extract how it was paid (e.g., Credit Card, Debit Card, Cash, Mobile Pay, Apple Pay, Unknown).
5. **Blur & Clarity Check**: Inspect the receipt text legibility. If the image is blurry, low resolution, highly distorted, or unreadable, set 'isBlurry' to true and explain why in 'blurExplanation'.
6. **Math & Fraud Checks**: 
   - Sum the price * quantity of all items, add the tax, and check if it matches the totalAmount. If there is a mathematically significant discrepancy (e.g. more than a few cents off) or if the calculations are clearly altered/suspicious, set 'isFraudSuspected' to true and provide details in 'fraudExplanation'.
   - Also set 'isFraudSuspected' to true if the receipt appears fake, has invalid dates (e.g., in the far future or far past relative to 2026), or uses highly randomized text/values.

Do not hide, skip, or summarize anything. Provide a completely exhaustive extraction of the receipt image.

Receipt Image: {{media url=photoDataUri}}`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
