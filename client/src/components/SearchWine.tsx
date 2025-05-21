import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { WineCatalog } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X, Plus } from "lucide-react";

interface SearchWineProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchWine({ value, onChange }: SearchWineProps) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: searchResults, isLoading } = useQuery<WineCatalog[]>({
    queryKey: ["/api/catalog/search", searchTerm],
    enabled: searchTerm.length > 2,
  });
  
  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);
  
  // Handle search input change for autocomplete
  const handleSearchChange = (newValue: string) => {
    setSearchTerm(newValue);
    setOpen(true); // Ensure the dropdown is open when typing
  };
  
  // Handle selection of a wine from catalog
  const handleSelectWine = (wine: WineCatalog) => {
    // Navigate to add wine page with selected wine data
    navigate(`/add?wine=${encodeURIComponent(JSON.stringify(wine))}`);
    setOpen(false);
  };
  
  const clearSearch = () => {
    onChange("");
    setSearchTerm("");
  };
  
  return (
    <div className="fixed bottom-4 left-0 right-0 z-10 mx-auto max-w-xl">
      <div className="mx-4 bg-background rounded-lg shadow-lg border p-2">
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleSearchChange(e.target.value);
            }}
            placeholder="Search wine catalog to add..."
            className="pl-10 pr-10"
            onFocus={() => setOpen(true)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverContent 
              className="p-0 w-[calc(100vw-2rem)] max-w-xl" 
              align="center"
              side="top"
              sideOffset={10}
            >
              <Command>
                <CommandList>
                  {searchTerm.length <= 2 ? (
                    <CommandEmpty>Type at least 3 characters to search</CommandEmpty>
                  ) : isLoading ? (
                    <CommandEmpty>Searching...</CommandEmpty>
                  ) : searchResults?.length === 0 ? (
                    <CommandEmpty>
                      <div className="p-4 text-center">
                        <p>No wines found. Add a custom wine instead?</p>
                        <Button 
                          className="mt-2" 
                          onClick={() => navigate("/add")}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Custom Wine
                        </Button>
                      </div>
                    </CommandEmpty>
                  ) : (
                    <CommandGroup heading="Results">
                      {searchResults?.slice(0, 10).map((wine) => (
                        <CommandItem 
                          key={wine.id}
                          onSelect={() => handleSelectWine(wine)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{wine.name}</span>
                            <div className="flex text-xs text-muted-foreground gap-1">
                              {wine.producer && <span>{wine.producer}</span>}
                              {wine.producer && wine.region && <span>·</span>}
                              {wine.region && <span>{wine.region}</span>}
                              {(wine.producer || wine.region) && wine.country && <span>·</span>}
                              {wine.country && <span>{wine.country}</span>}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={() => navigate("/add")}
                        className="border-t py-2 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add a custom wine instead</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
