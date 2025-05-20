import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { WineCatalog } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, X } from "lucide-react";

interface SearchWineProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchWine({ value, onChange }: SearchWineProps) {
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
  
  const handleSearchChange = (newValue: string) => {
    setSearchTerm(newValue);
  };
  
  const handleSelectWine = (wineName: string) => {
    onChange(wineName);
    setOpen(false);
  };
  
  const clearSearch = () => {
    onChange("");
  };
  
  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search your collection..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {value && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline">Catalog</Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[300px]">
            <Command>
              <CommandInput 
                placeholder="Search wine catalog..." 
                onValueChange={handleSearchChange}
                ref={inputRef}
              />
              <CommandList>
                {searchTerm.length <= 2 ? (
                  <CommandEmpty>Type at least 3 characters to search</CommandEmpty>
                ) : isLoading ? (
                  <CommandEmpty>Searching...</CommandEmpty>
                ) : searchResults?.length === 0 ? (
                  <CommandEmpty>No results found</CommandEmpty>
                ) : (
                  <CommandGroup heading="Results">
                    {searchResults?.slice(0, 10).map((wine) => (
                      <CommandItem 
                        key={wine.id}
                        onSelect={() => handleSelectWine(wine.name)}
                      >
                        <div className="flex flex-col">
                          <span>{wine.name}</span>
                          {wine.producer && (
                            <span className="text-xs text-muted-foreground">{wine.producer}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
