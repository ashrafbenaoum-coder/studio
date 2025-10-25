
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
import { collection, query, where, getDocs } from "firebase/firestore";
import { Loader2, User as UserIcon, ShieldCheck, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UsersDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({ variant: "destructive", title: "Champ vide", description: "Veuillez entrer un email à rechercher." });
      return;
    }
    
    // Cannot search for admin or self
    if (searchEmail.trim().toLowerCase() === currentUser?.email?.toLowerCase() || searchEmail.trim().toLowerCase() === 'gds@gds.com') {
      setFoundUser(null);
      toast({ title: "Recherche invalide", description: "Vous ne pouvez pas vous rechercher vous-même ou un autre administrateur." });
      return;
    }

    setIsSearching(true);
    setFoundUser(null);

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("email", "==", searchEmail.trim().toLowerCase()));

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Utilisateur non trouvé",
          description: `Aucun utilisateur trouvé avec l'email: ${searchEmail}`,
        });
      } else {
        const userData = querySnapshot.docs[0].data() as Omit<UserProfile, 'id'>;
        setFoundUser({ ...userData, id: querySnapshot.docs[0].id });
      }
    } catch (error) {
      console.error("Error searching for user:", error);
      toast({
        variant: "destructive",
        title: "Erreur de recherche",
        description: "Une erreur s'est produite lors de la recherche de l'utilisateur.",
      });
    } finally {
      setIsSearching(false);
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
        <CardContent>
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                    type="email" 
                    placeholder="Email de l'utilisateur"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Rechercher
                </Button>
            </div>
        </CardContent>
      </Card>

      {isSearching && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />}
      
      {foundUser && (
        <div>
            <h2 className="text-lg font-semibold mb-4">Résultat de la recherche</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {foundUser.displayName || foundUser.email}
                  </CardTitle>
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground break-all">{foundUser.email}</div>
                  {foundUser.role === 'Administrator' && <div className="flex items-center text-xs font-semibold text-primary"><ShieldCheck className="mr-1 h-4 w-4" /> Administrateur</div>}
                   <Button asChild className="w-full">
                      <Link href={`/dashboard/users/${foundUser.id}/stores`}>
                          Gérer l'inventaire
                      </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
        </div>
      )}

    </div>
  );
}
