"use server";

import {
  analyzeExpirationDates,
  type AnalyzeExpirationDatesInput,
} from "@/ai/flows/expiration-date-alerts";
import type { Product } from "@/lib/types";

export async function runExpirationAnalysis(products: Product[]) {
  const input: AnalyzeExpirationDatesInput = {
    products: products.map((p) => ({
      barcode: p.barcode,
      // Convert YYYY-MM-DD from date picker to YYYYMMDD for the AI flow
      expirationDate: p.expirationDate.replace(/-/g, ""),
      quantity: p.quantity,
    })),
    businessRules:
      "Pour les produits expirant dans 7 jours ou moins, suggérer une promotion de 50%. Pour les produits déjà expirés, suggérer de les retirer des rayons.",
  };

  try {
    const suggestions = await analyzeExpirationDates(input);
    return suggestions;
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error("Failed to get suggestions from AI.");
  }
}
