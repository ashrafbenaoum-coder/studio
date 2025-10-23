
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
  const isAdmin = adminProfile?.role === 'Administrator';

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
    toast({
      title: "Création (Simulation)",
      description: `Dans une application réelle, un compte serait créé pour l'utilisateur '${newUserData.login}'.`,
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
             Créez de nouveaux utilisateurs. La gestion des utilisateurs existants a été simplifiée.
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
                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                    <DialogDescription>
                        Entrez les informations pour créer un nouveau compte (simulation).
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
            La gestion des utilisateurs existants se fait désormais via la console Firebase pour plus de sécurité.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
