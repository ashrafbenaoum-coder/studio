
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
import { UserPlus, Loader2 } from "lucide-react";
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
  FirestorePermissionError,
  errorEmitter
} from "@/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


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

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    role: "Viewer" as "Administrator" | "Viewer",
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin && firestore) {
        setIsLoadingUsers(true);
        const usersCollectionRef = collection(firestore, 'users');
        try {
            const querySnapshot = await getDocs(usersCollectionRef);
            const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            setUsers(usersList);
        } catch (serverError) {
          const permissionError = new FirestorePermissionError({
            path: usersCollectionRef.path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          console.error("Permission error fetching users:", permissionError.message);
        } finally {
            setIsLoadingUsers(false);
        }
      } else {
        setIsLoadingUsers(false);
      }
    };

    if (!isAdminLoading) {
        fetchUsers();
    }
  }, [isAdmin, firestore, isAdminLoading]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value.replace('@gds.com', '') }));
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
    const usersCollectionRef = collection(firestore, "users");
    // Create a reference for a new document to get a unique ID
    const newUserRef = doc(usersCollectionRef);
    
    const userData = {
      email: `${newUserData.email}@gds.com`,
      role: newUserData.role,
    };
    
    // Use the generated ID to set the document
    setDocumentNonBlocking(newUserRef, userData, {});

    toast({
      title: "Profil créé dans Firestore",
      description: `N'oubliez pas de créer un compte d'authentification pour ${userData.email} dans la console Firebase.`,
    });
    
    // Optimistically update the UI
    setUsers(prevUsers => [...prevUsers, { id: newUserRef.id, ...userData }]);
    
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
             Créez un profil ici, puis créez son compte dans la console d'authentification Firebase.
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
                  <Label htmlFor="email">Utilisateur</Label>
                  <Input
                    id="email"
                    name="email"
                    type="text"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    placeholder="nomdutilisateur"
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
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
