
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
import { MoreVertical, Edit, Trash2 } from "lucide-react";
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
import { useFirestore, useUser, setDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";

// NOTE: This component is for presentation and state management on the client-side.
// Real user creation/deletion requires Firebase Admin SDK on a secure server environment,
// which is not implemented here. This component simulates the UI/UX for such features.

export function UsersDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: adminUser } = useUser(); // The currently logged-in admin

  // Fetch all user profiles from Firestore
  const usersCollectionRef = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: userProfiles, isLoading } = useCollection<UserProfile>(usersCollectionRef);

  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<string | undefined>(undefined);

  const openDeleteConfirm = (user: UserProfile) => {
    // Prevent admin from deleting their own account from the UI
    if (adminUser?.uid === user.id) {
        toast({
            variant: "destructive",
            title: "Action non autorisée",
            description: "Vous не pouvez pas supprimer votre propre compte.",
        });
        return;
    }
    setUserToDelete(user);
  };
  
  const handleDeleteUser = () => {
    if (userToDelete) {
      // In a real app, this would trigger a server-side function (e.g., Cloud Function)
      // to delete the user from Firebase Auth and their data from Firestore.
      // Here, we only show a toast as it's a simulation.
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
    setEditingUserRole(user.role);
    setEditUserDialogOpen(true);
  };

  const handleUpdateUserRole = () => {
    if (!userToEdit || !editingUserRole) return;
    
    const userDocRef = doc(firestore, "users", userToEdit.id);
    setDocumentNonBlocking(userDocRef, { role: editingUserRole }, { merge: true });
    
    toast({
      title: "Rôle mis à jour",
      description: `Le rôle de l'utilisateur ${userToEdit.email} a été défini sur ${editingUserRole}.`,
    });

    setEditUserDialogOpen(false);
    setUserToEdit(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Gérer les utilisateurs</CardTitle>
            <CardDescription>
              Affichez les utilisateurs et modifiez leurs rôles. Les utilisateurs sont créés via la console Firebase.
            </CardDescription>
          </div>
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Chargement des utilisateurs...</TableCell>
                </TableRow>
              ) : (
                userProfiles?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" value={userToEdit.email} disabled />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select value={editingUserRole} onValueChange={setEditingUserRole}>
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
                <Button type="button" onClick={handleUpdateUser}>Enregistrer</Button>
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
              Cette action est une simulation. Dans une application réelle, elle supprimerait l'utilisateur "{userToDelete?.email}" de façon permanente.
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
