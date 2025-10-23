"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MapPin, Barcode, Package, Calendar as CalendarIcon, Save, Camera, Plus, Minus, RotateCcw } from "lucide-react";

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
import type { Product } from "@/lib/types";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { useToast } from "@/hooks/use-toast";
import { CalculatorPopover } from "./calculator-popover";

const formSchema = z.object({
  address: z.string().regex(/^([A-Z])-\d{3}-\d{4}-\d{2}$/, "Le format de l'adresse doit être A-XXX-XXXX-XX."),
  barcode: z.string().min(1, "Code barre est requis."),
  quantity: z.coerce.number().min(0, "La quantité ne peut pas être négative."),
  expirationDate: z.string().regex(/^\d{8}$/, "La date doit être au format YYYYMMDD."),
});

const generatePickingRange = (aisleName: string): { impairStart: string; impairEnd: string; pairStart: string; pairEnd: string; } | null => {
    const match = aisleName.match(/^([A-Z])(\d+)$/);
    if (!match) return null;

    const prefix = match[1];
    const sectionNumber = parseInt(match[2], 10);
    const section = sectionNumber.toString().padStart(3, '0');

    return {
        impairStart: `${prefix}-${section}-0001-00`,
        impairEnd: `${prefix}-${section}-0205-00`,
        pairStart: `${prefix}-${section}-0200-00`,
        pairEnd: `${prefix}-${section}-0002-00`,
    };
};

type InventoryFormProps = {
  onAddProduct: (product: Omit<Product, "id" | "storeId" | "aisleId">) => void;
  aisleName?: string;
};

export function InventoryForm({ onAddProduct, aisleName }: InventoryFormProps) {
  const { toast } = useToast();
  const [isScannerOpen, setScannerOpen] = useState(false);

  const getInitialAddress = (name?: string) => {
    if (!name) return "";
    const range = generatePickingRange(name);
    return range ? range.impairStart : "";
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: getInitialAddress(aisleName),
      barcode: "",
      quantity: 0,
      expirationDate: "",
    },
  });

  useEffect(() => {
    form.reset({
      address: getInitialAddress(aisleName),
      barcode: "",
      quantity: 0,
      expirationDate: ""
    });
  }, [aisleName, form]);

  function getNextAddress(current: string, rayonKey: string): string | null {
    const range = generatePickingRange(rayonKey);
    if (!range) return null;
  
    const parts = current.split('-');
    if (parts.length !== 4) return null; 

    const prefix = parts[0];
    const section = parts[1];
    let location = parseInt(parts[2], 10);
    const level = parts[3];

    if (isNaN(location)) return null;

    if (location % 2 !== 0 ) { // Impair
        if (current === range.impairEnd) return null;
        location += 2;
    } else { // Pair
        if (current === range.pairEnd) return null;
        location -= 2;
    }
  
    return `${prefix}-${section}-${location.toString().padStart(4, "0")}-${level}`;
  }
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddProduct(values);
  
    const rayonKey = aisleName;

    if (rayonKey) {
      const nextAddress = getNextAddress(values.address, rayonKey);
      if (nextAddress) {
        form.reset({
          ...values,
          address: nextAddress,
          barcode: "", 
          quantity: 0, 
          expirationDate: "" 
        });
      } else {
        toast({
          title: "Fin du rayon",
          description: "Toutes les adresses de ce chemin ont été utilisées.",
        });
        form.reset({ address: "", barcode: "", quantity: 0, expirationDate: ""});
      }
    } else {
        toast({
          variant: "destructive",
          title: "Rayon non configuré",
          description: `La logique de picking pour le rayon ${rayonKey} n'est pas définie.`,
        });
        form.reset({ address: "", barcode: "", quantity: 0, expirationDate: ""});
    }
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
  
  const handleClearForm = () => {
    form.reset({
      address: getInitialAddress(aisleName),
      barcode: "",
      quantity: 0,
      expirationDate: "",
    });
    toast({
      title: "Champs réinitialisés",
      description: "Le formulaire a été vidé.",
    });
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
                          placeholder="Ex: A-001-0001-00"
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

              <div className="flex w-full gap-2 !mt-6">
                <Button type="button" variant="outline" className="w-full" onClick={handleClearForm}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Réinitialiser
                </Button>
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
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
