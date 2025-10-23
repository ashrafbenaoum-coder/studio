"use client";

import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  login: z.string().min(1, "Login est requis."),
  password: z.string().min(1, "Mot de passe est requis."),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const firestore = getFirestore(auth.app);
      const loginRef = doc(firestore, "logins", values.login.toLowerCase());
      const loginDoc = await getDoc(loginRef);
      let email;

      if (!loginDoc.exists()) {
        // Cas spécial pour l'admin "gds" : on le crée s'il n'existe pas
        if (values.login.toLowerCase() === "gds") {
          email = "gds@gds.com";
          try {
            // Tenter de créer l'utilisateur
            const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
            
            // Créer le document de login et le profil utilisateur
            await setDoc(loginRef, { email: email });
            const userDocRef = doc(firestore, "users", userCredential.user.uid);
            await setDoc(userDocRef, {
              email: userCredential.user.email,
              role: "Administrator",
              displayName: "GDS Admin"
            });
            toast({
              title: "Compte Administrateur Créé",
              description: "Le compte 'gds' a été initialisé avec succès.",
            });
             // La connexion est déjà faite par createUserWithEmailAndPassword, on peut sortir
             setIsSubmitting(false);
             return;
          } catch (error: any) {
            // Si l'utilisateur existe déjà, on tente de se connecter
            if (error.code === 'auth/email-already-in-use') {
              // L'utilisateur existe, on continue pour tenter la connexion normale
            } else {
              throw error; // Lancer une autre erreur
            }
          }
        } else {
          throw new Error("login-not-found");
        }
      }
      
      // Si on arrive ici, soit le login existe, soit c'est l'admin qui existait déjà
      email = loginDoc.exists() ? loginDoc.data().email : "gds@gds.com";
      await signInWithEmailAndPassword(auth, email, values.password);
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${values.login}`,
      });

    } catch (error: any) {
      const message =
        error.code === "auth/wrong-password" || error.code === "auth/invalid-credential" || error.message === "login-not-found"
          ? "Login ou mot de passe incorrect."
          : "Une erreur de connexion s'est produite.";
      
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-headline">
          Se connecter
        </CardTitle>
        <CardDescription className="text-center">
          Accédez à votre tableau de bord de gestion des stocks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="login"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} />
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
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
