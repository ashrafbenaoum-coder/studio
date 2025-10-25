
"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/lib/types";
import { getStatus } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InventoryListProps = {
  products: Product[];
  isLoading: boolean;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteAllProducts: () => void;
};

export function InventoryList({
  products,
  isLoading,
  onUpdateProduct,
  onDeleteProduct,
  onDeleteAllProducts,
}: InventoryListProps) {
  const { toast } = useToast();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => a.address.localeCompare(b.address));
  }, [products]);

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
  };

  const handleDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete);
      setProductToDelete(null);
      toast({ title: "Produit supprimé", description: "Le produit a été retiré de l'inventaire." });
    }
  };
  
  const confirmDeleteAll = () => {
    setDeleteAllConfirmOpen(true);
  };

  const handleDeleteAll = () => {
    onDeleteAllProducts();
    setDeleteAllConfirmOpen(false);
    toast({ title: "Tous les produits ont été supprimés", description: "L'inventaire de ce rayon a été vidé." });
  };
  
  const openEditModal = (product: Product) => {
    setProductToEdit(product);
    setEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (productToEdit) {
      onUpdateProduct(productToEdit);
      setEditModalOpen(false);
      setProductToEdit(null);
      toast({ title: "Produit mis à jour", description: "Les informations du produit ont été enregistrées." });
    }
  };

  return (
    <>
      {/* Alert Dialog for single product deletion */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera le produit de l'inventaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for deleting all products */}
      <AlertDialog open={isDeleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les produits?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera tous les produits de ce rayon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>Supprimer tout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog for editing a product */}
      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          {productToEdit && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-barcode">Code Barre</Label>
                <Input id="edit-barcode" value={productToEdit.barcode} disabled />
              </div>
              <div>
                <Label htmlFor="edit-address">Adresse</Label>
                <Input id="edit-address" value={productToEdit.address} onChange={(e) => setProductToEdit({...productToEdit, address: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="edit-quantity">Quantité</Label>
                <Input id="edit-quantity" type="number" value={productToEdit.quantity} onChange={(e) => setProductToEdit({...productToEdit, quantity: Number(e.target.value)})} />
              </div>
              <div>
                <Label htmlFor="edit-expirationDate">Date d'expiration (YYYYMMDD)</Label>
                <Input id="edit-expirationDate" value={productToEdit.expirationDate} onChange={(e) => setProductToEdit({...productToEdit, expirationDate: e.target.value})} />
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

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Inventaire Actuel</CardTitle>
            <CardDescription>
              Liste de tous les produits actuellement en stock.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={confirmDeleteAll} disabled={products.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Produit (Code Barre)</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead>Date d'exp.</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Aucun produit dans l'inventaire.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((product) => {
                    const status = getStatus(product.expirationDate);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.address}</TableCell>
                        <TableCell>{product.barcode}</TableCell>
                        <TableCell className="text-center">{product.quantity}</TableCell>
                        <TableCell>{product.expirationDate}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="capitalize">{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(product)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
