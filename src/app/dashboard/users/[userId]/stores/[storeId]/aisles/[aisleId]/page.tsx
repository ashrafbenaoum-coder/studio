
'use client';

import { use } from "react";
import { InventoryDashboard } from "@/components/dashboard/inventory-dashboard";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function UserInventoryPage({ params }: { params: Promise<{ userId: string, storeId: string, aisleId: string }> }) {
  const { userId, storeId, aisleId } = use(params);
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

  return <InventoryDashboard userId={userId} storeId={storeId} aisleId={aisleId} />;
}
