import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wine } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import Header from "@/components/ui/header";
import WineInventory from "@/components/WineInventory";
import SearchWine from "@/components/SearchWine";
import CategoryFilter from "@/components/CategoryFilter";
import { WineCategory, WineCategoryType } from "@shared/schema";
import { Search, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<WineCategoryType | "All">("All");
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [inventoryFilter, setInventoryFilter] = useState("");

  // Fetch the wine inventory
  const {
    data: wines,
    isLoading,
    isError,
    error,
  } = useQuery<Wine[]>({
    queryKey: ["/api/wines"],
  });

  // Filter wines based on selected category and filter text
  const filteredWines = wines?.filter(wine => {
    // Category filter
    const categoryMatch = selectedCategory === "All" || wine.category === selectedCategory;
    
    // Text filter for inventory - search by name, producer, wine type, sub-type, region, country and vintages
    const searchTerm = inventoryFilter.toLowerCase();
    const filterMatch = !searchTerm || 
      wine.name.toLowerCase().includes(searchTerm) ||
      (wine.producer && wine.producer.toLowerCase().includes(searchTerm)) ||
      (wine.wine && wine.wine.toLowerCase().includes(searchTerm)) ||
      (wine.subType && wine.subType.toLowerCase().includes(searchTerm)) ||
      (wine.region && wine.region.toLowerCase().includes(searchTerm)) ||
      (wine.country && wine.country.toLowerCase().includes(searchTerm)) ||
      // Search in vintages if they exist
      (Array.isArray(wine.vintageStocks) && wine.vintageStocks.some(vs => 
        vs.vintage.toString().includes(searchTerm)
      ));
    
    return categoryMatch && filterMatch;
  });

  const clearFilter = () => {
    setInventoryFilter("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-20">
      <Header title="Cellars.me" />
      
      <main className="flex-1 container px-4 py-6 mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-bold">My Wine Collection</h1>
            <Button asChild className="flex items-center gap-2">
              <Link href="/add-wine">
                <Plus className="h-4 w-4" />
                Add Wine
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-full">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    value={inventoryFilter}
                    onChange={(e) => setInventoryFilter(e.target.value)}
                    placeholder="Filter your collection..."
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {inventoryFilter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                      onClick={clearFilter}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <Tabs defaultValue="inventory" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="inventory">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">
                        {filteredWines ? `${filteredWines.length} wines` : 'Loading...'}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant={activeView === "grid" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setActiveView("grid")}
                        >
                          Grid
                        </Button>
                        <Button 
                          variant={activeView === "list" ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setActiveView("list")}
                        >
                          List
                        </Button>
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="h-[280px] rounded-md bg-muted animate-pulse"></div>
                        ))}
                      </div>
                    ) : isError ? (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Failed to load your wine collection: {error?.message || "Unknown error"}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <WineInventory 
                        wines={filteredWines || []} 
                        viewMode={activeView} 
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="insights">
                    <div className="p-6 border rounded-md">
                      <h3 className="text-xl font-medium mb-4">Collection Insights</h3>
                      {wines && wines.length > 0 ? (
                        <div className="space-y-4">
                          <p>Total bottles: {wines.reduce((sum, wine) => sum + (wine.stockLevel || 0), 0)}</p>
                          <p>Most common category: {
                            Object.entries(
                              wines.reduce<Record<string, number>>((acc, wine) => {
                                acc[wine.category] = (acc[wine.category] || 0) + 1;
                                return acc;
                              }, {})
                            ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'
                          }</p>
                        </div>
                      ) : (
                        <p>Add some wines to see insights about your collection.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Category filter has been removed as requested */}
          </div>
        </div>
      </main>
      
      {/* Global search for adding wines from catalog */}
      <SearchWine value="" onChange={() => {}} />
    </div>
  );
}
