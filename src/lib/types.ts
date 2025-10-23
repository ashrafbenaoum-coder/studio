
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
  address: string;
  barcode: string;
  quantity: number;
  expirationDate: string; // YYYYMMDD
  aisleId: string;
  storeId: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: "Administrator" | "Viewer";
    displayName?: string;
}

export interface Login {
  email: string;
}


export type Alert = AnalyzeExpirationDatesOutput[0];
