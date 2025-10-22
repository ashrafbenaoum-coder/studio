
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
import { Plus, Archive } from "lucide-react";
import type { Aisle } from "@/lib/types";
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

  return (
    <div className="space-y-6">
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
            onKeyDown={(e) => e.key === 'Enter' && handleAddAisle()}
          />
          <Button onClick={handleAddAisle}>
            <Plus className="mr-2" />
            Ajouter
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {aisles.map((aisle) => (
          <Link
            key={aisle.id}
            href={`/dashboard/stores/${storeId}/aisles/${aisle.id}`}
            passHref
          >
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{aisle.name}</CardTitle>
                <Archive className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Cliquez pour gérer les produits de ce rayon.
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
