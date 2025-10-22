'use server';

/**
 * @fileOverview Analyzes product expiration dates and suggests actions.
 *
 * - analyzeExpirationDates - A function that takes in a list of products with expiration dates and suggests actions.
 * - AnalyzeExpirationDatesInput - The input type for the analyzeExpirationDates function.
 * - AnalyzeExpirationDatesOutput - The return type for the analyzeExpirationDates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeExpirationDatesInputSchema = z.object({
  products: z.array(
    z.object({
      barcode: z.string().describe('The barcode of the product.'),
      expirationDate: z.string().describe('The expiration date of the product in YYYY-MM-DD format.'),
      quantity: z.number().describe('The quantity of the product.'),
    })
  ).describe('A list of products with their expiration dates and quantities.'),
  businessRules: z.string().optional().describe('Optional business rules to consider when suggesting actions.'),
});
export type AnalyzeExpirationDatesInput = z.infer<typeof AnalyzeExpirationDatesInputSchema>;

const AnalyzeExpirationDatesOutputSchema = z.array(
  z.object({
    barcode: z.string().describe('The barcode of the product.'),
    suggestedAction: z.string().describe('The suggested action for the product (e.g., discount, remove from shelf).'),
    reason: z.string().describe('The reason for the suggested action.'),
  })
);
export type AnalyzeExpirationDatesOutput = z.infer<typeof AnalyzeExpirationDatesOutputSchema>;

export async function analyzeExpirationDates(input: AnalyzeExpirationDatesInput): Promise<AnalyzeExpirationDatesOutput> {
  return analyzeExpirationDatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expirationDateAlertsPrompt',
  input: {schema: AnalyzeExpirationDatesInputSchema},
  output: {schema: AnalyzeExpirationDatesOutputSchema},
  prompt: `You are an AI assistant helping a store manager minimize waste and maximize sales by analyzing product expiration dates.

Analyze the expiration dates of the following products and suggest actions based on the remaining shelf life and the following business rules (if any):

Business Rules: {{{businessRules}}}

Products:
{{#each products}}
- Barcode: {{barcode}}, Expiration Date: {{expirationDate}}, Quantity: {{quantity}}
{{/each}}

Consider the following when suggesting actions:
*   Products close to expiration should be discounted to encourage sales.
*   Products that have expired should be removed from the shelf.
*   Take into account the business rules when suggesting actions.

Return a JSON array of objects with the following format:
[
  {
    "barcode": "product barcode",
    "suggestedAction": "suggested action (e.g., discount, remove from shelf)",
    "reason": "reason for the suggested action"
  }
]
`,
});

const analyzeExpirationDatesFlow = ai.defineFlow(
  {
    name: 'analyzeExpirationDatesFlow',
    inputSchema: AnalyzeExpirationDatesInputSchema,
    outputSchema: AnalyzeExpirationDatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
