"use client";

import { useState, useRef, useEffect } from "react";
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
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }

    let activeStream: MediaStream | null = null;
    const reader = codeReader.current;

    const startScanner = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

      try {
        // Ask for camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setHasCameraPermission(true);
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // reset any previous decoding
          reader.reset();

          // decodeOnceFromVideoDevice is more stable than decodeFromStream
          await reader.decodeOnceFromVideoDevice(undefined, videoRef.current).then(result => {
            if (result) {
              onScan(result.getText());
              setTimeout(() => onOpenChange(false), 500);
            }
          }).catch(error => {
            if (error && !(error instanceof NotFoundException)) {
              console.error("Barcode decoding error:", error);
            }
          });
        }
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

    const stopScanner = () => {
      try {
        if (reader) reader.reset();
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
          activeStream = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    };

    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    // Cleanup when dialog closes or component unmounts
    return () => {
      stopScanner();
    };
  }, [open, onScan, onOpenChange, toast]);

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
