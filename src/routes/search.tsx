import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    if (typeof search["q"] === "string" && search["q"].trim()) return { q: search["q"].trim() };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Search All Shoes in Egypt — waggado" },
      {
        name: "description",
        content:
          "Search and filter sneakers, sandals, boots, clogs and more from footwear stores across Egypt. Filter by size, color, price and brand on waggado.",
      },
      {
        property: "og:title",
        content: "Search All Shoes in Egypt — waggado",
      },
      {
        property: "og:description",
        content:
          "Filter shoes by size, color, price and search term. One place to find every footwear store in Egypt.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://balando.lovable.app/search" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://balando.lovable.app/search" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Outfit:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  staticData: { sitemap: true },
  component: Index,
});

type Product = {
  id: string;
  title: string;
  brand: string | null;
  price_egp: number;
  image_url: string | null;
  product_url: string | null;
  sizes: string[] | null;
  colors: string[] | null;
};

const COLOR_SWATCHES: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  red: "#d43a2f",
  blue: "#2f5fd4",
  grey: "#9a9a9a",
  green: "#3d7a4a",
  navy: "#24355e",
  orange: "#e8792b",
  pink: "#e8a0bf",
  silver: "#c8c8cc",
  brown: "#7a5230",
  beige: "#d9c9a8",
  yellow: "#e8c53a",
  purple: "#7a4a9e",
};

const SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];
const PAGE_SIZE = 30;

function formatEGP(n: number) {
  return `EGP ${n.toLocaleString("en-EG")}`;
}

function getProductUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.protocol === "http:") url.protocol = "https:";
    return url.href;
  } catch {
    return null;
  }
}

function ProductImage({ src, title }: { src: string | null; title: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setHasError(true)}
      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
    />
  );
}

function Index() {
  const initialQuery = Route.useSearch().q ?? "";
  const [search, setSearch] = useState(initialQuery);
  const [size, setSize] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const {
    data: productPage = { products: [], totalCount: 0 },
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "scraper_products",
      page,
      debouncedSearch.trim(),
      size,
      [...colors].sort(),
      minPrice,
      maxPrice,
    ],
    queryFn: async () => {
      type Row = {
        id: string;
        title: string;
        brand: string | null;
        price_egp: number | string;
        image_url: string | null;
        product_url: string | null;
        sizes: string[] | null;
        colors: string[] | null;
      };
      const searchTerm = debouncedSearch.trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("scraper_products")
        .select(
          "id, title, brand, price_egp, image_url, product_url, sizes, colors",
          { count: "exact" },
        );
      if (searchTerm) query = query.ilike("title", `%${searchTerm}%`);
      if (size) query = query.contains("sizes", [size]);
      if (colors.length > 0) query = query.overlaps("colors", colors);
      if (minPrice) query = query.gte("price_egp", Number(minPrice));
      if (maxPrice) query = query.lte("price_egp", Number(maxPrice));

      const { data, count, error } = await query
        .order("title", { ascending: true })
        .order("id", { ascending: true })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (error) throw error;
      return {
        products: ((data ?? []) as Row[]).map((product): Product => ({
          id: product.id,
          title: product.title,
          brand: product.brand,
          price_egp: Number(product.price_egp),
          image_url: product.image_url,
          product_url: product.product_url,
          sizes: product.sizes,
          colors: product.colors,
        })),
        totalCount: count ?? 0,
      };
    },
  });

  const products = productPage.products;
  const availableColors = Object.keys(COLOR_SWATCHES);

  const hasFilters =
    search.trim() !== "" ||
    size !== null ||
    colors.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "";
  const pageCount = Math.ceil(productPage.totalCount / PAGE_SIZE);
  const paginationItems: (number | "ellipsis")[] = [];
  const visiblePages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount)
    .sort((a, b) => a - b);
  visiblePages.forEach((pageNumber, index) => {
    if (index > 0 && pageNumber - visiblePages[index - 1]! > 1) {
      paginationItems.push("ellipsis");
    }
    paginationItems.push(pageNumber);
  });

  const clearAll = () => {
    setSearch("");
    setSize(null);
    setColors([]);
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  };

  const toggleColor = (c: string) => {
    setColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <Link
              to="/"
              className="font-display text-3xl font-extrabold tracking-tight text-foreground hover:text-primary"
            >
              waggado
            </Link>
            <p className="text-sm text-muted-foreground">
              Your one stop shop for the perfect shoes in Egypt
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Filters */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by product name…"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Price range */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Price (EGP)
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value.replace(/\D/g, ""));
                    setPage(1);
                  }}
                  placeholder="Min"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value.replace(/\D/g, ""));
                    setPage(1);
                  }}
                  placeholder="Max"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Size (EU)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(size === s ? null : s);
                      setPage(1);
                    }}
                    className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                      size === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Colors
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => {
                const active = colors.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleColor(c)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: COLOR_SWATCHES[c] ?? "#ccc" }}
                    />
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {hasFilters && (
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {productPage.totalCount} {productPage.totalCount === 1 ? "shoe" : "shoes"} found
              </p>
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            </div>
          )}
        </section>

        {/* Results */}
        <section className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-card">
                  <div className="aspect-square rounded-t-2xl bg-muted" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-card py-12 text-center">
              <p className="font-display text-xl font-bold text-foreground">Couldn’t load shoes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please refresh and try again.
              </p>
            </div>
          ) : productPage.totalCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
              <p className="font-display text-xl font-bold text-foreground">No shoes match</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your price range or removing a filter.
              </p>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => {
                const productUrl = getProductUrl(p.product_url);
                const displayName = p.display_name?.trim() || null;
                const profilePicUrl = p.profile_pic_url?.trim() || null;
                return (
                  <a
                    key={p.id}
                    href={productUrl ?? undefined}
                    aria-label={`View ${p.title}${productUrl ? " product page" : ""}`}
                    className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
                      productUrl ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      <ProductImage src={p.image_url} title={p.title} />
                    </div>
                    <div className="p-4">
                      <h3 className="mt-0.5 line-clamp-1 font-display font-bold text-foreground">
                        {p.title}
                      </h3>
                      <p className="mt-1 font-semibold text-primary">{formatEGP(p.price_egp)}</p>
                      {(p.colors ?? []).length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {(p.colors ?? []).map((c) => (
                            <span
                              key={c}
                              title={c}
                              className="h-3 w-3 rounded-full border border-border"
                              style={{ backgroundColor: COLOR_SWATCHES[c.toLowerCase()] ?? "#ccc" }}
                            />
                          ))}
                        </div>
                      )}
                      {(p.sizes ?? []).length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Sizes: {(p.sizes ?? []).join(", ")}
                        </p>
                      )}
                      {productUrl && (
                        <p className="mt-3 text-sm font-semibold text-primary">View product →</p>
                      )}
                      {(displayName || profilePicUrl) && (
                        <div className="mt-3 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={profilePicUrl ?? undefined}
                              alt={displayName ?? "Business"}
                            />
                            <AvatarFallback className="text-xs">
                              {displayName?.slice(0, 1).toUpperCase() || "B"}
                            </AvatarFallback>
                          </Avatar>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {displayName ?? "Business"}
                          </p>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
          {!isLoading && !error && pageCount > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, productPage.totalCount)} of {productPage.totalCount}{" "}
                shoes
              </p>
              <Pagination className="max-w-full">
                <PaginationContent className="flex-wrap justify-center gap-0.5 sm:gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      aria-disabled={page === 1}
                      className={`h-9 w-9 px-0 sm:h-10 sm:w-auto sm:px-2.5 [&>span]:hidden sm:[&>span]:inline ${
                        page === 1 ? "pointer-events-none opacity-50" : ""
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.max(1, current - 1));
                      }}
                    />
                  </PaginationItem>
                  {paginationItems.map((item, index) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis className="h-9 w-7 sm:w-9" />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          aria-label={`Go to page ${item}`}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      aria-disabled={page === pageCount}
                      className={`h-9 w-9 px-0 sm:h-10 sm:w-auto sm:px-2.5 [&>span]:hidden sm:[&>span]:inline ${
                        page === pageCount ? "pointer-events-none opacity-50" : ""
                      }`}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((current) => Math.min(pageCount, current + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground">
          waggado — find your perfect fit, Egypt 🇪🇬
        </div>
      </footer>
    </div>
  );
}
