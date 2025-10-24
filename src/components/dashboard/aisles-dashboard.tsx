
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Archive, Trash2, Loader2, Package, Pencil, MoreHorizontal, Users } from "lucide-react";
import type { Aisle, Store, Product, UserProfile } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { collection, doc } from "firebase/firestore";

function AisleCard({
  userId,
  storeId,
  aisle,
  onDelete,
  onEdit,
}: {
  userId: string;
  storeId: string;
  aisle: Aisle;
  onDelete: (aisle: Aisle) => void;
  onEdit: (aisle: Aisle) => void;
}) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const isViewingOtherUser = userId && currentUser?.uid !== userId;

  const productsQuery = useMemoFirebase(
    () => (userId ? collection(firestore, "users", userId, "stores", storeId, "aisles", aisle.id, "products") : null),
    [firestore, userId, storeId, aisle.id]
  );
  const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const totalQuantity = useMemo(() => {
    if (!products) return 0;
    return products.reduce((sum, product) => sum + product.quantity, 0);
  }, [products]);
  
  const linkPath = isViewingOtherUser 
    ? `/dashboard/users/${userId}/stores/${storeId}/aisles/${aisle.id}`
    : `/dashboard/stores/${storeId}/aisles/${aisle.id}`;

  return (
    <Card className="group relative flex flex-col justify-between transition-colors hover:bg-muted/50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(aisle)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(aisle)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Link
        href={linkPath}
        passHref
        className="block cursor-pointer flex-grow"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{aisle.name}</CardTitle>
          <Archive className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
           {productsLoading ? (
             <p className="text-xs text-muted-foreground flex items-center">
               <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Chargement...
             </p>
           ) : (
             <p className="text-sm text-muted-foreground">
               Quantité totale: <span className="font-bold text-foreground">{totalQuantity}</span>
             </p>
           )}
        </CardContent>
      </Link>
    </Card>
  );
}


export function AislesDashboard({ storeId, userId: targetUserId }: { storeId: string, userId?: string }) {
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
  const { data: store, isLoading: isStoreLoading } = useDoc<Omit<Store, "id">>(storeDocRef);

  const aislesQuery = useMemoFirebase(
    () =>
      userId ? collection(firestore, "users", userId, "stores", storeId, "aisles") : null,
    [firestore, userId, storeId]
  );
  const { data: aisles, isLoading: areAislesLoading } = useCollection<Aisle>(aislesQuery);

  const [newAisleName, setNewAisleName] = useState("");
  const [aisleToDelete, setAisleToDelete] = useState<Aisle | null>(null);
  const [aisleToEdit, setAisleToEdit] = useState<Aisle | null>(null);

  const handleAddAisle = () => {
    if (newAisleName.trim() && userId && aislesQuery) {
      const newAisle = {
        name: newAisleName.trim(),
        storeId,
      };
      addDocumentNonBlocking(aislesQuery, newAisle);
      setNewAisleName("");
    }
  };

  const handleDeleteAisle = (aisle: Aisle) => {
    if (userId) {
      const docRef = doc(firestore, "users", userId, "stores", storeId, "aisles", aisle.id);
      deleteDocumentNonBlocking(docRef);
      setAisleToDelete(null);
    }
  };
  
  const handleUpdateAisle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(userId && aisleToEdit) {
      const docRef = doc(firestore, "users", userId, "stores", storeId, "aisles", aisleToEdit.id);
      setDocumentNonBlocking(docRef, { name: aisleToEdit.name }, { merge: true });
      setAisleToEdit(null);
    }
  };


  const isLoading = isStoreLoading || areAislesLoading;

  const sortedAisles = useMemo(() => {
    if (!aisles) return [];
    return [...aisles].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  }, [aisles]);
  
  const storesLink = isViewingOtherUser ? `/dashboard/users/${userId}/stores` : '/dashboard/stores';
  const usersLink = '/dashboard/users';

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

      <Dialog open={!!aisleToEdit} onOpenChange={(open) => !open && setAisleToEdit(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Modifier le rayon</DialogTitle>
            </DialogHeader>
            {aisleToEdit && (
                <form onSubmit={handleUpdateAisle} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="edit-aisle-name">Nom du rayon</Label>
                        <Input 
                            id="edit-aisle-name" 
                            value={aisleToEdit.name} 
                            onChange={(e) => setAisleToEdit({...aisleToEdit, name: e.target.value})} 
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>

      <Breadcrumb>
        <BreadcrumbList>
          {isViewingOtherUser && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={usersLink}>
                  <Users className="h-4 w-4" />
                  Utilisateurs
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                 <BreadcrumbLink href={storesLink}>{targetUser?.displayName || targetUser?.email || '...'}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbLink href={storesLink}>{isViewingOtherUser ? 'Magasins' : 'Magasins'}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{store?.name ?? 'Chargement...'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
            <div>
                <CardTitle>Gérer les rayons pour {store?.name ?? '...'}</CardTitle>
                <CardDescription>
                    Ajoutez un nouveau rayon ou sélectionnez-en un pour gérer son inventaire.
                </CardDescription>
            </div>
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

      {!isLoading && sortedAisles && userId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedAisles.map((aisle) => (
            <AisleCard 
              key={aisle.id}
              userId={userId}
              storeId={storeId} 
              aisle={aisle}
              onDelete={setAisleToDelete}
              onEdit={setAisleToEdit}
            />
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

    