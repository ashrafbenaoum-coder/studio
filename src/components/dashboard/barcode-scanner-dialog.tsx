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
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }

    const reader = codeReader.current;

    const startScanner = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

      try {
        const videoInputDevices = await reader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
            setHasCameraPermission(false);
            toast({ variant: "destructive", title: "Aucune caméra trouvée"});
            onOpenChange(false);
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            deviceId: videoInputDevices[0].deviceId
          },
        });
        setHasCameraPermission(true);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          reader.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result) {
              onScan(result.getText());
              onOpenChange(false);
            }
            if (error && !(error instanceof NotFoundException)) {
                console.error(error);
            }
          });
        }
      } catch (error: any) {
        setHasCameraPermission(false);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          toast({
            variant: "destructive",
            title: "Accès à la caméra refusé",
            description: "Veuillez autoriser l'accès à la caméra dans les paramètres.",
          });
        } else {
          console.error("Erreur de caméra inattendue:", error);
          toast({
            variant: "destructive",
            title: "Erreur de caméra",
            description: "Impossible d'accéder à la caméra.",
          });
        }
        onOpenChange(false);
      }
    };

    const stopScanner = () => {
      reader.reset();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, onOpenChange, onScan, toast]);

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
