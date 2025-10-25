
'use client';

import { use } from "react";
import { AislesDashboard } from "@/components/dashboard/aisles-dashboard";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function UserAislesPage({ params }: { params: Promise<{ userId: string, storeId: string }> }) {
  const { userId, storeId } = use(params);
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

  return <AislesDashboard userId={userId} storeId={storeId} />;
}
