import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryColor } from "@/lib/wine-categories";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
}

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  categories
}: CategoryFilterProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Category</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ScrollArea className="h-[calc(100vh-300px)] px-2">
          <div className="space-y-1">
            {categories.map((category) => (
              <CategoryButton
                key={category}
                category={category}
                isSelected={selectedCategory === category}
                onClick={() => onSelectCategory(category)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface CategoryButtonProps {
  category: string;
  isSelected: boolean;
  onClick: () => void;
}

function CategoryButton({ category, isSelected, onClick }: CategoryButtonProps) {
  const categoryColor = category !== "All" ? getCategoryColor(category) : undefined;
  
  return (
    <Button
      variant={isSelected ? "default" : "ghost"}
      className="w-full justify-start h-auto py-2 px-3"
      onClick={onClick}
      style={isSelected && categoryColor ? { backgroundColor: categoryColor } : {}}
    >
      {category !== "All" && (
        <div
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: categoryColor }}
        />
      )}
      {category}
    </Button>
  );
}
