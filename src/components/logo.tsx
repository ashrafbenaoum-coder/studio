import { Package } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2" aria-label="StockFlow logo">
      <div className="rounded-lg bg-primary p-1.5">
        <Package className="h-5 w-5 text-primary-foreground" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground font-headline">
        StockFlow
      </h1>
    </div>
  );
}
