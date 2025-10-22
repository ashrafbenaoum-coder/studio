
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calculator } from "lucide-react";

type CalculatorPopoverProps = {
  value: number;
  onValueChange: (value: number) => void;
};

export function CalculatorPopover({
  value,
  onValueChange,
}: CalculatorPopoverProps) {
  const [displayValue, setDisplayValue] = useState(value.toString());
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayValue(value.toString());
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(false);
    }
  }, [isOpen, value]);
  
  const handleDigitClick = (digit: string) => {
    if (waitingForSecondOperand) {
      setDisplayValue(digit);
      setWaitingForSecondOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? digit : displayValue + digit);
    }
  };

  const handleOperatorClick = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operator && !waitingForSecondOperand) {
      const result = calculate(firstOperand!, inputValue, operator);
      setDisplayValue(String(result));
      setFirstOperand(result);
    } else {
      setFirstOperand(inputValue);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };
  
  const handleEqualsClick = () => {
    if (!operator || firstOperand === null) return;
    const secondOperand = parseFloat(displayValue);
    const result = calculate(firstOperand, secondOperand, operator);
    onValueChange(result);
    setIsOpen(false);
  };

  const handleClearClick = () => {
    setDisplayValue("0");
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const calculate = (
    first: number,
    second: number,
    op: string
  ): number => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      case "*":
        return first * second;
      case "/":
        return first / second;
      default:
        return second;
    }
  };
  
  const calculatorButtons = [
    { label: "7", action: () => handleDigitClick("7") },
    { label: "8", action: () => handleDigitClick("8") },
    { label: "9", action: () => handleDigitClick("9") },
    { label: "/", action: () => handleOperatorClick("/"), variant: "outline" },
    { label: "4", action: () => handleDigitClick("4") },
    { label: "5", action: () => handleDigitClick("5") },
    { label: "6", action: () => handleDigitClick("6") },
    { label: "*", action: () => handleOperatorClick("*"), variant: "outline" },
    { label: "1", action: () => handleDigitClick("1") },
    { label: "2", action: () => handleDigitClick("2") },
    { label: "3", action: () => handleDigitClick("3") },
    { label: "-", action: () => handleOperatorClick("-"), variant: "outline" },
    { label: "C", action: handleClearClick, variant: "destructive" },
    { label: "0", action: () => handleDigitClick("0") },
    { label: "=", action: handleEqualsClick, className: "col-span-2", variant: "default" },
    { label: "+", action: () => handleOperatorClick("+"), variant: "outline" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
          <Calculator className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-2">
          <Input
            readOnly
            value={displayValue}
            className="h-12 text-right text-2xl font-mono"
          />
          <div className="grid grid-cols-4 gap-2">
            {calculatorButtons.map((btn, i) => (
                <Button
                    key={i}
                    variant={btn.variant as any || "secondary"}
                    onClick={btn.action}
                    className={btn.className}
                >
                    {btn.label}
                </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

