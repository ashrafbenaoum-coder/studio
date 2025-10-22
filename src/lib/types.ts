import type { AnalyzeExpirationDatesOutput } from "@/ai/flows/expiration-date-alerts";

export interface Product {
  id: string;
  address: string;
  barcode: string;
  quantity: number;
  expirationDate: string; // YYYY-MM-DD
}

export type Alert = AnalyzeExpirationDatesOutput[0];
