
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
  const codeReaderRef = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let stream: MediaStream | undefined;

    const startScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Prefer the rear camera ('environment')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setHasCameraPermission(true);

        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
           videoRef.current?.play();
        };

        await codeReaderRef.current.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Barcode scanning error:", err);
            toast({
              variant: "destructive",
              title: "Erreur du scanner",
              description:
                "Une erreur inattendue est survenue avec le scanner.",
            });
            onOpenChange(false);
          }
        });
      } catch (error: any) {
        console.error("Camera access error:", error);
        setHasCameraPermission(false);
        if (error.name === "NotAllowedError") {
          toast({
            variant: "destructive",
            title: "Accès à la caméra refusé",
            description:
              "Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.",
          });
        } else {
           toast({
            variant: "destructive",
            title: "Erreur de caméra",
            description: "Impossible d'accéder à la caméra. Assurez-vous qu'elle n'est pas utilisée par une autre application.",
          });
        }
      }
    };
    
    if (open) {
      startScanner();
    }

    return () => {
      // Clean up resources
      codeReaderRef.current.reset();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [open, onScan, onOpenChange, toast]);

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
        <div className="mt-4 rounded-md overflow-hidden border relative bg-muted">
          <video
            ref={videoRef}
            className="w-full aspect-video rounded-md"
            muted
            playsInline
          />
          {hasCameraPermission === undefined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">En attente de la caméra...</p>
            </div>
          )}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
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
