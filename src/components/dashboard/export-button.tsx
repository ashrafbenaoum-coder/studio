
"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ExportButton() {
  const { toast } = useToast();
  
  const handleExport = () => {
    // In a real app, you would fetch the data to export here.
    // For now, we'll just show a toast.
    toast({
      title: "Exportation",
      description: "La fonctionnalité d'exportation sera bientôt disponible.",
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Exporter
    </Button>
  );
}
