
"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
  initiateAnonymousSignIn,
  useAuth,
  useUser,
} from "@/firebase";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";

const formSchema = z.object({
  email: z
    .string()
    .email({ message: "Veuillez entrer une adresse email valide." }),
  password: z
    .string()
    .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "gds@gds.com",
      password: "gdsidl",
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleEmailSignIn = (values: z.infer<typeof formSchema>) => {
    initiateEmailSignIn(auth, values.email, values.password);
  };

  const handleEmailSignUp = (values: z.infer<typeof formSchema>) => {
    initiateEmailSignUp(auth, values.email, values.password);
  };

  const handleAnonymousSignIn = () => {
    initiateAnonymousSignIn(auth);
  };
  
  if (isUserLoading || user) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <p>Loading...</p>
        </div>
      )
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
          <form
            onSubmit={form.handleSubmit(handleEmailSignIn)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="nom@exemple.com"
                        {...field}
                        className="pl-10"
                      />
                    </FormControl>
                  </div>
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
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Mot de passe"
                        {...field}
                        className="pl-10"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="!mt-8 flex flex-col gap-2">
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={form.handleSubmit(handleEmailSignUp)}
              >
                S'inscrire
              </Button>
               <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                    </span>
                </div>
              </div>
               <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleAnonymousSignIn}
                >
                <UserIcon className="mr-2 h-4 w-4" />
                Connexion Anonyme
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
