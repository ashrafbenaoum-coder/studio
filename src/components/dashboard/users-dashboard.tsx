
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, ListOrdered, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useFirestore,
  useUser,
  useMemoFirebase,
  setDocumentNonBlocking,
  useDoc,
} from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";


export function UsersDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();

  const adminProfileRef = useMemoFirebase(
    () => (adminUser ? doc(firestore, "users", adminUser.uid) : null),
    [adminUser, firestore]
  );
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = useMemo(() => adminProfile?.role === "Administrator", [adminProfile]);

  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    role: "Viewer" as "Administrator" | "Viewer",
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: "Administrator" | "Viewer") => {
    setNewUserData((prev) => ({ ...prev, role: value }));
  };

  const handleCreateUser = () => {
    if (!newUserData.email) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Veuillez entrer un nom d'utilisateur.",
        });
        return;
    }
    
    // Create a reference for a new document to get a unique ID
    const newUserRef = doc(collection(firestore, "users"));
    
    // Sanitize the email input to ensure it's just the username part
    const username = newUserData.email.split('@')[0];

    const userData = {
      email: `${username}@gds.com`,
      role: newUserData.role,
    };
    
    setDocumentNonBlocking(newUserRef, userData, {});

    toast({
      title: "Profil créé dans Firestore",
      description: `Passez à l'étape 2 pour créer son compte dans Firebase Authentication.`,
    });
    
    setAddUserDialogOpen(false);
    setNewUserData({ email: "", role: "Viewer" });
  };
  
  if (isAdminLoading) {
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Gérer les utilisateurs</CardTitle>
            <CardDescription>
             Suivez les étapes ci-dessous pour ajouter un nouvel utilisateur en toute sécurité.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                 {/* Step 1 */}
                <div className="flex-1 p-6 border rounded-lg bg-card-foreground/5">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">1</div>
                        <h3 className="text-xl font-semibold">Créer le profil dans l'application</h3>
                    </div>
                    <p className="mt-2 text-muted-foreground ml-14">
                        Créez d'abord un profil pour définir l'email et le rôle de l'utilisateur (Viewer ou Administrator).
                    </p>
                    <Dialog
                        open={isAddUserDialogOpen}
                        onOpenChange={setAddUserDialogOpen}
                    >
                        <DialogTrigger asChild>
                        <Button className="mt-4 ml-14">
                            <UserPlus className="mr-2" />
                            Créer un profil
                        </Button>
                        </DialogTrigger>
                        <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Étape 1: Créer le profil utilisateur</DialogTitle>
                            <DialogDescription>
                             Cela crée un enregistrement dans Firestore. Vous devrez ensuite créer le compte de connexion dans la console Firebase.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                            <Label htmlFor="email">Utilisateur</Label>
                            <div className="flex items-center">
                                <Input
                                id="email"
                                name="email"
                                type="text"
                                value={newUserData.email}
                                onChange={handleInputChange}
                                placeholder="nomdutilisateur"
                                required
                                />
                                <span className="pl-2 text-muted-foreground">@gds.com</span>
                            </div>
                            </div>
                            <div className="space-y-2">
                            <Label htmlFor="role">Rôle</Label>
                            <Select
                                value={newUserData.role}
                                onValueChange={handleRoleChange}
                            >
                                <SelectTrigger id="role">
                                <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="Viewer">Viewer</SelectItem>
                                <SelectItem value="Administrator">
                                    Administrator
                                </SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                Annuler
                            </Button>
                            </DialogClose>
                            <Button type="button" onClick={handleCreateUser}>
                                Créer le profil
                            </Button>
                        </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Step 2 */}
                <div className="flex-1 p-6 border rounded-lg bg-card-foreground/5">
                    <div className="flex items-center gap-4">
                         <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">2</div>
                        <h3 className="text-xl font-semibold">Créer le compte dans Firebase</h3>
                    </div>
                    <p className="mt-2 text-muted-foreground ml-14">
                        Après avoir créé le profil, allez dans la console Firebase pour créer le compte de connexion avec un mot de passe.
                    </p>
                    <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="mt-4 ml-14">
                            Ouvrir Firebase Console
                        </Button>
                    </a>
                    <ul className="mt-4 ml-14 space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2 items-center"><ListOrdered className="h-4 w-4 text-primary" />Allez dans <strong>Build &gt; Authentication &gt; Users</strong>.</li>
                        <li className="flex gap-2 items-center"><ListOrdered className="h-4 w-4 text-primary" />Cliquez sur <strong>Add User</strong>.</li>
                        <li className="flex gap-2 items-center"><ListOrdered className="h-4 w-4 text-primary" />Utilisez le même email et définissez un mot de passe.</li>
                        <li className="flex gap-2 items-center"><CheckCircle className="h-4 w-4 text-green-500" />C'est terminé! L'utilisateur peut maintenant se connecter.</li>
                    </ul>
                </div>
            </div>
             <div className="text-center text-muted-foreground text-xs pt-4">
                La liste des utilisateurs et leur suppression se gèrent directement depuis la Firebase Console pour des raisons de sécurité.
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

    