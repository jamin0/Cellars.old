import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { wineFormSchema, InsertWine, VintageStock, WineCategory } from "@shared/schema";
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

export default function AddWine() {
  const [, navigate] = useLocation();
  const [isVintageApplicable, setIsVintageApplicable] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<InsertWine>({
    resolver: zodResolver(wineFormSchema),
    defaultValues: {
      name: "",
      category: WineCategory.RED,
      producer: "",
      region: "",
      country: "",
      stockLevel: 0,
      description: "",
      vintageStocks: [],
    },
  });
  
  const watchCategory = form.watch("category");
  
  // Check if the wine category allows vintages
  useState(() => {
    const applicableCategories = [WineCategory.RED, WineCategory.WHITE, WineCategory.ROSE];
    setIsVintageApplicable(applicableCategories.includes(watchCategory));
  });
  
  const onSubmit = async (data: InsertWine) => {
    try {
      // If vintage is applicable but stockLevel > 0 and no vintageStocks,
      // create a default vintage for the current year
      if (isVintageApplicable && data.stockLevel > 0 && (!data.vintageStocks || data.vintageStocks.length === 0)) {
        data.vintageStocks = [{
          vintage: new Date().getFullYear(),
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
    form.setValue("vintageStocks", vintageStocks);
    
    // Update total stock level based on vintage stocks
    const totalStock = vintageStocks.reduce((total, item) => total + item.stock, 0);
    form.setValue("stockLevel", totalStock);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header title="Add Wine" />
      
      <main className="flex-1 container px-4 py-6 mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Add New Wine</CardTitle>
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
