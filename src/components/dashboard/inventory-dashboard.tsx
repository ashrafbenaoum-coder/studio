
"use client";

import { useState, useTransition, useMemo } from "react";
import { runExpirationAnalysis } from "@/lib/actions";
import type { Product, Store, Aisle, UserProfile } from "@/lib/types";
import { InventoryForm } from "@/components/dashboard/inventory-form";
import { InventoryList } from "@/components/dashboard/inventory-list";
import { ExpirationAlerts } from "@/components/dashboard/expiration-alerts";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Users } from "lucide-react";
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

export function InventoryDashboard({ storeId, aisleId, userId: targetUserId }: { storeId: string; aisleId: string, userId?: string }) {
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const userId = targetUserId || currentUser?.uid;
  const isViewingOtherUser = targetUserId && currentUser?.uid !== targetUserId;

  const targetUserDocRef = useMemoFirebase(
    () => (userId ? doc(firestore, "users", userId) : null),
    [firestore, userId]
  );
  const { data: targetUser } = useDoc<UserProfile>(targetUserDocRef);

  const storeDocRef = useMemoFirebase(
    () => (userId ? doc(firestore, "users", userId, "stores", storeId) : null),
    [firestore, userId, storeId]
  );
  const { data: store } = useDoc<Omit<Store, "id">>(storeDocRef);
  
  const aisleDocRef = useMemoFirebase(
    () => (userId ? doc(firestore, "users", userId, "stores", storeId, "aisles", aisleId) : null),
    [firestore, userId, storeId, aisleId]
  );
  const { data: aisle } = useDoc<Omit<Aisle, "id">>(aisleDocRef);

  const productsQuery = useMemoFirebase(
    () =>
      userId ? collection(firestore, "users", userId, "stores", storeId, "aisles", aisleId, "products") : null,
    [firestore, userId, storeId, aisleId]
  );
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

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
    if (userId) {
        const docRef = doc(firestore, "users", userId, "stores", storeId, "aisles", aisleId, "products", product.id);
        const { id, ...productData } = product;
        setDocumentNonBlocking(docRef, productData, { merge: true });
    }
  };

  const deleteProduct = (productId: string) => {
    if (userId) {
        const docRef = doc(firestore, "users", userId, "stores", storeId, "aisles", aisleId, "products", productId);
        deleteDocumentNonBlocking(docRef);
    }
  };
  
  const deleteAllProducts = async () => {
    if (userId && productsQuery) {
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
  
  const usersLink = '/dashboard/users';
  const userStoresLink = `/dashboard/users/${userId}/stores`;
  const userAislesLink = `/dashboard/users/${userId}/stores/${storeId}/aisles`;
  const myStoresLink = '/dashboard/stores';
  const myAislesLink = `/dashboard/stores/${storeId}/aisles`;


  return (
    <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
                {isViewingOtherUser ? (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={usersLink}><Users className="h-4 w-4" /> Utilisateurs</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={userStoresLink}>{targetUser?.displayName || targetUser?.email || '...'}</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={userAislesLink}>{store?.name ?? '...'}</BreadcrumbLink>
                        </BreadcrumbItem>
                    </>
                ) : (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink href={myStoresLink}>Magasins</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={myAislesLink}>{store?.name ?? '...'}</BreadcrumbLink>
                        </BreadcrumbItem>
                    </>
                )}
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
