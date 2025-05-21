import { useMemo } from "react";
import { Link } from "wouter";
import { Wine } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor } from "@/lib/wine-categories";

interface WineCardProps {
  wine: Wine;
  viewMode?: "grid" | "list";
}

export default function WineCard({ wine, viewMode = "grid" }: WineCardProps) {
  const { id, name, wine: wineType, subType, producer, stockLevel, vintageStocks = [] } = wine;
  
  // Get active vintages (with stock > 0)
  const activeVintages = useMemo(() => {
    if (!vintageStocks || vintageStocks.length === 0) return [];
    return vintageStocks.filter(v => v.stock > 0).sort((a, b) => a.vintage - b.vintage);
  }, [vintageStocks]);
  
  // Format vintage display text
  const vintageDisplay = useMemo(() => {
    if (activeVintages.length === 0) return "";
    if (activeVintages.length === 1) return `${activeVintages[0].vintage}`;
    
    // Show list for multiple vintages
    return activeVintages.map(v => `${v.vintage}`).join(", ");
  }, [activeVintages]);
  
  // Format second line display - Wine Type and Vintages in italics
  const secondLineDisplay = useMemo(() => {
    const parts = [];
    if (wineType) parts.push(wineType);
    if (vintageDisplay) parts.push(vintageDisplay);
    return parts.join(', ');
  }, [wineType, vintageDisplay]);
  
  if (viewMode === "list") {
    return (
      <Link href={`/wine/${id}`}>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors mb-2">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <h3 className="font-medium">{name}</h3>
                <span className="text-sm font-medium self-start">{stockLevel}</span>
              </div>
              {secondLineDisplay && (
                <div className="text-sm italic text-muted-foreground">
                  {secondLineDisplay}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
  
  // Grid view (default)
  return (
    <Link href={`/wine/${id}`}>
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors h-full flex flex-col">
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between mb-2">
            <h3 className="font-medium text-lg">{name}</h3>
            <span className="text-sm font-medium self-start">{stockLevel}</span>
          </div>
          {secondLineDisplay && (
            <div className="text-sm italic text-muted-foreground">
              {secondLineDisplay}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
