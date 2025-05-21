import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useRoute } from "wouter";
import { wineFormSchema, InsertWine, VintageStock, WineCategory, WineCatalog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/header";
import WineFormFields from "@/components/WineFormFields";
import VintageManager from "@/components/VintageManager";
import { ArrowLeft } from "lucide-react";
import { getVintageApplicableCategories } from "@/lib/wine-categories";

export default function AddWine() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [isVintageApplicable, setIsVintageApplicable] = useState(false);
  const { toast } = useToast();
  
  // Get the wine data from localStorage (added by the search component)
  const getSelectedWineData = (): WineCatalog | null => {
    try {
      const savedWine = localStorage.getItem('selected_wine');
      if (savedWine) {
        const parsedWine = JSON.parse(savedWine);
        console.log("Retrieved wine data from localStorage:", parsedWine);
        // Clear localStorage after getting the data
        localStorage.removeItem('selected_wine');
        return parsedWine;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving wine data:", error);
      return null;
    }
  };
  
  const catalogWine = getSelectedWineData();
  
  // Setup form with default values or values from search selection
  const form = useForm<InsertWine>({
    resolver: zodResolver(wineFormSchema),
    defaultValues: {
      name: catalogWine?.name || "",
      category: catalogWine?.category as keyof typeof WineCategory || "Red",
      wine: catalogWine?.wine || "",      // Include Wine Type
      subType: catalogWine?.subType || "", // Include Sub-Type
      producer: catalogWine?.producer || "",
      region: catalogWine?.region || "",
      country: catalogWine?.country || "",
      stockLevel: 1, // Default to 1 bottle for better user experience
      description: "",
      vintageStocks: [],
    },
  });
  
  const watchCategory = form.watch("category");
  
  // Check if the wine category allows vintages
  useEffect(() => {
    const applicableCategories = getVintageApplicableCategories();
    setIsVintageApplicable(applicableCategories.includes(watchCategory as typeof WineCategory[keyof typeof WineCategory]));
  }, [watchCategory]);
  
  const onSubmit = async (data: InsertWine) => {
    try {
      // If vintage is applicable but stockLevel > 0 and no vintageStocks,
      // create a default vintage for the current year
      if (isVintageApplicable && data.stockLevel > 0 && (!data.vintageStocks || data.vintageStocks.length === 0)) {
        const currentYear = new Date().getFullYear();
        data.vintageStocks = [{
          vintage: currentYear,
          stock: data.stockLevel
        }];
      }
      
      await apiRequest("POST", "/api/wines", data);
      queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
      
      toast({
        title: "Wine Added",
        description: `${data.name} has been added to your collection.`,
      });
      
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to Add Wine",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };
  
  // Handle vintage stock changes
  const handleVintageStocksChange = (vintageStocks: VintageStock[]) => {
    // Validate vintage years
    const currentYear = new Date().getFullYear();
    const validVintages = vintageStocks.filter(v => v.vintage <= currentYear);
    
    if (validVintages.length !== vintageStocks.length) {
      toast({
        variant: "destructive",
        title: "Invalid Vintage Year",
        description: `Vintage year cannot be later than ${currentYear}`,
      });
    }
    
    form.setValue("vintageStocks", validVintages);
    
    // Update total stock level based on vintage stocks
    const totalStock = validVintages.reduce((total, item) => total + item.stock, 0);
    form.setValue("stockLevel", totalStock);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header title={catalogWine ? "Add Selected Wine" : "Add Wine"} />
      
      <main className="flex-1 container px-4 py-6 mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              {catalogWine ? `Add ${catalogWine.name}` : "Add New Wine"}
            </CardTitle>
            {catalogWine && (
              <p className="text-sm text-muted-foreground">
                Information populated from wine catalog
              </p>
            )}
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <WineFormFields form={form} />
                
                {isVintageApplicable && (
                  <VintageManager
                    vintageStocks={form.watch("vintageStocks") || []}
                    onChange={handleVintageStocksChange}
                  />
                )}
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button type="submit">Add to Collection</Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  );
}
