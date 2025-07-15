'use server';
/**
 * @fileOverview Summarizes driver documents to highlight key information and potential compliance issues.
 *
 * - summarizeDriverDocuments - A function that summarizes driver documents.
 * - SummarizeDriverDocumentsInput - The input type for the summarizeDriverDocuments function.
 * - SummarizeDriverDocumentsOutput - The return type for the summarizeDriverDocuments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDriverDocumentsInputSchema = z.object({
  ineUrl: z.string().describe('URL to the driver INE document.'),
  licenseUrl: z.string().describe('URL to the driver license document.'),
  insuranceUrl: z.string().describe('URL to the driver insurance document.'),
  addressProofUrl: z.string().describe('URL to the driver address proof document.'),
  taxIdUrl: z.string().describe('URL to the driver tax ID document.'),
  circulationCardUrl: z.string().describe('URL to the driver circulation card document.'),
});

export type SummarizeDriverDocumentsInput = z.infer<typeof SummarizeDriverDocumentsInputSchema>;

const SummarizeDriverDocumentsOutputSchema = z.object({
  summary: z.string().describe('Summary of the driver documents, highlighting key information and potential compliance issues.'),
});

export type SummarizeDriverDocumentsOutput = z.infer<typeof SummarizeDriverDocumentsOutputSchema>;

export async function summarizeDriverDocuments(input: SummarizeDriverDocumentsInput): Promise<SummarizeDriverDocumentsOutput> {
  return summarizeDriverDocumentsFlow(input);
}

const summarizeDriverDocumentsPrompt = ai.definePrompt({
  name: 'summarizeDriverDocumentsPrompt',
  input: {schema: SummarizeDriverDocumentsInputSchema},
  output: {schema: SummarizeDriverDocumentsOutputSchema},
  prompt: `You are an administrative assistant who summarizes documents submitted by drivers, highlighting key information and potential compliance issues to help administrators quickly review applications.

  Summarize the following driver documents, and identify any missing information, discrepancies or potential compliance issues.

  INE Document: {{media url=ineUrl}}
  License Document: {{media url=licenseUrl}}
  Insurance Document: {{media url=insuranceUrl}}
  Address Proof Document: {{media url=addressProofUrl}}
  Tax ID Document: {{media url=taxIdUrl}}
  Circulation Card Document: {{media url=circulationCardUrl}}`,
});

const summarizeDriverDocumentsFlow = ai.defineFlow({
  name: 'summarizeDriverDocumentsFlow',
  inputSchema: SummarizeDriverDocumentsInputSchema,
  outputSchema: SummarizeDriverDocumentsOutputSchema,
}, async (input) => {
  const {output} = await summarizeDriverDocumentsPrompt(input);
  return output!;
});
