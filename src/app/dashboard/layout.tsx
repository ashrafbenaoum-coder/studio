"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const handleLogout = () => {
    auth.signOut();
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur md:px-6">
          <nav className="flex w-full items-center justify-between">
            <Logo />
            <Skeleton className="h-8 w-8 rounded-full" />
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="lg:col-span-1">
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card/80 px-4 backdrop-blur md:px-6 z-10">
        <nav className="flex w-full items-center justify-between">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage
                      src={user.photoURL ?? "https://picsum.photos/seed/user-avatar/32/32"}
                      data-ai-hint="person face"
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
