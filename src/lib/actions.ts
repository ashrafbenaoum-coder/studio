
"use server";

import {
  analyzeExpirationDates,
  type AnalyzeExpirationDatesInput,
} from "@/ai/flows/expiration-date-alerts";
import type { Product } from "@/lib/types";
import { getStatus } from "@/lib/utils";
import * as XLSX from "xlsx";

function formatToISODate(dateStr: string): string {
    if (!/^\d{8}$/.test(dateStr)) {
      return dateStr; // Return original if not in expected format
    }
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
}

export async function runExpirationAnalysis(products: Product[]) {
  const input: AnalyzeExpirationDatesInput = {
    products: products.map((p) => ({
      barcode: p.barcode,
      expirationDate: formatToISODate(p.expirationDate),
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

export async function exportToExcel(products: (Product & { storeName?: string; aisleName?: string })[]) {
    const header: string[] = [];
    const hasStore = products.some(p => p.storeName);
    const hasAisle = products.some(p => p.aisleName);

    if (hasStore) header.push("Nom du Magasin");
    if (hasAisle) header.push("Nom du Rayon");
    header.push("Adresse", "Produit (Code Barre)", "Quantité", "Date d'expiration", "Statut");

    const dataToExport = products.map((product) => {
      const status = getStatus(product.expirationDate);
      const record: any = {};
      if (hasStore) record["Nom du Magasin"] = product.storeName || "-";
      if (hasAisle) record["Nom du Rayon"] = product.aisleName || "-";
      
      record["Adresse"] = product.address;
      record["Produit (Code Barre)"] = product.barcode;
      record["Quantité"] = product.quantity;
      record["Date d'expiration"] = product.expirationDate;
      record["Statut"] = status.label;
      
      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
    
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buf).toString('base64');
}
