
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
import { Loader2 } from "lucide-react";

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
  const codeReader = useRef(new BrowserMultiFormatReader());
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const reader = codeReader.current;

    const startScanner = async () => {
      if (!open || !videoRef.current) return;
      setIsLoading(true);
      setHasCameraPermission(undefined);

      try {
        const constraints = { video: { facingMode: "environment" } };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        setHasCameraPermission(true);
        videoRef.current.srcObject = stream;

        // Ensure video is playing before trying to decode
        await videoRef.current.play();

        setIsLoading(false);

        await reader.decodeFromStream(stream, videoRef.current, (result, err) => {
          if (result) {
            onScan(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scanning error:", err);
             toast({
              variant: "destructive",
              title: "Erreur de scan",
              description: "Une erreur est survenue lors du scan.",
            });
          }
        });
      } catch (error) {
        console.error("Error accessing camera:", error);
        if ((error as Error).name === "NotAllowedError" || (error as Error).name === "PermissionDeniedError") {
          setHasCameraPermission(false);
          toast({
            variant: "destructive",
            title: "Accès à la caméra refusé",
            description: "Veuillez autoriser l'accès à la caméra.",
          });
        } else {
           toast({
            variant: "destructive",
            title: "Erreur de caméra",
            description: "Impossible de démarrer la caméra. Vérifiez qu'elle n'est pas utilisée par une autre application.",
          });
        }
        setIsLoading(false);
        onOpenChange(false);
      }
    };

    if (open) {
      startScanner();
    }

    return () => {
      // Stop scanner and release camera
      reader.reset();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [open, onScan, onOpenChange, toast]);

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
            <video ref={videoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
            {isLoading && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Démarrage de la caméra...</p>
                </div>
            )}
            {hasCameraPermission === false && (
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
