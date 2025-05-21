import { useMemo, useState } from "react";
import { Wine, WineCategoryType } from "@shared/schema";
import WineCard from "@/components/WineCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wine as WineIcon, ChevronDown, ChevronRight } from "lucide-react";
import { getCategoryColor } from "@/lib/wine-categories";

interface WineInventoryProps {
  wines: Wine[];
  viewMode?: "grid" | "list";
}

export default function WineInventory({ wines, viewMode = "grid" }: WineInventoryProps) {
  // State for collapsible categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  
  // Toggle category collapse state
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
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
  
  // Calculate total bottles per category
  const bottlesPerCategory = useMemo(() => {
    const result: Record<string, number> = {};
    
    Object.entries(winesByCategory).forEach(([category, categoryWines]) => {
      result[category] = categoryWines.reduce((total, wine) => {
        // Use vintageStocks if available, otherwise use stockLevel
        if (wine.vintageStocks && wine.vintageStocks.length > 0) {
          return total + wine.vintageStocks.reduce((sum, vintage) => sum + vintage.stock, 0);
        }
        return total + (wine.stockLevel || 0);
      }, 0);
    });
    
    return result;
  }, [winesByCategory]);
  
  // Sort categories in a specific order
  const sortedCategories = useMemo(() => {
    const categoryOrder: WineCategoryType[] = [
      "Red", "White", "Rose", "Fortified", "Beer", "Cider", "Whiskies", "Other"
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
      {sortedCategories.map(category => {
        const isCollapsed = collapsedCategories[category];
        const totalBottles = bottlesPerCategory[category];
        const categoryColor = getCategoryColor(category);
        
        return (
          <div key={category} className="border border-border rounded-lg overflow-hidden">
            {/* Category Header with Banner */}
            <div 
              className="relative cursor-pointer"
              onClick={() => toggleCategory(category)}
              style={{ backgroundColor: categoryColor }}
            >
              <div className="bg-gradient-to-r from-black/40 to-transparent p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCollapsed ? 
                      <ChevronRight className="h-5 w-5" /> : 
                      <ChevronDown className="h-5 w-5" />
                    }
                    <h2 className="text-xl font-semibold">{category}</h2>
                  </div>
                  <div className="px-3 py-1 bg-black/30 rounded-full text-sm">
                    {totalBottles} bottle{totalBottles !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Collapsible Content */}
            {!isCollapsed && (
              <div className="p-4 bg-card">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {winesByCategory[category].map(wine => (
                    <WineCard key={wine.id} wine={wine} viewMode="grid" />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
