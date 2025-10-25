
'use client';

import { use } from "react";
import { StoresDashboard } from "@/components/dashboard/stores-dashboard";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserStoresPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: currentUser, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && currentUser?.email !== 'gds@gds.com') {
      router.replace('/dashboard');
    }
  }, [currentUser, isUserLoading, router]);

  if (isUserLoading || currentUser?.email !== 'gds@gds.com') {
    return (
        <div className="flex h-full items-center justify-center">
            <p>Chargement...</p>
        </div>
    )
  }

  return <StoresDashboard userId={userId} />;
}
