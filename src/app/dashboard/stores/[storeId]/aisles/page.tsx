import { AislesDashboard } from "@/components/dashboard/aisles-dashboard";

export default function AislesPage({ params }: { params: { storeId: string } }) {
  return <AislesDashboard storeId={params.storeId} />;
}
