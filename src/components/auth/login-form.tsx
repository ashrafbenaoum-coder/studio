
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { initiateEmailSignIn, useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect } from "react";

const hardcodedEmail = "gds@gds.com";
const hardcodedPassword = "gdsidl";

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const form = useForm();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleEmailSignIn = () => {
    initiateEmailSignIn(auth, hardcodedEmail, hardcodedPassword);
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
          The registration field is not available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleEmailSignIn)}
          className="space-y-6"
        >
          <Button type="submit" className="w-full !mt-8">
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
