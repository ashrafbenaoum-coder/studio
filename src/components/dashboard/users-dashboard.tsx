
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { collection } from "firebase/firestore";
import { Loader2, User as UserIcon, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UsersDashboard() {
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading: isCurrentUserLoading } = useUser();
  
  const usersQuery = useMemoFirebase(
    () => (currentUser?.email === 'gds@gds.com' ? collection(firestore, "user_management") : null),
    [firestore, currentUser]
  );
  
  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersQuery);

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter(user => user.email !== 'gds@gds.com' && user.email !== currentUser?.email)
      .sort((a, b) => (a.displayName || a.email).localeCompare(b.displayName || b.email));
  }, [users, currentUser]);

  const isLoading = isCurrentUserLoading || areUsersLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gérer les utilisateurs</CardTitle>
          <CardDescription>
            Liste de tous les utilisateurs enregistrés dans le système.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-primary" />}
          
          {!isLoading && users && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedUsers.map(user => (
                <Card key={user.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                      {user.displayName || user.email?.split('@')[0]}
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

          {!isLoading && sortedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">Aucun autre utilisateur trouvé.</p>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
