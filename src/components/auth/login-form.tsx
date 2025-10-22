
"use client";

import { useRouter } from "next/navigation";
import {
  initiateEmailSignIn,
  initiateEmailSignUp,
  useAuth,
  useUser,
} from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";


const hardcodedEmail = "gds@gds.com";
const hardcodedPassword = "gdsidl";

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleLoginOrSignUp = async (authInstance: Auth, email: string, password: string) => {
    try {
      // First, try to sign in
      await signInWithEmailAndPassword(authInstance, email, password);
    } catch (signInError: any) {
      // If sign-in fails because the user doesn't exist, try to sign them up.
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(authInstance, email, password);
        } catch (signUpError) {
          // Handle sign-up errors (e.g., weak password)
          console.error("Sign-up failed after sign-in attempt failed:", signUpError);
        }
      } else {
        // Handle other sign-in errors (e.g., wrong password)
        console.error("Sign-in failed:", signInError);
      }
    }
  };
  

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p>Loading...</p>
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
        <div className="space-y-4">
          <Button onClick={() => handleLoginOrSignUp(auth, hardcodedEmail, hardcodedPassword)} className="w-full">
            Se connecter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
