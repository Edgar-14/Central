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
  ineDataUri: z.string().describe("A photo of the driver's INE document, as a data URI."),
  licenseDataUri: z.string().describe("A photo of the driver's license, as a data URI."),
  insuranceDataUri: z.string().describe("A photo of the driver's insurance policy, as a data URI."),
  addressProofDataUri: z.string().describe("A photo of the driver's proof of address, as a data URI."),
  taxIdDataUri: z.string().describe("A photo of the driver's tax ID document, as a data URI."),
  circulationCardDataUri: z.string().describe("A photo of the driver's circulation card, as a data URI."),
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

  INE Document: {{media url=ineDataUri}}
  License Document: {{media url=licenseDataUri}}
  Insurance Document: {{media url=insuranceDataUri}}
  Address Proof Document: {{media url=addressProofDataUri}}
  Tax ID Document: {{media url=taxIdDataUri}}
  Circulation Card Document: {{media url=circulationCardDataUri}}`,
});

const summarizeDriverDocumentsFlow = ai.defineFlow({
  name: 'summarizeDriverDocumentsFlow',
  inputSchema: SummarizeDriverDocumentsInputSchema,
  outputSchema: SummarizeDriverDocumentsOutputSchema,
}, async (input) => {
  const {output} = await summarizeDriverDocumentsPrompt(input);
  return output!;
});
