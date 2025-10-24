
"use client";

import { useState, useMemo } from "react";
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
import { Plus, Store as StoreIcon, Trash2, Loader2, Users } from "lucide-react";
import type { Store, UserProfile } from "@/lib/types";
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
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";


export function StoresDashboard({ userId: targetUserId }: { userId?: string }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const userId = targetUserId || currentUser?.uid;
  const isViewingOtherUser = targetUserId && currentUser?.uid !== targetUserId;

  const targetUserDocRef = useMemoFirebase(
    () => (userId ? doc(firestore, "users", userId) : null),
    [firestore, userId]
  );
  const { data: targetUser } = useDoc<UserProfile>(targetUserDocRef);

  const storesQuery = useMemoFirebase(
    () => (userId ? collection(firestore, "users", userId, "stores") : null),
    [firestore, userId]
  );
  const { data: stores, isLoading } = useCollection<Store>(storesQuery);

  const [newStoreName, setNewStoreName] = useState("");
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  const handleAddStore = () => {
    if (newStoreName.trim() && userId && storesQuery) {
      const newStore = {
        name: newStoreName.trim(),
      };
      addDocumentNonBlocking(storesQuery, newStore);
      setNewStoreName("");
    }
  };

  const handleDeleteStore = (storeId: string) => {
    if (userId) {
      const docRef = doc(firestore, "users", userId, "stores", storeId);
      deleteDocumentNonBlocking(docRef);
      setStoreToDelete(null);
    }
  };
  
  const linkPath = (storeId: string) => {
    return isViewingOtherUser 
      ? `/dashboard/users/${userId}/stores/${storeId}/aisles`
      : `/dashboard/stores/${storeId}/aisles`;
  }

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
            <AlertDialogAction onClick={() => storeToDelete && handleDeleteStore(storeToDelete.id)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {isViewingOtherUser && (
         <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard/users">
                        <Users className="h-4 w-4" />
                        Utilisateurs
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>{targetUser?.displayName || targetUser?.email || '...'}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
      )}


      <Card>
        <CardHeader>
            <div>
              <CardTitle>
                {isViewingOtherUser ? `Magasins de ${targetUser?.displayName || targetUser?.email || '...'}` : "Gérer les magasins"}
              </CardTitle>
              <CardDescription>
                Ajoutez un nouveau magasin ou sélectionnez-en un pour gérer ses rayons.
              </CardDescription>
            </div>
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
                href={linkPath(store.id)}
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
