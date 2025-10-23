"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth, useCollection, deleteDocumentNonBlocking } from "@/firebase";
import type { UserProfile, Login } from "@/lib/types";
import { doc, setDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  login: z.string().min(1, "Login est requis."),
  email: z.string().email("Email invalide."),
  password: z.string().min(6, "Mot de passe trop court."),
});

type CombinedUser = {
    id: string;
    login: string;
    email: string;
    role: "Administrator" | "Viewer";
}

export function UsersDashboard() {
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  // State for delete confirmation
  const [userToDelete, setUserToDelete] = useState<CombinedUser | null>(null);

  const adminProfileRef = useMemoFirebase(
    () => (adminUser ? doc(firestore, "users", adminUser.uid) : null),
    [adminUser, firestore]
  );
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = useMemo(() => adminProfile?.role === "Administrator", [adminProfile]);

  // Fetch all users and logins
  const usersQuery = useMemoFirebase(() => collection(firestore, "users"), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersQuery);

  const loginsQuery = useMemoFirebase(() => collection(firestore, "logins"), [firestore]);
  const { data: logins, isLoading: areLoginsLoading } = useCollection<Login>(loginsQuery);

  // Combine user and login data
  const combinedUsers = useMemo<CombinedUser[]>(() => {
    if (!users || !logins) return [];
    return logins.map(login => {
      const userProfile = users.find(u => u.email === login.email);
      return {
        id: userProfile?.id || login.id, // Fallback to login id if user not found yet
        login: login.id,
        email: login.email,
        role: userProfile?.role || 'Viewer'
      };
    }).sort((a, b) => a.login.localeCompare(b.login));
  }, [users, logins]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: "",
      email: "",
      password: "",
    },
  });

  const handleCreateUser = async (values: z.infer<typeof formSchema>) => {
    // This function can only be executed by an Admin, checked by the UI.
    // However, the real security is enforced by Firestore Rules.
    try {
      // NOTE: Creating user in Auth does not sign them in. We're using the admin's auth context.
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;

      // Use a batch to ensure both writes succeed or fail together
      const batch = writeBatch(firestore);

      // 1. Add role in users/{uid}
      const userDocRef = doc(firestore, "users", newUser.uid);
      batch.set(userDocRef, {
        email: values.email,
        role: "Viewer", // New users are always 'Viewer' by default
      });

      // 2. Add login -> email mapping in logins/{login}
      const loginDocRef = doc(firestore, "logins", values.login);
      batch.set(loginDocRef, {
        email: values.email,
      });
      
      await batch.commit();

      toast({
        title: "Utilisateur créé",
        description: `Le compte ${values.login} a été ajouté avec succès.`,
      });

      form.reset();
    } catch (error: any) {
       let errorMessage = "Impossible de créer l'utilisateur.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Cet email est déjà utilisé par un autre compte.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Le mot de passe est trop faible.";
      } else if (error.code === 'permission-denied') {
        errorMessage = "Permission refusée. Assurez-vous d'avoir les droits d'administrateur.";
      }
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Deleting a user is a backend operation. We can only delete Firestore data here.
    // The Auth user must be deleted from the Firebase Console.
    try {
        const batch = writeBatch(firestore);

        // 1. Delete from 'users' collection
        const userDocRef = doc(firestore, 'users', userToDelete.id);
        batch.delete(userDocRef);

        // 2. Delete from 'logins' collection
        const loginDocRef = doc(firestore, 'logins', userToDelete.login);
        batch.delete(loginDocRef);

        await batch.commit();
        
        toast({
            title: "Utilisateur supprimé de la base de données",
            description: `Le profil pour ${userToDelete.login} a été supprimé. N'oubliez pas de supprimer l'utilisateur de Firebase Authentication.`,
        });
    } catch (error: any) {
         toast({
            variant: "destructive",
            title: "Erreur de suppression",
            description: "La suppression du profil a échoué. " + error.message,
        });
    }
    setUserToDelete(null);
  };


  if (isAdminLoading) {
    return (
      <div className="flex justify-center items-center h-full">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
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

  const isLoading = areUsersLoading || areLoginsLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>Vue d'ensemble de tous les utilisateurs enregistrés.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : combinedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  combinedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.login}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'Administrator' ? 'default' : 'secondary'}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         {user.role !== 'Administrator' && (
                           <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouvel utilisateur</CardTitle>
            <CardDescription>Ajoutez un nouvel utilisateur au système.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="login"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom d'utilisateur" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>                      
                      <FormControl>
                        <Input placeholder="exemple@gds.com" {...field} />
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full !mt-6" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer l'utilisateur
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera les données de l'utilisateur ({userToDelete?.login}) de la base de données.
              <br/><br/>
              <span className="font-bold">Important:</span> Vous devrez toujours supprimer manuellement l'utilisateur du panneau Firebase Authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Supprimer quand même</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    