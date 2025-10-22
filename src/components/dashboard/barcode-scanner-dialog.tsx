
"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, NotFoundException, Result } from "@zxing/library";
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
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let stream: MediaStream | null = null;
    const reader = codeReader.current;

    const startScanner = async () => {
      if (!open || !videoRef.current) {
        return;
      }
      
      try {
        // Ask for camera permission
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setHasCameraPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Start decoding from the video stream
          await reader.decodeFromStream(stream, videoRef.current, (result, error) => {
            if (result) {
              onScan(result.getText());
            }
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
        onOpenChange(false); // Close dialog on error
      }
    };

    const stopScanner = () => {
      // Stop decoding
      reader.reset();
      // Stop all video tracks to turn off the camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
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

    // Cleanup function to stop scanner when component unmounts or dialog closes
    return () => {
      stopScanner();
    };
  }, [open, onScan, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scanner le code barre</DialogTitle>
          <DialogDescription>
            Pointez la caméra arrière de votre appareil sur un code-barres.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 rounded-md overflow-hidden border relative bg-muted aspect-video flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
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
