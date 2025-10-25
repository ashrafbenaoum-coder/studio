
"use client";

import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { setDoc, doc } from "firebase/firestore";
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().min(1, "L'identifiant est requis."),
  password: z.string().min(1, "Mot de passe est requis."),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleAnonymousSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInAnonymously(auth);
      const userDocRef = doc(firestore, "users", result.user.uid);
      const userProfileData = {
          email: `anonymous_${result.user.uid}@example.com`,
          displayName: "Anonymous User",
          role: "Viewer"
      };
      await setDoc(userDocRef, userProfileData, { merge: true });

      toast({
          title: "Connexion anonyme réussie",
          description: "Vous êtes maintenant connecté en tant qu'utilisateur anonyme.",
      });
    } catch (error) {
      toast({
          variant: "destructive",
          title: "Erreur de connexion anonyme",
          description: "Une erreur s'est produite lors de la tentative de connexion anonyme.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const userDocRef = doc(firestore, "users", result.user.uid);
        const userProfileData = {
            email: result.user.email,
            displayName: result.user.displayName,
            role: "Viewer"
        };
        await setDoc(userDocRef, userProfileData, { merge: true });
        
        toast({
            title: "Connexion réussie",
            description: `Bienvenue, ${result.user.displayName}`,
        });
    } catch (error: any) {
        let description = "Une erreur s'est produite lors de la connexion avec Google.";
        if (error.code === 'auth/account-exists-with-different-credential') {
            description = "Un compte existe déjà avec cet e-mail. Essayez de vous connecter avec une autre méthode.";
        }
        toast({
            variant: "destructive",
            title: "Erreur de connexion Google",
            description: description,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    let email = values.email;
    if (!email.includes('@')) {
      email = `${email}@gds.com`;
    }
    
    if (mode === 'signup') {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, values.password);
            const userDocRef = doc(firestore, "users", userCredential.user.uid);
            const isGdsAdmin = email.toLowerCase() === "gds@gds.com";
            
            const userProfileData = {
                email: userCredential.user.email,
                displayName: email.split('@')[0],
                role: isGdsAdmin ? "Administrator" : "Viewer"
            };
            
            await setDoc(userDocRef, userProfileData, { merge: true });

            toast({
                title: "Compte créé avec succès",
                description: `Bienvenue, ${email.split('@')[0]}`,
            });
        } catch (error: any) {
            const message = error.code === 'auth/email-already-in-use' 
                ? "Cet email est déjà utilisé." 
                : "Impossible de créer le compte.";
            toast({
                variant: "destructive",
                title: "Erreur de création de compte",
                description: message,
            });
        } finally {
            setIsSubmitting(false);
        }
    } else { // Login mode
        try {
          await signInWithEmailAndPassword(auth, email, values.password);
          toast({
            title: "Connexion réussie",
            description: `Bienvenue`,
          });
    
        } catch (error: any) {
          const message =
            error.code === "auth/wrong-password" || error.code === "auth/user-not-found" || error.code === "auth/invalid-credential"
              ? "Email ou mot de passe incorrect."
              : "Une erreur de connexion s'est produite.";
          
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: message,
          });
        } finally {
          setIsSubmitting(false);
        }
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
          {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'login' ? 'Accédez à votre tableau de bord de gestion des stocks.' : 'Remplissez les informations pour créer un compte.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
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
            <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "En cours..." : (mode === 'login' ? 'Se connecter' : 'Créer le compte')}
            </Button>
          </form>
        </Form>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
               <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.95-4.25 1.95-3.52 0-6.43-2.88-6.43-6.43s2.91-6.43 6.43-6.43c1.93 0 3.26.74 4.18 1.62l2.35-2.35C17.07 3.32 15.04 2.5 12.48 2.5c-5.48 0-9.88 4.4-9.88 9.88s4.4 9.88 9.88 9.88c2.92 0 5.1-1 6.8-2.65 1.83-1.73 2.4-4.25 2.4-6.55 0-.57-.05-.98-.13-1.38z"></path></svg>
              Google
            </Button>
             <Button variant="secondary" className="w-full" onClick={handleAnonymousSignIn} disabled={isSubmitting}>
              Connexion anonyme
            </Button>
        </div>
        
        <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="underline underline-offset-4 hover:text-primary"
            >
            {mode === 'login' ? "Vous n'avez pas de compte? Créer un compte" : "Vous avez déjà un compte? Se connecter"}
          </button>
        </p>

      </CardContent>
    </Card>
  );
}
