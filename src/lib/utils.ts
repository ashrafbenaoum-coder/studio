import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


function formatToISODate(dateStr: string): string | null {
    if (!/^\d{8}$/.test(dateStr)) {
      return dateStr; 
    }
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
}


export function getStatus(expirationDate: string): {
  label: string;
  variant: "default" | "secondary" | "destructive";
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isoDate = formatToISODate(expirationDate);
  if (!isoDate) {
    return { label: "Date invalide", variant: "destructive"};
  }
  const expDate = parseISO(isoDate);
  const daysDiff = differenceInDays(expDate, today);

  if (daysDiff < 0) {
    return { label: "Expiré", variant: "destructive" };
  }
  if (daysDiff <= 7) {
    return { label: "Expire bientôt", variant: "secondary" };
  }
  return { label: "En stock", variant: "default" };
}
