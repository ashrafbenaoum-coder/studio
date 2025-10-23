

"use client";

import { useState, useTransition, useMemo, use } from "react";
import { runExpirationAnalysis } from "@/lib/actions";
import type { Product, Store, Aisle } from "@/lib/types";
import { InventoryForm } from "@/components/dashboard/inventory-form";
import { InventoryList } from "@/components/dashboard/inventory-list";
import { ExpirationAlerts } from "@/components/dashboard/expiration-alerts";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, doc, writeBatch, getDocs } from "firebase/firestore";
import type { Alert } from "@/lib/types";

export default function InventoryPage({ params }: { params: Promise<{ storeId: string; aisleId: string }> }) {
  const { storeId, aisleId } = use(params);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const storeDocRef = useMemoFirebase(
    () => (user ? doc(firestore, "users", user.uid, "stores", storeId) : null),
    [firestore, user, storeId]
  );
  const { data: store } = useDoc<Omit<Store, "id">>(storeDocRef);
  
  const aisleDocRef = useMemoFirebase(
    () => (user ? doc(firestore, "users", user.uid, "stores", storeId, "aisles", aisleId) : null),
    [firestore, user, storeId, aisleId]
  );
  const { data: aisle } = useDoc<Omit<Aisle, "id">>(aisleDocRef);

  const productsQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, "users", user.uid, "stores", storeId, "aisles", aisleId, "products") : null,
    [firestore, user, storeId, aisleId]
  );
  const { data: products, isLoading: areProductsLoading } = useCollection<Omit<Product, "id">>(productsQuery);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isPending, startTransition] = useTransition();

  const addProduct = (product: Omit<Product, "id" | "storeId" | "aisleId" >) => {
    if (productsQuery) {
        const newProduct = { 
            ...product, 
            storeId: storeId,
            aisleId: aisleId,
        };
        addDocumentNonBlocking(productsQuery, newProduct);
        toast({
          title: "Produit ajouté",
          description: `Le produit avec le code barre ${product.barcode} a été enregistré.`,
        });
    }
  };
  
  const updateProduct = (product: Product) => {
    if (user) {
        const docRef = doc(firestore, "users", user.uid, "stores", storeId, "aisles", aisleId, "products", product.id);
        const { id, ...productData } = product;
        setDocumentNonBlocking(docRef, productData, { merge: true });
    }
  };

  const deleteProduct = (productId: string) => {
    if (user) {
        const docRef = doc(firestore, "users", user.uid, "stores", storeId, "aisles", aisleId, "products", productId);
        deleteDocumentNonBlocking(docRef);
    }
  };
  
  const deleteAllProducts = async () => {
    if (user && productsQuery) {
        const querySnapshot = await getDocs(productsQuery);
        const batch = writeBatch(firestore);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
  };


  const handleAnalysis = async () => {
    if (!products || products.length === 0) {
       toast({
          variant: "destructive",
          title: "Aucun produit",
          description: "Il n'y a aucun produit à analyser.",
        });
      return;
    }
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
                    <BreadcrumbLink href={`/dashboard/stores/${storeId}/aisles`}>{store?.name ?? '...'}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{aisle?.name ?? '...'}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <InventoryForm onAddProduct={addProduct} aisleName={aisle?.name} />
            <InventoryList
              products={products || []}
              isLoading={areProductsLoading}
              onUpdateProduct={updateProduct}
              onDeleteProduct={deleteProduct}
              onDeleteAllProducts={deleteAllProducts}
            />
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

    