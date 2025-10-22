import type { Alert } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Bot, Lightbulb, Loader2 } from "lucide-react";

type ExpirationAlertsProps = {
  alerts: Alert[];
  onAnalyze: () => void;
  isLoading: boolean;
};

export function ExpirationAlerts({
  alerts,
  onAnalyze,
  isLoading,
}: ExpirationAlertsProps) {
  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Bot className="h-5 w-5" />
          Analyse IA
        </CardTitle>
        <CardDescription>
          L'IA analyse vos stocks et suggère des actions pour optimiser les
          ventes et réduire le gaspillage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onAnalyze} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Analyse en cours..." : "Lancer l'analyse"}
        </Button>

        <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
          {alerts.length === 0 && !isLoading && (
            <div className="pt-4 text-center text-sm text-muted-foreground">
              Aucune suggestion pour le moment. Lancez une analyse pour
              commencer.
            </div>
          )}
          {alerts.map((alert, index) => (
            <div
              key={index}
              className="rounded-lg border bg-background p-3 shadow-sm"
            >
              <p className="text-sm font-semibold">
                Code barre: {alert.barcode}
              </p>
              <p className="text-lg font-bold text-primary">
                {alert.suggestedAction}
              </p>
              <p className="text-xs text-muted-foreground">{alert.reason}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
