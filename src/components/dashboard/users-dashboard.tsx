
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { UserPlus, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  useFirestore,
  useUser,
  useMemoFirebase,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useDoc
} from "@/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";

export function UsersDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: adminUser } = useUser();

  const adminProfileRef = useMemoFirebase(
    () => (adminUser ? doc(firestore, "users", adminUser.uid) : null),
    [adminUser, firestore]
  );
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = useMemo(() => adminProfile?.role === "Administrator", [adminProfile]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [areUsersLoading, setUsersLoading] = useState(true);

  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    role: "Viewer" as "Administrator" | "Viewer",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin && firestore) {
        setUsersLoading(true);
        const usersCollectionRef = collection(firestore, "users");
        try {
          const querySnapshot = await getDocs(usersCollectionRef);
          const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
          setUsers(usersList);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger la liste des utilisateurs.",
          });
        } finally {
          setUsersLoading(false);
        }
      } else if (adminProfile) {
        // Not an admin or firestore not ready, stop loading.
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, firestore, adminProfile, toast]);


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
            description: "Veuillez entrer une adresse e-mail.",
        });
        return;
    }
    const usersCollectionRef = collection(firestore, "users");
    // This adds user data to Firestore, but authentication must be handled in the Firebase Console.
    addDocumentNonBlocking(usersCollectionRef, {
      email: newUserData.email,
      role: newUserData.role,
    });
    
    toast({
      title: "Profil créé dans la base de données",
      description: `N'oubliez pas de créer un compte d'authentification pour ${newUserData.email} dans la console Firebase.`,
    });
    
    // Optimistically update the UI
    setUsers(prevUsers => [...prevUsers, { id: 'temp-' + Date.now(), ...newUserData }]);
    setAddUserDialogOpen(false);
    setNewUserData({ email: "", role: "Viewer" });
  };
  
  const handleDeleteUser = (userId: string) => {
    if (adminUser?.uid === userId) {
        toast({ variant: "destructive", title: "Action non autorisée", description: "Vous ne pouvez pas supprimer votre propre compte." });
        return;
    }
    const docRef = doc(firestore, "users", userId);
    deleteDocumentNonBlocking(docRef);
    
    // Optimistically update the UI
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    toast({ title: "Utilisateur supprimé", description: "L'enregistrement de l'utilisateur a été supprimé de Firestore." });
  };

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
              Ajoutez des profils ici, puis créez leurs comptes d'authentification dans la console Firebase.
            </CardDescription>
          </div>
          <Dialog
            open={isAddUserDialogOpen}
            onOpenChange={setAddUserDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Créer un profil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un profil utilisateur</DialogTitle>
                <DialogDescription>
                  Cela crée un enregistrement dans Firestore. Vous devez ensuite créer le compte correspondant dans la console d'authentification Firebase.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    placeholder="utilisateur@gds.com"
                    required
                  />
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
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive" 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={adminUser?.uid === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
