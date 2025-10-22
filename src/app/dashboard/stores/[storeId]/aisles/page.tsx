import { use } from "react";
import { AislesDashboard } from "@/components/dashboard/aisles-dashboard";

export default function AislesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  return <AislesDashboard storeId={storeId} />;
}
