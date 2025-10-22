"use client";

import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    let stream: MediaStream;

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          codeReader
            .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
              if (result) {
                onScan(result.getText());
              }
              if (err && !(err instanceof NotFoundException)) {
                console.error(err);
                toast({
                  variant: "destructive",
                  title: "Erreur du scanner",
                  description: "Une erreur s'est produite avec le scanner de code-barres.",
                });
                onOpenChange(false);
              }
            })
            .catch((err) => {
               if (err.name === "NotAllowedError") {
                  setHasCameraPermission(false);
                  toast({
                    variant: "destructive",
                    title: "Accès à la caméra refusé",
                    description:
                      "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.",
                  });
                } else {
                  console.error("Barcode scanner error:", err);
                  toast({
                    variant: "destructive",
                    title: "Erreur du scanner",
                    description: "Une erreur s'est produite avec le scanner de code-barres.",
                  });
                }
            });
        }
      } catch (error: any) {
        if (error.name === "NotAllowedError") {
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Accès à la caméra refusé",
            description:
              "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser cette fonctionnalité.",
          });
        } else {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Camera Access Denied",
            description:
              "Please enable camera permissions in your browser settings to use this app.",
          });
        }
      }
    };

    getCameraPermission();

    return () => {
      codeReader.reset();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, onScan, onOpenChange, toast]);
  
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
          <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
          {hasCameraPermission === undefined && (
             <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">En attente de la caméra...</p>
             </div>
          )}
          {hasCameraPermission === false && (
             <div className="absolute inset-0 bg-muted flex items-center justify-center p-4">
                <Alert variant="destructive">
                  <AlertTitle>Accès à la caméra requis</AlertTitle>
                  <AlertDescription>
                    Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                  </AlertDescription>
                </Alert>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
