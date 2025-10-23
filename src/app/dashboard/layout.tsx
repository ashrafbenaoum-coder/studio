"use client";

import { useState, useTransition, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sun, Moon, Monitor, LogOut, FileDown, Users, Loader2, KeyRound } from "lucide-react";
import { useTheme } from "next-themes";
import { collection, getDocs } from "firebase/firestore";
import type { Store, Aisle, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/actions";
import { saveAs } from "file-saver";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [isExporting, startExportTransition] = useTransition();

  const isAdmin = useMemo(() => user?.email === "gds@gds.com", [user]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleExportAllStores = () => {
    if (!user) return;
    
    startExportTransition(async () => {
      try {
        const storesQuery = collection(firestore, "users", user.uid, "stores");
        const storesSnapshot = await getDocs(storesQuery);
        const stores = storesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Store));

        if (stores.length === 0) {
            toast({
                variant: "destructive",
                title: "Aucune donnée à exporter",
                description: "Il n'y a aucun magasin à exporter.",
            });
            return;
        }

        let allProducts: (Product & { storeName?: string; aisleName?: string; })[] = [];

        for (const store of stores) {
          const aislesQuery = collection(firestore, "users", user.uid, "stores", store.id, "aisles");
          const aislesSnapshot = await getDocs(aislesQuery);
          const aisles = aislesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Aisle));

          for (const aisle of aisles) {
            const productsQuery = collection(firestore, "users", user.uid, "stores", store.id, "aisles", aisle.id, "products");
            const productsSnapshot = await getDocs(productsQuery);
            const aisleProducts = productsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, storeName: store.name, aisleName: aisle.name }));
            allProducts = [...allProducts, ...aisleProducts];
          }
        }
        
        if (allProducts.length === 0) {
          toast({
            variant: "destructive",
            title: "Aucun produit à exporter",
            description: "Aucun produit n'a été trouvé dans l'ensemble des magasins.",
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
        saveAs(blob, `inventaire-global-${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
          title: "Exportation terminée",
          description: "L'inventaire global a été téléchargé avec succès.",
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


  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur md:px-6">
          <nav className="flex w-full items-center justify-between">
            <Logo />
            <Skeleton className="h-8 w-8 rounded-full" />
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur md:px-6 z-10">
        <nav className="flex w-full items-center justify-between">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage
                      src={user.photoURL ?? "https://picsum.photos/seed/user-avatar/32/32"}
                      data-ai-hint="person face"
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportAllStores} disabled={isExporting}>
                  {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                  <span>{isExporting? "Exportation..." : "Exporter les fichiers"}</span>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                     <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                     <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span>Thème</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Clair</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Sombre</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>Système</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem disabled={!isAdmin}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Gérer les utilisateurs</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Changer le mot de passe</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
