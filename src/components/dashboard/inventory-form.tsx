
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parse } from "date-fns";
import { MapPin, Barcode, Package, Calendar as CalendarIcon, Save, Camera, Plus, Minus, Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { useToast } from "@/hooks/use-toast";
import { CalculatorPopover } from "./calculator-popover";

const formSchema = z.object({
  address: z.string().regex(/^A-\d{3}-\d{4}-\d{2}$/, "Le format de l'adresse doit être A-XXX-XXXX-XX."),
  barcode: z.string().min(1, "Code barre est requis."),
  quantity: z.coerce.number().min(0, "La quantité ne peut pas être négative."),
  expirationDate: z.string().regex(/^\d{8}$/, "La date doit être au format YYYYMMDD."),
});

type InventoryFormProps = {
  onAddProduct: (product: Omit<Product, "id" | "storeId" | "aisleId">) => void;
};

export function InventoryForm({ onAddProduct }: InventoryFormProps) {
  const { toast } = useToast();
  const [isScannerOpen, setScannerOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      barcode: "",
      quantity: 0,
      expirationDate: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddProduct(values);
    form.reset();
  }

  const handleBarcodeScan = (result: string | null) => {
    if (result) {
      form.setValue("barcode", result);
      toast({
        title: "Code barre scanné",
        description: `Code barre: ${result}`,
      });
    }
    setScannerOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Ajouter un produit</CardTitle>
          <CardDescription>
            Remplissez les informations du produit à ajouter à l'inventaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Ex: A-001-0001-01"
                          {...field}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code barre</FormLabel>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Scanner ou entrer le code barre"
                          {...field}
                          className="pl-10 pr-12"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setScannerOpen(true)}
                      >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Scanner un code-barres</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité</FormLabel>
                       <div className="relative flex items-center">
                        <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            className="pl-10 pr-[88px] text-center"
                          />
                        </FormControl>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                          <CalculatorPopover
                            value={field.value}
                            onValueChange={(val) => field.onChange(val)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              field.onChange(Math.max(0, field.value - 1))
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => field.onChange(field.value + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'expiration</FormLabel>
                       <div className="relative">
                         <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                         <FormControl>
                            <Input
                              placeholder="YYYYMMDD"
                              {...field}
                              className="pl-10"
                            />
                         </FormControl>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full !mt-6">
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />
    </>
  );
}
