"use client";

import { useState, useTransition } from "react";
import { runExpirationAnalysis } from "@/lib/actions";
import type { Product, Alert } from "@/lib/types";
import { InventoryForm } from "@/components/dashboard/inventory-form";
import { InventoryList } from "@/components/dashboard/inventory-list";
import { ExpirationAlerts } from "@/components/dashboard/expiration-alerts";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const initialProducts: Product[] = [
  {
    id: "1",
    address: "Aisle 3, Shelf 2",
    barcode: "123456789012",
    quantity: 10,
    expirationDate: format(
      new Date(new Date().setDate(new Date().getDate() + 5)),
      "yyyy-MM-dd"
    ),
  },
  {
    id: "2",
    address: "Aisle 1, Fridge 1",
    barcode: "234567890123",
    quantity: 5,
    expirationDate: format(
      new Date(new Date().setDate(new Date().getDate() - 2)),
      "yyyy-MM-dd"
    ),
  },
  {
    id: "3",
    address: "Aisle 5, Bin 4",
    barcode: "345678901234",
    quantity: 20,
    expirationDate: format(
      new Date(new Date().setDate(new Date().getDate() + 30)),
      "yyyy-MM-dd"
    ),
  },
];

export default function DashboardPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isPending, startTransition] = useTransition();

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = { ...product, id: new Date().getTime().toString() };
    setProducts((prevProducts) => [newProduct, ...prevProducts]);
    toast({
      title: "Produit ajouté",
      description: `Le produit avec le code barre ${product.barcode} a été enregistré.`,
    });
  };

  const handleAnalysis = async () => {
    startTransition(async () => {
      setAlerts([]);
      try {
        const results = await runExpirationAnalysis(products);
        setAlerts(results);
        toast({
          title: "Analyse terminée",
          description: "L'IA a terminé de suggérer des actions.",
        });
      } catch (error) {
        console.error("Failed to run analysis:", error);
        toast({
          variant: "destructive",
          title: "Erreur d'analyse",
          description: "L'analyse par IA a échoué. Veuillez réessayer.",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <InventoryForm onAddProduct={addProduct} />
        <InventoryList products={products} />
      </div>
      <div className="lg:col-span-1">
        <ExpirationAlerts
          alerts={alerts}
          onAnalyze={handleAnalysis}
          isLoading={isPending}
        />
      </div>
    </div>
  );
}
