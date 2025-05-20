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
  const { id, name, category, producer, stockLevel, vintageStocks = [] } = wine;
  
  const displayVintage = useMemo(() => {
    if (!vintageStocks || vintageStocks.length === 0) return null;
    if (vintageStocks.length === 1) return vintageStocks[0].vintage;
    
    // Show range if multiple vintages
    const years = vintageStocks.map(v => v.vintage).sort();
    return `${years[0]}-${years[years.length - 1]}`;
  }, [vintageStocks]);
  
  if (viewMode === "list") {
    return (
      <Link href={`/wine/${id}`}>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors mb-2">
          <CardContent className="p-4 flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge
                  className="px-1 py-0 text-xs"
                  style={{ backgroundColor: getCategoryColor(category) }}
                >
                  {category}
                </Badge>
                {displayVintage && (
                  <span className="text-xs font-medium">{displayVintage}</span>
                )}
              </div>
              <h3 className="font-medium">{name}</h3>
              {producer && <p className="text-sm text-muted-foreground">{producer}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{stockLevel} bottle{stockLevel !== 1 ? 's' : ''}</span>
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
          <div className="flex items-center justify-between mb-2">
            <Badge
              style={{ backgroundColor: getCategoryColor(category) }}
            >
              {category}
            </Badge>
            {displayVintage && (
              <span className="text-sm font-medium">{displayVintage}</span>
            )}
          </div>
          <h3 className="font-medium text-lg">{name}</h3>
          {producer && <p className="text-sm text-muted-foreground">{producer}</p>}
        </CardContent>
        <CardFooter className="p-4 pt-0 bg-muted/30">
          <span className="text-sm">{stockLevel} bottle{stockLevel !== 1 ? 's' : ''}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
