import { Link, useLocation } from "wouter";
import { Database, LayoutDashboard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNavigation() {
  const [location] = useLocation();

  return (
    <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto max-w-7xl h-14 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md group-hover:bg-primary/90 transition-colors">
            <Database className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight text-foreground">Smart IP Advisor</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button
            variant={location === "/app" ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/app" className="font-medium flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Analyzer
            </Link>
          </Button>
          <Button
            variant={location === "/catalog" || location.startsWith("/catalog/") ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/catalog" className="font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Catalog
            </Link>
          </Button>
          <Button
            variant={location === "/about" ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/about" className="font-medium flex items-center gap-2">
              <Info className="w-4 h-4" />
              About
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
