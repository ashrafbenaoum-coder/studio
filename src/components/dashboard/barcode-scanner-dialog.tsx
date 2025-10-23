"use client";

import { useState, useRef, useEffect } from "react";
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
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
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!codeReader.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.PDF_417,
        BarcodeFormat.AZTEC,
      ]);
      codeReader.current = new BrowserMultiFormatReader(hints);
    }

    const reader = codeReader.current;

    const startScanner = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        setHasCameraPermission(true);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
            if (result) {
              onScan(result.getText());
              onOpenChange(false);
              reader.reset();
            }
          });
        }
      } catch (error: any) {
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

    return () => stopScanner();
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