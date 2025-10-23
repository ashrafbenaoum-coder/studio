
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  login: z.string().min(1, "Utilisateur est requis."),
  password: z.string().min(1, "Mot de passe est requis."),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [loginError, setLoginError] = useState<string | null>(null);

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
    setLoginError(null);
    const firestore = getFirestore(auth.app);
    let emailToLogin = values.login;

    try {
        // If login does not contain '@', assume it's a custom login and fetch the email
        if (!values.login.includes('@')) {
            const loginDocRef = doc(firestore, "logins", values.login);
            const loginDoc = await getDoc(loginDocRef);

            if (loginDoc.exists()) {
                emailToLogin = loginDoc.data().email;
            } else {
                throw new Error("Login not found");
            }
        }
        
        const userCredential = await signInWithEmailAndPassword(auth, emailToLogin, values.password);
        const loggedInUser = userCredential.user;

        // Special handling for initial 'gds' admin user setup
        if (loggedInUser && values.login.toLowerCase() === "gds") {
            const userDocRef = doc(firestore, "users", loggedInUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
              await setDoc(userDocRef, {
                email: loggedInUser.email,
                role: "Administrator",
              });
              toast({
                title: "Compte Administrateur Initialisé",
                description: "Le rôle d'administrateur a été assigné à 'gds'.",
              });
            }
        }

    } catch (error: any) {
      let message = "Utilisateur ou mot de passe incorrect.";
      if (error.message === "Login not found") {
        message = "Le nom d'utilisateur n'existe pas.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        message = "Utilisateur ou mot de passe incorrect.";
      } else {
        message = "Une erreur de connexion s'est produite.";
      }

      setLoginError(message);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: message,
      });
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
    <Card className="w-full">
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
                  <FormLabel>Utilisateur</FormLabel>
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
            {loginError && (
              <p className="text-sm font-medium text-destructive">{loginError}</p>
            )}
            <Button type="submit" className="w-full !mt-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
