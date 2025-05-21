import ThemeToggle from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wine, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Wine Cellar" }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Wine className="h-6 w-6 text-primary" />
            <span className="font-medium">{title}</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.profileImageUrl && (
                <Avatar>
                  <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                  <AvatarFallback>{user.firstName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              )}
              <span className="hidden md:inline text-sm font-medium">
                {user?.firstName || 'User'}
              </span>
              <a href="/api/logout" title="Log out">
                <Button variant="ghost" size="icon">
                  <LogOut className="h-5 w-5" />
                </Button>
              </a>
            </div>
          ) : (
            <a href="/api/login" title="Log in">
              <Button variant="ghost" size="icon">
                <LogIn className="h-5 w-5" />
              </Button>
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
