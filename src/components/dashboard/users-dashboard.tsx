
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Edit, Trash2, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";


export function UsersDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: userProfiles, isLoading: areUsersLoading } = useCollection<UserProfile>(usersCollectionRef);

  const adminProfileRef = useMemoFirebase(() => adminUser ? doc(firestore, 'users', adminUser.uid) : null, [adminUser, firestore]);
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = adminProfile?.role === 'Administrator';


  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  
  const [newUserData, setNewUserData] = useState({ email: '', password: '', role: 'Viewer' as 'Administrator' | 'Viewer'});

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
      description: `Dans une application réelle, l'utilisateur ${newUserData.email} serait créé.`,
    });
    console.log("Simulating creation of user:", newUserData);
    setAddUserDialogOpen(false);
    setNewUserData({ email: '', password: '', role: 'Viewer' });
  };
  
  const openDeleteConfirm = (user: UserProfile) => {
    if (adminUser?.uid === user.id) {
        toast({
            variant: "destructive",
            title: "Action non autorisée",
            description: "Vous ne pouvez pas supprimer votre propre compte.",
        });
        return;
    }
    setUserToDelete(user);
  };
  
  const handleDeleteUser = () => {
    if (userToDelete) {
      toast({
        title: "Suppression (Simulation)",
        description: `Dans une application réelle, l'utilisateur ${userToDelete.email} serait supprimé.`,
      });
      console.log(`Simulating deletion of user: ${userToDelete.email}`);
      setUserToDelete(null);
    }
  };
  
  const openEditDialog = (user: UserProfile) => {
    setUserToEdit(user);
    setEditUserDialogOpen(true);
  };

  const handleUpdateUserRole = () => {
    if (!userToEdit) return;
    
    const userDocRef = doc(firestore, "users", userToEdit.id);
    setDocumentNonBlocking(userDocRef, { role: userToEdit.role }, { merge: true });
    
    toast({
      title: "Rôle mis à jour",
      description: `Le rôle de l'utilisateur ${userToEdit.email} a été défini sur ${userToEdit.role}.`,
    });

    setEditUserDialogOpen(false);
    setUserToEdit(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Gérer les utilisateurs</CardTitle>
            <CardDescription>
             Créez des utilisateurs et modifiez leurs rôles. La suppression est une simulation.
            </CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2"/>
                    Créer un utilisateur
                </Button>
            </DialogTrigger>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                    <DialogDescription>
                        Entrez les informations pour créer un nouveau compte.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={newUserData.email} onChange={handleInputChange} required />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areUsersLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : !userProfiles || userProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">Aucun utilisateur trouvé.</TableCell>
                </TableRow>
              ) : (
                userProfiles?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!isAdmin}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Modifier le Rôle</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(user)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Supprimer (Simulé)</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
          </DialogHeader>
          {userToEdit && (
             <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Utilisateur</Label>
                <Input id="edit-email" name="email" type="text" value={userToEdit.email} disabled />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select value={userToEdit.role} onValueChange={(value) => setUserToEdit(prev => prev ? {...prev, role: value as 'Administrator' | 'Viewer'} : null)}>
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                <Button type="button" onClick={handleUpdateUserRole}>Enregistrer</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est une simulation. Dans une application réelle, elle supprimerait l'utilisateur "{userToDelete ? userToDelete.email : ''}" de façon permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
