import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { VintageStock, Wine } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import StockLevelControl from "@/components/StockLevelControl";
import VintageManager from "@/components/VintageManager";
import { getCategoryColor } from "@/lib/wine-categories";

export default function WineDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute<{ id: string }>("/wine/:id");
  const { toast } = useToast();
  const id = params?.id ? parseInt(params.id) : null;
  
  const [vintageStocks, setVintageStocks] = useState<VintageStock[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const isVintageApplicable = (category?: string) => {
    return category === "Red" || category === "White" || category === "Rose";
  };
  
  const { data: wine, isLoading, isError } = useQuery<Wine>({
    queryKey: ["/api/wines", id],
    enabled: !!id,
  });
  
  useEffect(() => {
    if (wine) {
      setVintageStocks(wine.vintageStocks || []);
      setTotalStock(wine.stockLevel || 0);
    }
  }, [wine]);
  
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Wine>) => 
      apiRequest("PATCH", `/api/wines/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wines", id] });
      toast({
        title: "Wine Updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/wines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wines"] });
      toast({
        title: "Wine Removed",
        description: "The wine has been removed from your collection.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    },
  });
  
  const handleStockChange = (newStock: number) => {
    setTotalStock(newStock);
    
    if (!isVintageApplicable(wine?.category)) {
      updateMutation.mutate({ stockLevel: newStock });
    }
  };
  
  const handleVintageStocksChange = (newVintageStocks: VintageStock[]) => {
    setVintageStocks(newVintageStocks);
    const newTotalStock = newVintageStocks.reduce((sum, v) => sum + v.stock, 0);
    setTotalStock(newTotalStock);
    
    updateMutation.mutate({ 
      vintageStocks: newVintageStocks, 
      stockLevel: newTotalStock 
    });
  };
  
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header title="Wine Details" />
        <main className="flex-1 container px-4 py-6 mx-auto">
          <div className="max-w-2xl mx-auto bg-muted h-96 rounded-lg animate-pulse"></div>
        </main>
      </div>
    );
  }
  
  if (isError || !wine) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header title="Error" />
        <main className="flex-1 container px-4 py-6 mx-auto">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-destructive mb-2">Wine Not Found</h2>
              <p>This wine may have been removed from your collection.</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Return to Collection
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header title={wine.name} />
      
      <main className="flex-1 container px-4 py-6 mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collection
          </Button>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <Badge 
                className="mb-2"
                style={{ backgroundColor: getCategoryColor(wine.category) }}
              >
                {wine.category}
              </Badge>
              <CardTitle className="text-2xl">{wine.name}</CardTitle>
              {wine.producer && (
                <p className="text-muted-foreground">{wine.producer}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => navigate(`/edit/${wine.id}`)}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove from Collection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove {wine.name} from your collection? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2">
                  {wine.region && (
                    <div>
                      <span className="text-sm font-medium">Region:</span>{" "}
                      <span>{wine.region}</span>
                    </div>
                  )}
                  {wine.country && (
                    <div>
                      <span className="text-sm font-medium">Country:</span>{" "}
                      <span>{wine.country}</span>
                    </div>
                  )}
                </div>
                
                {wine.description && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-sm">{wine.description}</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-3">Inventory</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Stock:</span>
                        <span className="text-xl font-bold">{totalStock}</span>
                      </div>
                      <StockLevelControl 
                        value={totalStock}
                        onChange={handleStockChange}
                        disabled={isVintageApplicable(wine.category)}
                      />
                    </div>
                    
                    {isVintageApplicable(wine.category) && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Vintages</h4>
                        <VintageManager
                          vintageStocks={vintageStocks}
                          onChange={handleVintageStocksChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <span className="text-sm text-muted-foreground">
              Added {new Date(wine.createdAt).toLocaleDateString()}
            </span>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
