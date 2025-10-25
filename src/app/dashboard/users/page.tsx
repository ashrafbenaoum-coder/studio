
'use client';

import { UsersDashboard } from "@/components/dashboard/users-dashboard";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UsersPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      // Must be the admin to see this page
      if (user?.email !== 'gds@gds.com') {
        router.replace('/dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user?.email !== 'gds@gds.com') {
    return (
        <div className="flex h-full items-center justify-center">
            <p>Chargement...</p>
        </div>
    )
  }

  return <UsersDashboard />;
}
