
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
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";


export function UsersDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  
  const adminProfileRef = useMemoFirebase(() => adminUser ? doc(firestore, 'users', adminUser.uid) : null, [adminUser, firestore]);
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = useMemo(() => adminProfile?.role === "Administrator", [adminProfile]);

  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ login: '', password: '', role: 'Viewer' as 'Administrator' | 'Viewer'});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: 'Administrator' | 'Viewer') => {
    setNewUserData(prev => ({ ...prev, role: value }));
  };

  const handleCreateUser = () => {
    // This is a simulation because creating users with passwords requires admin privileges
    // that should not be exposed on the client-side.
    // The correct and secure way is to use the Firebase Console or a backend function.
    toast({
      title: "Création d'utilisateur (Simulation)",
      description: `Pour créer un utilisateur réel, veuillez utiliser la console Firebase.`,
    });
    console.log("Simulating creation of user:", {
        email: `${newUserData.login}@gds.com`,
        password: newUserData.password,
        role: newUserData.role,
    });
    setAddUserDialogOpen(false);
    setNewUserData({ login: '', password: '', role: 'Viewer' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Gérer les utilisateurs</CardTitle>
            <CardDescription>
             Créez de nouveaux utilisateurs (en simulation) ou utilisez la console Firebase pour une gestion complète.
            </CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={!isAdmin}>
                    <UserPlus className="mr-2"/>
                    Créer un utilisateur
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Créer un nouvel utilisateur (Simulation)</DialogTitle>
                    <DialogDescription>
                        Cette interface simule la création d'un utilisateur. Pour une création réelle, utilisez la console Firebase.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="login">Utilisateur</Label>
                        <Input id="login" name="login" type="text" value={newUserData.login} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input id="password" name="password" type="password" value={newUserData.password} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Select value={newUserData.role} onValueChange={handleRoleChange}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                    <Button type="button" onClick={handleCreateUser}>Créer l'utilisateur</Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            Pour des raisons de sécurité, la création et la gestion des utilisateurs réels doivent être effectuées via la console d'administration de Firebase.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
