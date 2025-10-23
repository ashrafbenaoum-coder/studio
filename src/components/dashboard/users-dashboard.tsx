"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function UsersDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gérer les utilisateurs</CardTitle>
          <CardDescription>
            La gestion des utilisateurs (ajout, suppression, et assignation des rôles) doit être effectuée depuis un environnement backend sécurisé ou via la console Firebase pour des raisons de sécurité.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pour gérer les utilisateurs, veuillez utiliser la console Firebase ou un script backend pour assigner des "Custom Claims" qui définissent les rôles (par exemple, 'Administrator').
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
