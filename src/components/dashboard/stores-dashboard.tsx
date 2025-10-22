
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Store as StoreIcon, Trash2, Loader2, FileSpreadsheet } from "lucide-react";
import type { Store, Aisle, Product } from "@/lib/types";
import {
  useCollection,
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from "@/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/actions";
import { saveAs } from "file-saver";

export function StoresDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, startExportTransition] = useTransition();

  const storesQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, "users", user.uid, "stores") : null,
    [firestore, user]
  );
  const { data: stores, isLoading } = useCollection<Omit<Store, "id">>(storesQuery);

  const [newStoreName, setNewStoreName] = useState("");
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  const handleAddStore = () => {
    if (newStoreName.trim() && user && storesQuery) {
      const newStore = {
        name: newStoreName.trim(),
      };
      addDocumentNonBlocking(storesQuery, newStore);
      setNewStoreName("");
    }
  };

  const handleDeleteStore = (store: Store) => {
    if (user) {
      const docRef = doc(firestore, "users", user.uid, "stores", store.id);
      deleteDocumentNonBlocking(docRef);
      setStoreToDelete(null);
    }
  };

  const handleExportAllStores = () => {
    if (!user || !stores || stores.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune donnée à exporter",
        description: "Il n'y a aucun magasin à exporter.",
      });
      return;
    }

    startExportTransition(async () => {
      try {
        let allProducts: Product[] = [];

        for (const store of stores) {
          const aislesQuery = collection(firestore, "users", user.uid, "stores", store.id, "aisles");
          const aislesSnapshot = await getDocs(aislesQuery);
          const aisles = aislesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Aisle));

          for (const aisle of aisles) {
            const productsQuery = collection(firestore, "users", user.uid, "stores", store.id, "aisles", aisle.id, "products");
            const productsSnapshot = await getDocs(productsQuery);
            const aisleProducts = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, storeName: store.name, aisleName: aisle.name } as Product & { storeName: string; aisleName: string; }));
            allProducts = [...allProducts, ...aisleProducts];
          }
        }
        
        if (allProducts.length === 0) {
          toast({
            variant: "destructive",
            title: "Aucun produit à exporter",
            description: "Aucun produit n'a été trouvé dans l'ensemble des magasins.",
          });
          return;
        }

        const base64Data = await exportToExcel(allProducts);
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `inventaire-global-${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
          title: "Exportation terminée",
          description: "L'inventaire global a été téléchargé avec succès.",
        });

      } catch (error) {
        console.error("Failed to export all data:", error);
        toast({
          variant: "destructive",
          title: "Erreur d'exportation",
          description: "L'exportation des données a échoué. Veuillez réessayer.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <AlertDialog
        open={!!storeToDelete}
        onOpenChange={(open) => !open && setStoreToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le magasin "{storeToDelete?.name}" et toutes ses données seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => storeToDelete && handleDeleteStore(storeToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gérer les magasins</CardTitle>
              <CardDescription>
                Ajoutez un nouveau magasin ou sélectionnez-en un pour gérer ses rayons.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportAllStores} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                {isExporting ? "Exportation..." : "Exporter tout"}
            </Button>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Nom du nouveau magasin"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
          />
          <Button onClick={handleAddStore}>
            <Plus className="mr-2" />
            Ajouter
          </Button>
        </CardContent>
      </Card>
      
      {isLoading && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />}

      {!isLoading && stores && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="group relative transition-colors hover:bg-muted/50">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStoreToDelete(store);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Supprimer le magasin</span>
              </Button>
              <Link
                href={`/dashboard/stores/${store.id}/aisles`}
                passHref
                className="block h-full cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{store.name}</CardTitle>
                  <StoreIcon className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Cliquez pour gérer les rayons de ce magasin.
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && stores?.length === 0 && (
         <div className="pt-4 text-center text-sm text-muted-foreground">
            Aucun magasin trouvé. Commencez par en ajouter un nouveau.
        </div>
      )}
    </div>
  );
}
