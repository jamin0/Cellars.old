import { useState } from "react";
import { VintageStock } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";

interface VintageManagerProps {
  vintageStocks: VintageStock[];
  onChange: (vintageStocks: VintageStock[]) => void;
}

export default function VintageManager({ vintageStocks, onChange }: VintageManagerProps) {
  const [vintage, setVintage] = useState<number>(new Date().getFullYear());
  const [stock, setStock] = useState<number>(1);
  
  const handleAddVintage = () => {
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
          <Input
            id="vintage"
            type="number"
            min={1900}
            max={new Date().getFullYear()}
            value={vintage}
            onChange={(e) => setVintage(parseInt(e.target.value) || new Date().getFullYear())}
            className="w-24"
          />
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
        >
          Add Vintage
        </Button>
      </div>
    </div>
  );
}
