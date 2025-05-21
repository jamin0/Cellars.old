import { useState, useEffect } from "react";
import { VintageStock } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VintageManagerProps {
  vintageStocks: VintageStock[];
  onChange: (vintageStocks: VintageStock[]) => void;
}

export default function VintageManager({ vintageStocks, onChange }: VintageManagerProps) {
  const currentYear = new Date().getFullYear();
  const [vintage, setVintage] = useState<number>(currentYear);
  const [stock, setStock] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Validate vintage input
  useEffect(() => {
    if (vintage > currentYear) {
      setError(`Vintage cannot be later than ${currentYear}`);
    } else if (vintage < 1900) {
      setError("Vintage must be at least 1900");
    } else {
      setError(null);
    }
  }, [vintage, currentYear]);
  
  const handleAddVintage = () => {
    // Check if vintage is valid
    if (vintage > currentYear) {
      toast({
        variant: "destructive",
        title: "Invalid Vintage Year",
        description: `Vintage year cannot be later than ${currentYear}`,
      });
      return;
    }
    
    // Check if vintage already exists
    const exists = vintageStocks.some(vs => vs.vintage === vintage);
    
    if (exists) {
      // Update existing vintage
      const updated = vintageStocks.map(vs => 
        vs.vintage === vintage 
          ? { ...vs, stock: vs.stock + stock } 
          : vs
      );
      onChange(updated);
    } else {
      // Add new vintage
      onChange([...vintageStocks, { vintage, stock }]);
    }
    
    // Reset stock input but keep vintage
    setStock(1);
  };
  
  const handleRemoveVintage = (vintageToRemove: number) => {
    onChange(vintageStocks.filter(vs => vs.vintage !== vintageToRemove));
  };
  
  const handleStockChange = (vintage: number, newStock: number) => {
    if (newStock <= 0) {
      // Remove if stock is zero or negative
      handleRemoveVintage(vintage);
    } else {
      // Update stock level
      onChange(
        vintageStocks.map(vs => 
          vs.vintage === vintage 
            ? { ...vs, stock: newStock } 
            : vs
        )
      );
    }
  };
  
  const handleVintageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    // Don't update if the input is empty (so the user can delete and type a new value)
    if (!isNaN(value)) {
      setVintage(value);
    } else if (e.target.value === '') {
      setVintage(0); // Temporary value to allow clearing the input
    }
  };
  
  // Sort vintages by year (newest first)
  const sortedVintages = [...vintageStocks].sort((a, b) => b.vintage - a.vintage);
  
  return (
    <div className="space-y-4">
      <Label>Vintages</Label>
      
      {sortedVintages.length > 0 ? (
        <div className="space-y-2">
          {sortedVintages.map(vs => (
            <div key={vs.vintage} className="flex items-center gap-2">
              <span className="font-medium w-16">{vs.vintage}</span>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-r-none"
                  onClick={() => handleStockChange(vs.vintage, vs.stock - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={vs.stock}
                  onChange={(e) => handleStockChange(vs.vintage, parseInt(e.target.value) || 0)}
                  className="h-7 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-l-none"
                  onClick={() => handleStockChange(vs.vintage, vs.stock + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {vs.stock} bottle{vs.stock !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No vintages added yet.</p>
      )}
      
      <div className="pt-2 flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor="vintage" className="text-xs">Vintage Year</Label>
          <div className="relative">
            <Input
              id="vintage"
              type="number"
              min={1900}
              max={currentYear}
              value={vintage || ''}
              onChange={handleVintageChange}
              className={`w-24 ${error ? 'border-destructive' : ''}`}
            />
            {error && (
              <div className="absolute top-full mt-1 text-destructive text-xs flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="stock" className="text-xs">Bottles</Label>
          <Input
            id="stock"
            type="number"
            min={1}
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
        <Button 
          type="button" 
          size="sm" 
          onClick={handleAddVintage}
          className="mb-0.5"
          disabled={!!error}
        >
          Add Vintage
        </Button>
      </div>
    </div>
  );
}
