
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
import { Plus, Store as StoreIcon, Trash2 } from "lucide-react";
import type { Store } from "@/lib/types";

const initialStores: Store[] = [
  { id: "1", name: "Magasin Principal" },
  { id: "2", name: "Entrepôt Sud" },
];

export function StoresDashboard() {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [newStoreName, setNewStoreName] = useState("");
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  const handleAddStore = () => {
    if (newStoreName.trim()) {
      const newStore: Store = {
        id: new Date().getTime().toString(),
        name: newStoreName.trim(),
      };
      setStores((prev) => [...prev, newStore]);
      setNewStoreName("");
    }
  };

  const handleDeleteStore = (store: Store) => {
    setStores((prev) => prev.filter((s) => s.id !== store.id));
    setStoreToDelete(null);
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
        <CardHeader>
          <CardTitle>Gérer les magasins</CardTitle>
          <CardDescription>
            Ajoutez un nouveau magasin ou sélectionnez-en un pour gérer ses rayons.
          </CardDescription>
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
    </div>
  );
}
