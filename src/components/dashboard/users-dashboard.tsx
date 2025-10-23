
"use client";

import { useState } from "react";
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
import { UserPlus, MoreVertical, Edit, Trash2 } from "lucide-react";
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


interface User {
  id: string;
  email: string;
  role: string;
}

// Mock data for now, representing users in the system
const initialUsers: User[] = [
  { id: "1", email: "user1@example.com", role: "Viewer" },
  { id: "2", email: "user2@example.com", role: "Editor" },
];

export function UsersDashboard() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<string | undefined>(undefined);


  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    
    // Simulate creating a user
    const newUser: User = {
      id: (Math.random() * 10000).toString(),
      email,
      role: role || "Viewer", // Default role if not selected
    };

    setUsers(prevUsers => [...prevUsers, newUser]);
    
    toast({
      title: "Utilisateur créé (Simulation)",
      description: `L'utilisateur ${email} a été ajouté avec le rôle ${newUser.role}.`,
    });
    setAddUserDialogOpen(false);
  };
  
  const openDeleteConfirm = (user: User) => {
    setUserToDelete(user);
  };
  
  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      toast({
        title: "Utilisateur supprimé (Simulation)",
        description: `L'utilisateur ${userToDelete.email} a été supprimé.`,
      });
      setUserToDelete(null);
    }
  };
  
  const openEditDialog = (user: User) => {
    setUserToEdit(user);
    setEditingUserRole(user.role);
    setEditUserDialogOpen(true);
  };

  const handleUpdateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userToEdit) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    setUsers(prevUsers => prevUsers.map(u => u.id === userToEdit.id ? { ...u, email, role: editingUserRole || u.role } : u));
    
    toast({
      title: "Utilisateur modifié (Simulation)",
      description: `Les informations de l'utilisateur ont été mises à jour.`,
    });
    setEditUserDialogOpen(false);
    setUserToEdit(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gérer les utilisateurs</CardTitle>
            <CardDescription>
              Ajoutez, supprimez ou modifiez les utilisateurs et leurs permissions.
            </CardDescription>
          </div>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Ajouter un utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  Entrez les informations pour créer un nouveau compte.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Logine</Label>
                  <Input id="email" name="email" type="text" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select name="role" defaultValue="Viewer">
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost">
                      Annuler
                    </Button>
                  </DialogClose>
                  <Button type="submit">Créer l'utilisateur</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logine</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
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
                          <span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteConfirm(user)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {userToEdit && (
             <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Logine</Label>
                <Input id="edit-email" name="email" type="text" defaultValue={userToEdit.email} required />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select value={editingUserRole} onValueChange={setEditingUserRole}>
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="ghost">Annuler</Button></DialogClose>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'utilisateur "{userToDelete?.email}" de manière permanente (simulation).
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

    