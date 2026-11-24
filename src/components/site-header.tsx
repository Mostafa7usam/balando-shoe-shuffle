import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { CategoryMenu } from "@/components/category-menu";

type SiteHeaderProps = {
  rightContent?: ReactNode;
};

export function SiteHeader({ rightContent }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-x-3 gap-y-3 px-4 py-3 sm:grid-cols-3 sm:gap-4 sm:py-4">
        <nav
          aria-label="Main navigation"
          className="col-span-2 row-start-2 flex items-center gap-2 sm:col-span-1 sm:col-start-1 sm:row-start-1"
        >
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Search className="h-4 w-4 shrink-0" />
            Browse all shoes
          </Link>
          <CategoryMenu />
        </nav>

        <Link
          to="/"
          className="col-span-2 row-start-1 justify-self-center font-display text-2xl font-extrabold tracking-tight text-foreground sm:col-span-1 sm:col-start-2 sm:row-start-1"
        >
          waggado
        </Link>

        {rightContent && (
          <div className="hidden justify-self-end text-right sm:col-start-3 sm:row-start-1 sm:block">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
