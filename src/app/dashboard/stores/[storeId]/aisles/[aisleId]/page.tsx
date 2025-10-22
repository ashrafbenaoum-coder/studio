
"use client";

import { useState, useTransition } from "react";
import { runExpirationAnalysis } from "@/lib/actions";
import type { Product, Alert } from "@/lib/types";
import { InventoryForm } from "@/components/dashboard/inventory-form";
import { InventoryList } from "@/components/dashboard/inventory-list";
import { ExpirationAlerts } from "@/components/dashboard/expiration-alerts";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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
    storeId: "1",
    aisleId: "101",
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
    storeId: "1",
    aisleId: "102",
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
    storeId: "2",
    aisleId: "201",
  },
];

export default function InventoryPage({ params }: { params: { storeId: string, aisleId: string } }) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(() => 
    initialProducts.filter(p => p.storeId === params.storeId && p.aisleId === params.aisleId)
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isPending, startTransition] = useTransition();

  // Mock data, in a real app, you'd fetch this.
  const storeName = params.storeId === "1" ? "Magasin Principal" : "Entrepôt Sud";
  const aisleName = params.aisleId === "101" ? "Allée 1 - Frais" : params.aisleId === "102" ? "Allée 2 - Sec" : "Zone A";

  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = { 
        ...product, 
        id: new Date().getTime().toString(),
        storeId: params.storeId,
        aisleId: params.aisleId,
    };
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
    <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard/stores">Magasins</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink href={`/dashboard/stores/${params.storeId}/aisles`}>{storeName}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{aisleName}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
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
    </div>
  );
}
