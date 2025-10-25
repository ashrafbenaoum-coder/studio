
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirestore, useUser } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Loader2, User as UserIcon, ShieldCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UsersDashboard() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Champ de recherche vide",
        description: "Veuillez entrer un e-mail à rechercher.",
      });
      return;
    }
    
    setIsLoading(true);
    setHasSearched(true);
    setSearchedUser(null);
    
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", searchTerm.trim()));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setSearchedUser(null);
      } else {
        const userData = querySnapshot.docs[0].data() as Omit<UserProfile, 'id'>;
        const userId = querySnapshot.docs[0].id;
        if (userId === currentUser?.uid) {
            toast({
                title: "Utilisateur actuel",
                description: "Vous ne pouvez pas gérer votre propre inventaire à partir de cette page.",
            });
            setSearchedUser(null);
        } else {
            setSearchedUser({ ...userData, id: userId });
        }
      }
    } catch (error) {
      console.error("Error searching user:", error);
      toast({
        variant: "destructive",
        title: "Erreur de recherche",
        description: "Une erreur s'est produite lors de la recherche de l'utilisateur.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gérer les utilisateurs</CardTitle>
          <CardDescription>
            Recherchez un utilisateur par son adresse e-mail pour voir et gérer son inventaire.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
            <Input
                placeholder="E-mail de l'utilisateur"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Rechercher
            </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {!isLoading && hasSearched && !searchedUser && (
        <p className="text-center text-muted-foreground pt-4">
            Aucun utilisateur trouvé avec cet e-mail.
        </p>
      )}

      {!isLoading && searchedUser && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card key={searchedUser.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {searchedUser.displayName || searchedUser.email?.split('@')[0]}
                </CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-muted-foreground break-all">{searchedUser.email}</div>
                {searchedUser.role === 'Administrator' && <div className="flex items-center text-xs font-semibold text-primary"><ShieldCheck className="mr-1 h-4 w-4" /> Administrateur</div>}
                 <Button asChild className="w-full">
                    <Link href={`/dashboard/users/${searchedUser.id}/stores`}>
                        Gérer l'inventaire
                    </Link>
                </Button>
              </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
