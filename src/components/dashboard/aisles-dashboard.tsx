
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
import { Plus, Archive, Trash2 } from "lucide-react";
import type { Aisle } from "@/lib/types";
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

const initialAisles: { [storeId: string]: Aisle[] } = {
  "1": [
    { id: "101", name: "Allée 1 - Frais", storeId: "1" },
    { id: "102", name: "Allée 2 - Sec", storeId: "1" },
  ],
  "2": [{ id: "201", name: "Zone A", storeId: "2" }],
};

export function AislesDashboard({ storeId }: { storeId: string }) {
  // In a real app, you'd fetch this data.
  const storeName = storeId === "1" ? "Magasin Principal" : "Entrepôt Sud";

  const [aisles, setAisles] = useState<Aisle[]>(initialAisles[storeId] || []);
  const [newAisleName, setNewAisleName] = useState("");
  const [aisleToDelete, setAisleToDelete] = useState<Aisle | null>(null);

  const handleAddAisle = () => {
    if (newAisleName.trim()) {
      const newAisle: Aisle = {
        id: new Date().getTime().toString(),
        name: newAisleName.trim(),
        storeId,
      };
      setAisles((prev) => [...prev, newAisle]);
      setNewAisleName("");
    }
  };

  const handleDeleteAisle = (aisle: Aisle) => {
    setAisles((prev) => prev.filter((s) => s.id !== aisle.id));
    setAisleToDelete(null);
  };

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
            <BreadcrumbPage>{storeName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader>
          <CardTitle>Gérer les rayons pour {storeName}</CardTitle>
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
    </div>
  );
}
