
import { use } from "react";
import { InventoryDashboard } from "@/components/dashboard/inventory-dashboard";

export default function InventoryPage({ params }: { params: Promise<{ storeId: string; aisleId: string }> }) {
  const { storeId, aisleId } = use(params);
  return <InventoryDashboard storeId={storeId} aisleId={aisleId} />;
}
