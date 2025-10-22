"use server";

import {
  analyzeExpirationDates,
  type AnalyzeExpirationDatesInput,
} from "@/ai/flows/expiration-date-alerts";
import type { Product } from "@/lib/types";
import * as XLSX from "xlsx";

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

export async function exportToExcel(products: Product[]) {
    const dataToExport = products.map((product) => ({
      "Code Barre": product.barcode,
      Adresse: product.address,
      Quantité: product.quantity,
      "Date d'expiration": product.expirationDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
    
    // This part is tricky on the server. We'll return the data and handle download on client.
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buf).toString('base64');
}
