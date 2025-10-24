
"use client";

import { useState, useMemo } from "react";
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
import { Plus, Archive, Trash2, Loader2, Package, Pencil } from "lucide-react";
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
  storeId,
  aisle,
  onDelete,
  onEdit,
}: {
  storeId: string;
  aisle: Aisle;
  onDelete: (aisle: Aisle) => void;
  onEdit: (aisle: Aisle) => void;
}) {

  return (
    <Card className="group relative flex flex-col justify-between transition-colors hover:bg-muted/50">
        <Link
            href={`/dashboard/stores/${storeId}/aisles/${aisle.id}`}
            passHref
            className="block cursor-pointer flex-grow"
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{aisle.name}</CardTitle>
                <Archive className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">
                    Cliquez pour gérer les produits de ce rayon.
                </p>
            </CardContent>
        </Link>
        <CardFooter className="flex gap-2 p-2 pt-0">
            <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(aisle)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
            </Button>
            <Button variant="destructive" size="sm" className="w-full" onClick={() => onDelete(aisle)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
            </Button>
        </CardFooter>
    </Card>
  );
}


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
  const { data: aisles, isLoading: areAislesLoading } = useCollection<Aisle>(aislesQuery);

  const [newAisleName, setNewAisleName] = useState("");
  const [aisleToDelete, setAisleToDelete] = useState<Aisle | null>(null);
  const [aisleToEdit, setAisleToEdit] = useState<Aisle | null>(null);

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
  
  const handleUpdateAisle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(user && aisleToEdit) {
      const docRef = doc(firestore, "users", user.uid, "stores", storeId, "aisles", aisleToEdit.id);
      setDocumentNonBlocking(docRef, { name: aisleToEdit.name }, { merge: true });
      setAisleToEdit(null);
    }
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

      {!isLoading && sortedAisles && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedAisles.map((aisle) => (
            <AisleCard 
              key={aisle.id} 
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

    