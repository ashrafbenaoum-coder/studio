"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { doc, collection } from "firebase/firestore";

export function UsersDashboard() {
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
  const firestore = useFirestore();

  const adminProfileRef = useMemoFirebase(
    () => (adminUser ? doc(firestore, "users", adminUser.uid) : null),
    [adminUser, firestore]
  );
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = useMemo(() => adminProfile?.role === "Administrator", [adminProfile]);

  const usersCollectionRef = useMemoFirebase(
    () => collection(firestore, "users"),
    [firestore]
  );
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersCollectionRef);

  if (isAdminLoading || isUsersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
          <CardDescription>
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs enregistrés</CardTitle>
          <CardDescription>Liste des comptes existants dans le système</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {users && users.length > 0 ? (
            users.map((u, index) => (
              <div key={index} className="border-b pb-2">
                <p className="font-medium">{u.email}</p>
                <p className="text-sm text-muted-foreground">Rôle: {u.role}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
