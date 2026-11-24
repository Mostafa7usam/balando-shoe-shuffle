import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ADULT_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];
const MAX_PER_SELLER = 2;
const FEATURED_PRODUCT_COUNT = 24;

const MODELS = [
  { name: "Samba", count: 917 },
  { name: "Campus", count: 331 },
  { name: "Handball Spezial", count: 297 },
  { name: "Gazelle", count: 264 },
  { name: "Yeezy", count: 108 },
  { name: "Adizero", count: 97 },
  { name: "Forum", count: 58 },
  { name: "Slides", count: 49 },
  { name: "Superstar", count: 40 },
];

type Product = {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string | null;
  sizes: string[] | null;
  displayName: string | null;
  profilePicUrl: string | null;
};

type ProductRow = {
  id: number;
  product_title: string;
  price: number | string;
  product_image_src: string;
  product_url: string | null;
  sizes: string[] | null;
  display_name: string | null;
  profile_pic_url: string | null;
};

type AdidasStats = {
  totalListings: number;
  sellerCount: number;
};

async function loadAdidasStats(): Promise<AdidasStats> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from("scraper_products")
    .select("id", { count: "exact", head: true })
    .eq("footwear", true)
    .ilike("product_title", "%adidas%");

  if (error) {
    throw new Error(`Could not load Adidas listing totals: ${error.message}`);
  }

  const totalListings = count ?? 0;
  const sellers = new Set<string>();
  const pageSize = 1000;

  for (let start = 0; start < totalListings; start += pageSize) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: sellerError } = await (supabase as any)
      .from("scraper_products")
      .select("display_name")
      .eq("footwear", true)
      .ilike("product_title", "%adidas%")
      .order("id", { ascending: true })
      .range(start, Math.min(start + pageSize - 1, totalListings - 1));

    if (sellerError) {
      throw new Error(`Could not load Adidas sellers: ${sellerError.message}`);
    }

    for (const { display_name: displayName } of (data as
      { display_name: string | null }[] | null) ?? []) {
      if (displayName?.trim()) sellers.add(displayName.trim().toLowerCase());
    }
  }

  return { totalListings, sellerCount: sellers.size };
}

async function loadFeaturedProducts(): Promise<Product[]> {
  const results = await Promise.all(
    MODELS.map(async ({ name }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("scraper_products")
        .select(
          "id, product_title, price, product_image_src, product_url, sizes, display_name, profile_pic_url",
        )
        .eq("footwear", true)
        .ilike("product_title", "%adidas%")
        .ilike("product_title", `%${name}%`)
        .not("product_title", "ilike", "%replica%")
        .not("product_image_src", "is", null)
        .neq("product_image_src", "")
        .overlaps("sizes", ADULT_SIZES)
        .order("product_title", { ascending: true })
        .order("id", { ascending: true })
        .limit(100);

      if (error) {
        throw new Error(`Could not load Adidas ${name} products: ${error.message}`);
      }

      return (data as ProductRow[] | null) ?? [];
    }),
  );

  const featured: Product[] = [];
  const seenIds = new Set<number>();
  const sellerCounts = new Map<string, number>();
  const maxCandidates = Math.max(...results.map((products) => products.length));

  for (let candidateIndex = 0; candidateIndex < maxCandidates; candidateIndex += 1) {
    for (const products of results) {
      const product = products[candidateIndex];
      if (!product || seenIds.has(product.id)) continue;

      const sellerKey = product.display_name?.trim().toLowerCase() || "unknown";
      if ((sellerCounts.get(sellerKey) ?? 0) >= MAX_PER_SELLER) continue;

      seenIds.add(product.id);
      sellerCounts.set(sellerKey, (sellerCounts.get(sellerKey) ?? 0) + 1);
      featured.push({
        id: product.id,
        title: product.product_title,
        price: Number(product.price),
        imageUrl: product.product_image_src,
        productUrl: product.product_url,
        sizes: product.sizes,
        displayName: product.display_name,
        profilePicUrl: product.profile_pic_url,
      });

      if (featured.length === FEATURED_PRODUCT_COUNT) return featured;
    }
  }

  return featured;
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

function formatEGP(n: number) {
  return `EGP ${n.toLocaleString("en-EG")}`;
}

function ProductImage({ src, title }: { src: string; title: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
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

export const Route = createFileRoute("/adidas")({
  loader: async () => {
    const [products, stats] = await Promise.all([loadFeaturedProducts(), loadAdidasStats()]);
    return { products, stats };
  },
  head: () => ({
    meta: [
      { title: "Adidas Shoes in Egypt — Compare 2,480+ Listings | waggado" },
      {
        name: "description",
        content:
          "Browse Adidas shoes from 14 sellers in Egypt. Shop Samba, Campus, Gazelle, Handball Spezial, Yeezy and more.",
      },
      { property: "og:title", content: "Adidas Shoes in Egypt — waggado" },
      {
        property: "og:description",
        content:
          "Compare Adidas shoes from 14 sellers in Egypt, including Samba, Campus and Gazelle.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://waggado.app/adidas" }],
  }),
  staticData: { sitemap: true },
  component: AdidasPage,
});

function AdidasPage() {
  const { products, stats } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        rightContent={
          <p className="text-sm font-semibold text-muted-foreground">
            {stats.totalListings.toLocaleString("en-US")} Adidas shoes{" "}
            <span className="text-foreground">from {stats.sellerCount} sellers</span>
          </p>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Adidas shoes in Egypt
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Find your next Adidas pair
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Compare popular Adidas models from stores across Egypt. Every featured pair has a
            product image and adult sizes in stock.
          </p>
        </section>

        <nav aria-label="Shop Adidas by model" className="mt-7">
          <h2 className="mb-3 font-display text-xl font-bold text-foreground">Shop by model</h2>
          <div className="flex flex-wrap gap-2">
            {MODELS.map(({ name, count }) => (
              <Link
                key={name}
                to="/search"
                search={{ q: name }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {name} <span className="text-muted-foreground">(~{count})</span>
              </Link>
            ))}
          </div>
        </nav>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
                Featured Adidas shoes
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A mix of popular models, with no more than two pairs from any seller.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {products.length} of {stats.totalListings.toLocaleString("en-US")} listings
            </p>
          </div>

          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
              Adidas shoes are temporarily unavailable. Please try again later.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const productUrl = getProductUrl(product.productUrl);
                const displayName = product.displayName?.trim() || null;

                return (
                  <a
                    key={product.id}
                    href={productUrl ?? undefined}
                    aria-label={`View ${product.title}${productUrl ? " product page" : ""}`}
                    className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
                      productUrl ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <div className="aspect-square overflow-hidden bg-muted">
                      <ProductImage src={product.imageUrl} title={product.title} />
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-12 font-display font-bold text-foreground">
                        {product.title}
                      </h3>
                      <p className="mt-1 font-semibold text-primary">{formatEGP(product.price)}</p>
                      {(product.sizes ?? []).length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Sizes: {product.sizes?.join(", ")}
                        </p>
                      )}
                      {(displayName || product.profilePicUrl) && (
                        <div className="mt-3 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={product.profilePicUrl ?? undefined}
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

        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Looking for a specific size, color, or price? Filter all Adidas listings.
          </p>
          <Link
            to="/search"
            search={{ q: "adidas" }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse and filter all shoes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="mt-12 border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
          <p>waggado — find your perfect fit, Egypt 🇪🇬</p>
          <Link to="/search" className="font-semibold text-primary hover:underline">
            Search all shoes →
          </Link>
        </div>
      </footer>
    </div>
  );
}
