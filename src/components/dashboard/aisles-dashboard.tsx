
"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Archive, Trash2, Loader2, FileSpreadsheet } from "lucide-react";
import type { Aisle, Store, Product } from "@/lib/types";
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
  useCollection,
  useDoc,
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


export function AislesDashboard({ storeId }: { storeId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, startExportTransition] = useTransition();

  const storeDocRef = useMemoFirebase(
    () => (user ? doc(firestore, "users", user.uid, "stores", storeId) : null),
    [firestore, user, storeId]
  );
  const { data: store, isLoading: isStoreLoading } = useDoc<Omit<Store, "id">>(storeDocRef);

  const aislesQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, "users", user.uid, "stores", storeId, "aisles") : null,
    [firestore, user, storeId]
  );
  const { data: aisles, isLoading: areAislesLoading } = useCollection<Omit<Aisle, "id">>(aislesQuery);

  const [newAisleName, setNewAisleName] = useState("");
  const [aisleToDelete, setAisleToDelete] = useState<Aisle | null>(null);

  const handleAddAisle = () => {
    if (newAisleName.trim() && user && aislesQuery) {
      const newAisle = {
        name: newAisleName.trim(),
        storeId,
      };
      addDocumentNonBlocking(aislesQuery, newAisle);
      setNewAisleName("");
    }
  };

  const handleDeleteAisle = (aisle: Aisle) => {
    if (user) {
      const docRef = doc(firestore, "users", user.uid, "stores", storeId, "aisles", aisle.id);
      deleteDocumentNonBlocking(docRef);
      setAisleToDelete(null);
    }
  };
  
  const handleExportAll = () => {
    if (!user || !aisles || aisles.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune donnée à exporter",
        description: "Il n'y a aucun rayon ou produit dans ce magasin.",
      });
      return;
    }

    startExportTransition(async () => {
      try {
        let allProducts: Product[] = [];
        
        for (const aisle of aisles) {
          const productsQuery = collection(firestore, "users", user.uid, "stores", storeId, "aisles", aisle.id, "products");
          const productsSnapshot = await getDocs(productsQuery);
          const aisleProducts = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
          allProducts = [...allProducts, ...aisleProducts];
        }

        if (allProducts.length === 0) {
          toast({
            variant: "destructive",
            title: "Aucun produit à exporter",
            description: "Aucun produit n'a été trouvé dans les rayons de ce magasin.",
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
        saveAs(blob, `inventaire-complet-${store?.name}-${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
          title: "Exportation terminée",
          description: "Le fichier d'inventaire complet a été téléchargé avec succès.",
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

  const isLoading = isStoreLoading || areAislesLoading;

  const sortedAisles = useMemo(() => {
    if (!aisles) return [];
    return [...aisles].sort((a, b) => a.name.localeCompare(b.name));
  }, [aisles]);

  return (
    <div className="space-y-6">
      <AlertDialog
        open={!!aisleToDelete}
        onOpenChange={(open) => !open && setAisleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rayon "{aisleToDelete?.name}" et toutes ses données seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => aisleToDelete && handleDeleteAisle(aisleToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/stores">Magasins</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{store?.name ?? 'Chargement...'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Gérer les rayons pour {store?.name ?? '...'}</CardTitle>
                <CardDescription>
                    Ajoutez un nouveau rayon ou sélectionnez-en un pour gérer son inventaire.
                </CardDescription>
            </div>
             <Button variant="outline" size="sm" onClick={handleExportAll} disabled={isExporting}>
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
            placeholder="Nom du nouveau rayon"
            value={newAisleName}
            onChange={(e) => setNewAisleName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddAisle()}
          />
          <Button onClick={handleAddAisle}>
            <Plus className="mr-2" />
            Ajouter
          </Button>
        </CardContent>
      </Card>
      
      {isLoading && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />}

      {!isLoading && sortedAisles && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAisles.map((aisle) => (
            <Card key={aisle.id} className="group relative transition-colors hover:bg-muted/50">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAisleToDelete(aisle);
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Supprimer le rayon</span>
              </Button>
              <Link
                href={`/dashboard/stores/${storeId}/aisles/${aisle.id}`}
                passHref
                className="block h-full cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{aisle.name}</CardTitle>
                  <Archive className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Cliquez pour gérer les produits de ce rayon.
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
      {!isLoading && sortedAisles?.length === 0 && (
         <div className="pt-4 text-center text-sm text-muted-foreground">
            Aucun rayon trouvé pour ce magasin.
        </div>
      )}
    </div>
  );
}
