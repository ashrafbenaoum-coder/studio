"use client";

import type { Product } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO } from "date-fns";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

function getStatus(expirationDate: string): {
  label: string;
  variant: "default" | "secondary" | "destructive";
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = parseISO(expirationDate);
  const daysDiff = differenceInDays(expDate, today);

  if (daysDiff < 0) {
    return { label: "Expiré", variant: "destructive" };
  }
  if (daysDiff <= 7) {
    return { label: "Expire bientôt", variant: "secondary" };
  }
  return { label: "En stock", variant: "default" };
}

export function InventoryList({ products }: { products: Product[] }) {
  const handleExport = () => {
    const dataToExport = products.map((product) => ({
      "Code Barre": product.barcode,
      Adresse: product.address,
      Quantité: product.quantity,
      "Date d'expiration": product.expirationDate,
      Statut: getStatus(product.expirationDate).label,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
    XLSX.writeFile(workbook, "inventaire_stockflow.xlsx");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle>Inventaire Actuel</CardTitle>
          <CardDescription>
            Liste de tous les produits actuellement en stock.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit (Code Barre)</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead>Date d'exp.</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Aucun produit dans l'inventaire.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const status = getStatus(product.expirationDate);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.barcode}
                      </TableCell>
                      <TableCell>{product.address}</TableCell>
                      <TableCell className="text-center">
                        {product.quantity}
                      </TableCell>
                      <TableCell>{product.expirationDate}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={status.variant} className="capitalize">
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
