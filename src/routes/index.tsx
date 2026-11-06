import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, BadgeCheck, Search, SlidersHorizontal, Store, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TrendingProduct = {
  id: number;
  title: string;
  price_egp: number;
  image_url: string | null;
  product_url: string | null;
  display_name: string | null;
  profile_pic_url: string | null;
  trending_query: string;
};

const TRENDING_SEARCHES = [
  { label: "Adidas", query: "adidas", interest: 63 },
  { label: "Nike", query: "nike", interest: 25 },
  { label: "Puma", query: "puma", interest: 13 },
  { label: "Skechers", query: "skechers", interest: 11 },
  { label: "Sneakers", query: "sneakers", interest: 10 },
  { label: "Slippers", query: "slippers", interest: 10 },
  { label: "Crocs", query: "crocs", interest: 8 },
  { label: "ASICS", query: "asics", interest: 7 },
  { label: "Running shoes", query: "running shoes", interest: 6 },
  { label: "Clogs", query: "clogs", interest: 5 },
  { label: "Sandals", query: "sandals", interest: 5 },
  { label: "Puma Speedcat", query: "puma speedcat", interest: 1 },
  { label: "Nike Mind", query: "nike mind", interest: 1 },
  { label: "ASICS Gel", query: "asics gel", interest: 1 },
];

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

function TrendingProductImage({ src, title }: { src: string | null; title: string }) {
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "waggado — Egypt's Ultimate Footwear Finder" },
      {
        name: "description",
        content:
          "Find sneakers, sandals, boots, clogs and more from footwear stores across Egypt. Compare shoes by size, color and price.",
      },
      { property: "og:title", content: "waggado — Egypt's Ultimate Footwear Finder" },
      {
        property: "og:description",
        content: "Find footwear from stores across Egypt — filtered by size, color and price.",
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
  staticData: { sitemap: true },
  component: Landing,
});

function Landing() {
  const {
    data: trendingProducts = [],
    isLoading: isTrendingLoading,
    error: trendingError,
  } = useQuery({
    queryKey: ["homepage-trending-products"],
    queryFn: async () => {
      type Row = {
        id: number;
        product_title: string;
        price: number | string;
        product_image_src: string | null;
        product_url: string | null;
        display_name: string | null;
        profile_pic_url: string | null;
      };

      const results = await Promise.all(
        TRENDING_SEARCHES.map(async (trend) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any)
            .from("scraper_products")
            .select(
              "id, product_title, price, product_image_src, product_url, display_name, profile_pic_url",
            )
            .eq("footwear", true)
            .ilike("product_title", `%${trend.query}%`)
            .order("product_title", { ascending: true })
            .order("id", { ascending: true })
            .limit(10);

          if (error) {
            throw new Error(`Could not load products matching "${trend.query}": ${error.message}`);
          }

          const candidates = (data as Row[] | null) ?? [];
          const product =
            candidates.find(
              (candidate) => candidate.product_title.trim().toLowerCase() !== trend.query,
            ) ?? candidates[0];
          return product
            ? {
                id: product.id,
                title: product.product_title,
                price_egp: Number(product.price),
                image_url: product.product_image_src,
                product_url: product.product_url,
                display_name: product.display_name,
                profile_pic_url: product.profile_pic_url,
                trending_query: trend.label,
              }
            : null;
        }),
      );

      const uniqueProducts = new Map<number, TrendingProduct>();
      for (const product of results) {
        if (product && !uniqueProducts.has(product.id)) uniqueProducts.set(product.id, product);
      }
      return [...uniqueProducts.values()];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="block">
            <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              waggado
            </span>
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-5"
          >
            <Search className="h-4 w-4" />
            Browse all shoes
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:pb-10 sm:pt-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Stop scrolling ads.
                <span className="block text-primary">Start finding shoes.</span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                The name waggado is inspired by the Arabic word <em>وَجَد</em>, meaning “to find.”
                We bring shoes from stores across Egypt together, filtered by{" "}
                <strong className="text-foreground">size</strong>,{" "}
                <strong className="text-foreground">color</strong> and{" "}
                <strong className="text-foreground">price</strong>. Best fit. Best price. Best
                provider.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-display font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
                >
                  Find your perfect pair
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <img
              src="/hero-footwear.jpg"
              alt="Colorful sneakers displayed on a shoe wall"
              width={2000}
              height={1372}
              className="mt-6 aspect-[2/1] w-full rounded-3xl object-cover"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Shopping ads found you. Now you find them.
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                waggado flips the search around: you choose what you want and where to find it.
              </p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Tag,
                  title: "Best price",
                  text: "Compare the same style across stores and see prices in EGP before you buy.",
                },
                {
                  icon: SlidersHorizontal,
                  title: "Best fit",
                  text: "Filter by your exact EU size, color and budget in seconds.",
                },
                {
                  icon: Store,
                  title: "Best provider",
                  text: "Discover footwear businesses across Egypt, all in one place.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border bg-background p-5 shadow-sm"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                  Trending shoes in Egypt
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Popular styles from Egypt’s top and rising searches.
                </p>
              </div>
            </div>
            {isTrendingLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <div className="aspect-square bg-muted" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trendingError ? (
              <p className="rounded-2xl border border-destructive/30 bg-card px-5 py-8 text-center text-sm text-muted-foreground">
                Trending shoes couldn’t be loaded right now.
              </p>
            ) : trendingProducts.length > 0 ? (
              <Carousel
                opts={{ align: "start", loop: trendingProducts.length > 4 }}
                className="px-1 pb-1"
              >
                <CarouselContent className="-ml-3">
                  {trendingProducts.map((product) => {
                    const productUrl = getProductUrl(product.product_url);
                    const displayName = product.display_name?.trim() || null;
                    const profilePicUrl = product.profile_pic_url?.trim() || null;
                    return (
                      <CarouselItem
                        key={product.id}
                        className="basis-[82%] pl-3 sm:basis-1/2 lg:basis-1/4"
                      >
                        <a
                          href={productUrl ?? undefined}
                          aria-label={`View ${product.title}${productUrl ? " product page" : ""}`}
                          className={`group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${
                            productUrl ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <div className="aspect-square overflow-hidden bg-muted">
                            <TrendingProductImage src={product.image_url} title={product.title} />
                          </div>
                          <div className="p-4">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Trending: {product.trending_query}
                            </p>
                            <h3 className="line-clamp-2 min-h-12 font-display font-bold text-foreground">
                              {product.title}
                            </h3>
                            <p className="mt-1 font-semibold text-primary">
                              {formatEGP(product.price_egp)}
                            </p>
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
                            {productUrl && (
                              <p className="mt-3 text-sm font-semibold text-primary">
                                View product →
                              </p>
                            )}
                          </div>
                        </a>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-auto right-12 top-[-3.25rem] translate-y-0" />
                <CarouselNext className="right-0 top-[-3.25rem] translate-y-0" />
              </Carousel>
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                No products match the current trending searches.
              </p>
            )}
          </div>
          <div className="overflow-hidden rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground shadow-xl shadow-primary/20 sm:py-12">
            <BadgeCheck className="mx-auto h-10 w-10 opacity-80" />
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your perfect pair is already in Egypt. Go find it.
            </h2>
            <Link
              to="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 font-display font-bold text-primary transition-transform hover:scale-[1.03]"
            >
              Start searching
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>
            <span className="font-display font-extrabold text-foreground">waggado</span> — find your
            perfect fit, Egypt 🇪🇬
          </p>
          <Link to="/search" className="font-semibold text-primary hover:underline">
            Search all shoes →
          </Link>
        </div>
      </footer>
    </div>
  );
}
