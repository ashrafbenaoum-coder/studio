"use client";

import { useState } from "react";
import { BarcodeScanner } from "react-zxing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

  const handleResult = (result: any) => {
    if (result) {
      onScan(result.getText());
    }
  };

  const handleError = (error: any) => {
    if (error.name === "NotAllowedError") {
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Accès à la caméra refusé",
        description:
          "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.",
      });
    } else {
      console.error("Barcode scanner error:", error);
      toast({
        variant: "destructive",
        title: "Erreur du scanner",
        description: "Une erreur s'est produite avec le scanner de code-barres.",
      });
    }
    setHasCameraPermission(false);
  };
  
  // This is a workaround to make BarcodeScanner ask for permission again
  // if it was denied and then the user re-opens the dialog.
  const handleOpenChange = (isOpen: boolean) => {
    if(isOpen) {
      setHasCameraPermission(undefined);
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scanner le code barre</DialogTitle>
          <DialogDescription>
            Pointez la caméra de votre appareil sur le code-barres du produit.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-md overflow-hidden border">
          {hasCameraPermission === undefined && (
             <div className="w-full aspect-video bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">En attente de la caméra...</p>
             </div>
          )}
          {hasCameraPermission === false && (
             <div className="w-full aspect-video bg-muted flex items-center justify-center p-4">
                <Alert variant="destructive">
                  <AlertTitle>Accès à la caméra requis</AlertTitle>
                  <AlertDescription>
                    Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                  </AlertDescription>
                </Alert>
             </div>
          )}
          {/* Always render the scanner to request permission, but we can hide it */}
          <div className={hasCameraPermission === false ? 'hidden': 'block'}>
            <BarcodeScanner
              onResult={handleResult}
              onError={handleError}
              onCameraAccess={setHasCameraPermission}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}