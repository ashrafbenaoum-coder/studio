
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
    const dataToExport = products.map((product) => {
      const status = getStatus(product.expirationDate);
      const record: any = {
        Adresse: product.address,
        "Produit (Code Barre)": product.barcode,
        Quantité: product.quantity,
        "Date d'expiration": product.expirationDate,
        Statut: status.label,
      };
      if (product.storeName) {
        record["Nom du Magasin"] = product.storeName;
      }
      if (product.aisleName) {
        record["Nom du Rayon"] = product.aisleName;
      }
      return record;
    });

    const orderedData = dataToExport.map(item => {
        const orderedItem: any = {};
        if (item["Nom du Magasin"]) orderedItem["Nom du Magasin"] = item["Nom du Magasin"];
        if (item["Nom du Rayon"]) orderedItem["Nom du Rayon"] = item["Nom du Rayon"];
        
        orderedItem["Adresse"] = item["Adresse"];
        orderedItem["Produit (Code Barre)"] = item["Produit (Code Barre)"];
        orderedItem["Quantité"] = item["Quantité"];
        orderedItem["Date d'expiration"] = item["Date d'expiration"];
        orderedItem["Statut"] = item["Statut"];

        return orderedItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(orderedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
    
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return Buffer.from(buf).toString('base64');
}
