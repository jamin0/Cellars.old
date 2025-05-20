import { useMemo } from "react";
import { Wine, WineCategoryType } from "@shared/schema";
import WineCard from "@/components/WineCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wine as WineIcon } from "lucide-react";

interface WineInventoryProps {
  wines: Wine[];
  viewMode?: "grid" | "list";
}

export default function WineInventory({ wines, viewMode = "grid" }: WineInventoryProps) {
  // Group wines by category for better organization
  const winesByCategory = useMemo(() => {
    if (!wines || wines.length === 0) return {};
    
    return wines.reduce<Record<string, Wine[]>>((acc, wine) => {
      if (!acc[wine.category]) {
        acc[wine.category] = [];
      }
      acc[wine.category].push(wine);
      return acc;
    }, {});
  }, [wines]);
  
  // Sort categories in a specific order
  const sortedCategories = useMemo(() => {
    const categoryOrder: WineCategoryType[] = [
      "Red", "White", "Rose", "Fortified", "Beer", "Cider", "Other"
    ];
    
    return Object.keys(winesByCategory).sort(
      (a, b) => categoryOrder.indexOf(a as WineCategoryType) - categoryOrder.indexOf(b as WineCategoryType)
    );
  }, [winesByCategory]);
  
  if (wines.length === 0) {
    return (
      <Alert className="bg-muted/50">
        <WineIcon className="h-5 w-5" />
        <AlertDescription>
          No wines found in your collection. Add your first wine to get started!
        </AlertDescription>
      </Alert>
    );
  }
  
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        {sortedCategories.map(category => (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-2">{category}</h2>
            <div className="space-y-2">
              {winesByCategory[category].map(wine => (
                <WineCard key={wine.id} wine={wine} viewMode="list" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Grid view (default)
  return (
    <div className="space-y-8">
      {sortedCategories.map(category => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-3">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {winesByCategory[category].map(wine => (
              <WineCard key={wine.id} wine={wine} viewMode="grid" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
