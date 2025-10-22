import type { AnalyzeExpirationDatesOutput } from "@/ai/flows/expiration-date-alerts";

export interface Store {
  id: string;
  name: string;
}

export interface Aisle {
  id: string;
  name: string;
  storeId: string;
}

export interface Product {
  id: string;
  address: string; // This could be deprecated if we use aisles
  barcode: string;
  quantity: number;
  expirationDate: string; // YYYY-MM-DD
  aisleId?: string;
  storeId?: string;
}

export type Alert = AnalyzeExpirationDatesOutput[0];
