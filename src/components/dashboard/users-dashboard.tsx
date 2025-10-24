
"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { collection } from "firebase/firestore";
import { Loader2, User as UserIcon, ShieldCheck } from "lucide-react";

export function UsersDashboard() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const usersQuery = useMemoFirebase(
    () => collection(firestore, "users"),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  // Filter out the current admin user from the list
  const otherUsers = useMemo(() => {
    if (!users || !currentUser) return [];
    return users.filter(user => user.id !== currentUser.uid);
  }, [users, currentUser]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gérer les utilisateurs</CardTitle>
          <CardDescription>
            Sélectionnez un utilisateur pour voir et gérer son inventaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />}
          
          {!isLoading && otherUsers.length === 0 && (
            <div className="pt-4 text-center text-sm text-muted-foreground">
              Aucun autre utilisateur trouvé.
            </div>
          )}

          {!isLoading && otherUsers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {user.displayName || user.email}
                    </CardTitle>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                    {user.role === 'Administrator' && <div className="flex items-center text-xs font-semibold text-primary"><ShieldCheck className="mr-1 h-4 w-4" /> Administrateur</div>}
                     <Button asChild className="w-full">
                        <Link href={`/dashboard/users/${user.id}/stores`}>
                            Gérer l'inventaire
                        </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
