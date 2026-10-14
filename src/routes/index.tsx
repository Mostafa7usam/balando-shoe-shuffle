import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "balando — Find your perfect shoes in Egypt" },
      {
        name: "description",
        content:
          "balando is your one stop shop for finding the perfect shoes in Egypt. Filter by size, color, price and search across top brands.",
      },
      { property: "og:title", content: "balando — Find your perfect shoes in Egypt" },
      {
        property: "og:description",
        content:
          "Filter shoes by size, color, price and search term. Your one stop shoe shop for Egypt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Outfit:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: Index,
});

type Product = {
  id: number;
  title: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

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
  const [search, setSearch] = useState("");
  const [size, setSize] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["scraper_products"],
    queryFn: async () => {
      type Row = {
        id: number;
        product_title: string;
        price: number | string;
        product_image_src: string | null;
        product_url: string | null;
        sizes: string[] | null;
        colors: string[] | null;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("scraper_products")
        .select("id, product_title, price, product_image_src, product_url, sizes, colors")
        .eq("footwear", true);
      if (error) throw error;
      return ((data ?? []) as Row[]).map((product): Product => ({
        id: product.id,
        title: product.product_title,
        price_egp: Number(product.price),
        image_url: product.product_image_src,
        product_url: product.product_url,
        sizes: product.sizes,
        colors: product.colors,
      }));
    },
  });

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors?.forEach((c) => set.add(c.toLowerCase())));
    return [...set].sort();
  }, [products]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    const filtered = products.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (size && !(p.sizes ?? []).includes(size)) return false;
      if (colors.length > 0) {
        const pc = (p.colors ?? []).map((c) => c.toLowerCase());
        if (!colors.some((c) => pc.includes(c))) return false;
      }
      if (min !== null && p.price_egp < min) return false;
      if (max !== null && p.price_egp > max) return false;
      return true;
    });
    return shuffle(filtered);
  }, [products, search, size, colors, minPrice, maxPrice]);

  const hasFilters =
    search.trim() !== "" || size !== null || colors.length > 0 || minPrice !== "" || maxPrice !== "";

  const clearAll = () => {
    setSearch("");
    setSize(null);
    setColors([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const toggleColor = (c: string) =>
    setColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              balando
            </h1>
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
                  onChange={(e) => setSearch(e.target.value)}
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
                  onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="Min"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
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
                    onClick={() => setSize(size === s ? null : s)}
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
                {results.length} {results.length === 1 ? "shoe" : "shoes"} found
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
              <p className="font-display text-xl font-bold text-foreground">
                Couldn’t load shoes
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check the Supabase connection and try again.
              </p>
            </div>
          ) : results.length === 0 ? (
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
              {results.map((p) => {
                const productUrl = getProductUrl(p.product_url);
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
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground">
          balando — find your perfect fit, Egypt 🇪🇬
        </div>
      </footer>
    </div>
  );
}
