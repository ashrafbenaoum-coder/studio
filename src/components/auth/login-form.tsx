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
import { doc, getDoc, getFirestore } from "firebase/firestore";
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
      const loginRef = doc(firestore, "logins", values.login);
      const loginDoc = await getDoc(loginRef);

      if (!loginDoc.exists()) {
        throw new Error("login-not-found");
      }

      const email = loginDoc.data().email;
      await signInWithEmailAndPassword(auth, email, values.password);
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${values.login}`,
      });
      // The useEffect will handle the redirect

    } catch (error: any) {
      const message =
        error.code === "auth/wrong-password" || error.message === "login-not-found"
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
