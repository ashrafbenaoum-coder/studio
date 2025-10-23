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
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import type { UserProfile } from "@/lib/types";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  login: z.string().min(1, "Login est requis."),
  email: z.string().email("Email invalide."),
  password: z.string().min(6, "Mot de passe trop court."),
});

export function UsersDashboard() {
  const { user: adminUser, isUserLoading: isAdminLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const adminProfileRef = useMemoFirebase(
    () => (adminUser ? doc(firestore, "users", adminUser.uid) : null),
    [adminUser, firestore]
  );
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);
  const isAdmin = useMemo(() => adminProfile?.role === "Administrator", [adminProfile]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: "",
      email: "",
      password: "",
    },
  });

  const handleCreateUser = async (values: z.infer<typeof formSchema>) => {
    if (!isAdmin) {
        toast({
            variant: "destructive",
            title: "Accès refusé",
            description: "Vous n'avez pas les autorisations pour créer un utilisateur.",
        });
        return;
    }
    try {
      // Note: This creates the user in Firebase Auth, but we don't use the returned credentials directly
      // to avoid signing in as the new user. We manage auth state separately.
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const newUser = userCredential.user;

      // Add role in users/{uid}
      await setDoc(doc(firestore, "users", newUser.uid), {
        email: values.email,
        role: "Viewer", // Default role for new users
      });

      // Add login -> email mapping in logins/{login}
      await setDoc(doc(firestore, "logins", values.login), {
        email: values.email,
      });

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
        <CardHeader>
          <CardTitle>Gérer les utilisateurs</CardTitle>
          <CardDescription>Créer un nouvel utilisateur</CardDescription>
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
  );
}
