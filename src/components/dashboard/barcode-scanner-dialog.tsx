"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const codeReader = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const startScanner = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !videoRef.current) {
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        
        setHasCameraPermission(true);
        videoRef.current.srcObject = stream;
        
        // Use decodeContinuously for better performance and responsiveness
        controlsRef.current = await codeReader.current.decodeContinuously(
          videoRef.current,
          (result, error) => {
            if (result) {
              // Once a result is found, stop the scanner and call the onScan callback
              stopScanner();
              onScan(result.getText());
              setTimeout(() => onOpenChange(false), 300);
            }
            
            if (error && !(error instanceof NotFoundException)) {
              console.error("Barcode decoding error:", error);
            }
          }
        );
      } catch (error: any) {
        console.error("Camera access error:", error);
        setHasCameraPermission(false);

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast({
            variant: "destructive",
            title: "Accès à la caméra refusé",
            description: "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de caméra",
            description: "Impossible d'accéder à la caméra. Vérifiez les permissions ou réessayez.",
          });
        }
        setTimeout(() => onOpenChange(false), 500);
      }
    };

    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    // Cleanup function when the component unmounts or the dialog is closed
    return () => {
      stopScanner();
    };
  }, [open, onScan, onOpenChange, toast, stopScanner]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scanner le code-barres</DialogTitle>
          <DialogDescription>
            Pointez la caméra arrière de votre appareil sur un code-barres.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-md overflow-hidden border relative bg-muted aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
          {/* Optional: Add a scanning line/reticle overlay here for better UX */}
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Alert variant="destructive">
                <AlertTitle>Accès à la caméra requis</AlertTitle>
                <AlertDescription>
                  Veuillez autoriser l'accès à la caméra pour scanner les codes-barres.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
