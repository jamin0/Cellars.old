import ThemeToggle from "@/components/ui/theme-toggle";
import { Wine } from "lucide-react";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Wine Cellar" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Wine className="h-6 w-6 text-primary" />
          <span className="font-medium">{title}</span>
        </div>
        
        <ThemeToggle />
      </div>
    </header>
  );
}
