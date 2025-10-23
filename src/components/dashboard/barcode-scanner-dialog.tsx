"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from "@zxing/library";
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
  const readerRef = useRef<MultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanner = useCallback(() => {
    readerRef.current?.reset();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!readerRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
      ]);
      const reader = new MultiFormatReader();
      reader.setHints(hints);
      readerRef.current = reader;
    }

    const startScanner = (stream: MediaStream) => {
        if (videoRef.current && readerRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Video play failed:", e));

            readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
                if (result) {
                    onScan(result.getText());
                    onOpenChange(false); // Close dialog on successful scan
                } else if (error && !(error instanceof NotFoundException)) {
                    console.error("Barcode decoding error:", error);
                }
            });
        }
    }
    
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        setHasCameraPermission(true);
        streamRef.current = stream;
        startScanner(stream);
      } catch (error: any) {
        setHasCameraPermission(false);
        console.error("Error accessing camera:", error);
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
            description: "Impossible d'accéder à la caméra. Vérifiez qu'elle n'est pas utilisée par une autre application.",
          });
        }
        onOpenChange(false); // Close dialog on permission error
      }
    };

    if (open) {
      getCameraPermission();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, onOpenChange, onScan, toast, stopScanner]);

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
                  Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                </AlertDescription>
              </Alert>
            </div>
          )}
           {hasCameraPermission === undefined && (
             <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-muted-foreground">Demande d'accès à la caméra...</p>
             </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
