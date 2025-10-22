
"use client";

import { useState } from "react";
import { Scanner } from "react-zxing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type BarcodeScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string | null) => void;
};

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
}: BarcodeScannerDialogProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | undefined
  >(undefined);

  const handleScanSuccess = (result: any) => {
    const scannedText = result.getText();
    if (scannedText) {
      onScan(scannedText);
    }
  };

  const handleScanError = (error: Error) => {
    console.error("Barcode scanning error:", error);
    if (error.name === "NotAllowedError") {
       setHasCameraPermission(false);
       toast({
          variant: "destructive",
          title: "Accès à la caméra refusé",
          description:
            "Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.",
        });
    } else {
      toast({
        variant: "destructive",
        title: "Erreur du scanner",
        description: "Une erreur inattendue est survenue avec le scanner.",
      });
    }
    onOpenChange(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setHasCameraPermission(undefined);
    }
    onOpenChange(isOpen);
  };


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scanner le code barre</DialogTitle>
          <DialogDescription>
            Pointez la caméra arrière de votre appareil sur le code-barres.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-md overflow-hidden border relative bg-muted aspect-video flex items-center justify-center">
          {hasCameraPermission === false ? (
             <div className="absolute inset-0 flex items-center justify-center p-4">
               <Alert variant="destructive">
                 <AlertTitle>Accès à la caméra requis</AlertTitle>
                 <AlertDescription>
                   Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
                 </AlertDescription>
               </Alert>
             </div>
          ) : (
             <Scanner
                onResult={handleScanSuccess}
                onError={handleScanError}
                onDecode={() => setHasCameraPermission(true)}
                constraints={{ video: { facingMode: 'environment' }}}
                className="w-full h-full object-cover"
              />
          )}
          {hasCameraPermission === undefined && (
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Démarrage de la caméra...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
