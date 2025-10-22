
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
import { Plus, Store as StoreIcon } from "lucide-react";
import type { Store } from "@/lib/types";

const initialStores: Store[] = [
  { id: "1", name: "Magasin Principal" },
  { id: "2", name: "Entrepôt Sud" },
];

export function StoresDashboard() {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [newStoreName, setNewStoreName] = useState("");

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

  return (
    <div className="space-y-6">
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
            onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
          />
          <Button onClick={handleAddStore}>
            <Plus className="mr-2" />
            Ajouter
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Link key={store.id} href={`/dashboard/stores/${store.id}/aisles`} passHref>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{store.name}</CardTitle>
                <StoreIcon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Cliquez pour gérer les rayons de ce magasin.
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
