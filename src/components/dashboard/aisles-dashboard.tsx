
"use client";

import { useState } from "react";
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
import { Plus, Archive, Trash2, Loader2 } from "lucide-react";
import type { Aisle, Store } from "@/lib/types";
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
import { collection, doc } from "firebase/firestore";

export function AislesDashboard({ storeId }: { storeId: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

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

  const isLoading = isStoreLoading || areAislesLoading;

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
        <CardHeader>
          <CardTitle>Gérer les rayons pour {store?.name ?? '...'}</CardTitle>
          <CardDescription>
            Ajoutez un nouveau rayon ou sélectionnez-en un pour gérer son inventaire.
          </CardDescription>
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

      {!isLoading && aisles && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aisles.map((aisle) => (
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
      {!isLoading && aisles?.length === 0 && (
         <div className="pt-4 text-center text-sm text-muted-foreground">
            Aucun rayon trouvé pour ce magasin.
        </div>
      )}
    </div>
  );
}
