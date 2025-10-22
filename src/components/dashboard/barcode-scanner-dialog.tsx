
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
import type {Result} from '@zxing/library';

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
  const [hasPermission, setHasPermission] = useState<boolean | undefined>(undefined);

  const handleScan = (result: Result | undefined | null) => {
    if (result) {
        onScan(result.getText());
    }
  };

  const handleError = (error: Error) => {
    console.error("Camera error:", error);
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      setHasPermission(false);
      toast({
        variant: "destructive",
        title: "Accès à la caméra refusé",
        description: "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erreur de caméra",
        description: "Impossible d'accéder à la caméra. Réessayez ou vérifiez les permissions.",
      });
    }
    // Close the dialog on error to prevent a broken state
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scanner le code barre</DialogTitle>
          <DialogDescription>
            Pointez la caméra de votre appareil sur un code-barres.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-md overflow-hidden border relative bg-muted aspect-video flex items-center justify-center">
            {open && (
                 <BarcodeScanner
                    onResult={handleScan}
                    onError={handleError}
                    onDeviceChange={(devices) => setHasPermission(true)}
                    videoConstraints={{ facingMode: "environment" }}
                 />
            )}
            {hasPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                   <Alert variant="destructive">
                     <AlertTitle>Accès à la caméra requis</AlertTitle>
                     <AlertDescription>
                       Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
                     </AlertDescription>
                   </Alert>
                 </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
