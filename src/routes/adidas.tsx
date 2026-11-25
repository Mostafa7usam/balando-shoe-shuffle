import { createServerFn } from "@tanstack/react-start";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FEATURED_PRODUCT_COUNT = 24;
const PAGE_SIZE = 1000;
const MAX_PAGES = 8;
const CACHE_DURATION_MS = 60 * 60 * 1000;
const ADULT_SIZE_MIN = 36;
const ADULT_SIZE_MAX = 48;
const ADIDAS_URL = "https://waggado.app/adidas";
const DISCLAIMER =
  "Listings come from independent online stores. waggado is a search tool: we don’t sell these products, we don’t verify that they are authentic, and prices and stock can change. We aren’t affiliated with Adidas.";

const MODELS = [
  { name: "Samba", term: "samba" },
  { name: "Campus", term: "campus" },
  { name: "Handball Spezial", term: "spezial" },
  { name: "Gazelle", term: "gazelle" },
  { name: "Yeezy", term: "yeezy" },
  { name: "Adizero", term: "adizero" },
  { name: "Forum", term: "forum" },
  { name: "Slides", term: "slide" },
  { name: "Superstar", term: "superstar" },
] as const;

type ProductRow = {
  id: string | number;
  product_title: string;
  price: number | string | null;
  product_image_src: string | null;
  product_url: string | null;
  sizes: string[] | null;
  display_name: string | null;
  profile_pic_url: string | null;
};

type StoreOffer = {
  storeName: string;
  productUrl: string | null;
  imageUrl: string;
  profilePicUrl: string | null;
  price: number;
};

type FeaturedProduct = {
  key: string;
  title: string;
  minPrice: number;
  maxPrice: number;
  stores: StoreOffer[];
  cheapestOffer: StoreOffer;
};

type ModelStats = {
  name: string;
  term: string;
  listings: number;
  medianPrice: number | null;
};

type AdidasData = {
  ok: true;
  totalListings: number;
  sellerCount: number;
  p10: number;
  p90: number;
  median: number;
  models: ModelStats[];
  products: FeaturedProduct[];
};

type AdidasLoadResult = AdidasData | { ok: false };

const adidasCache = new Map<string, { expiresAt: number; data: AdidasData }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBaseFilters(q: any) {
  return q
    .eq("footwear", true)
    .ilike("product_title", "%adidas%")
    .not("product_title", "ilike", "%replica%")
    .not("product_title", "ilike", "%kids%")
    .not("product_image_src", "is", null)
    .neq("product_image_src", "")
    .or("product_description.is.null,product_description.not.ilike.%replica%");
}

function parsePrice(value: number | string | null) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return parsed > 0 ? parsed : null;
}

function getStoreName(value: string | null) {
  if (!value) return null;

  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname.endsWith(".myshopify.com")) {
      return hostname.slice(0, -".myshopify.com".length);
    }
    return hostname || null;
  } catch {
    return null;
  }
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

function hasAdultSize(sizes: string[] | null) {
  return (sizes ?? []).some((size) => {
    const parsed = Number.parseFloat(size);
    return parsed >= ADULT_SIZE_MIN && parsed <= ADULT_SIZE_MAX;
  });
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const middleValue = sorted[middle];
  if (middleValue === undefined) return null;
  if (sorted.length % 2 !== 0) return middleValue;
  const lowerValue = sorted[middle - 1];
  return lowerValue === undefined ? null : (lowerValue + middleValue) / 2;
}

function percentile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * fraction;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const interpolation = position - lowerIndex;
  const lowerValue = sorted[lowerIndex] ?? 0;
  const upperValue = sorted[upperIndex] ?? lowerValue;
  return lowerValue + (upperValue - lowerValue) * interpolation;
}

function groupFeaturedProducts(rows: ProductRow[]): FeaturedProduct[] {
  const groups = new Map<
    string,
    { title: string; offers: StoreOffer[]; prices: number[]; hasAdultImageListing: boolean }
  >();

  for (const row of rows) {
    const title = row.product_title.trim().replace(/\s+/g, " ");
    const key = title.toLowerCase();
    if (!key) continue;

    const group = groups.get(key) ?? {
      title,
      offers: [],
      prices: [],
      hasAdultImageListing: false,
    };
    const price = parsePrice(row.price);
    const storeName = getStoreName(row.product_url);
    if (price !== null) group.prices.push(price);
    if (price !== null && storeName) {
      group.offers.push({
        storeName,
        productUrl: row.product_url,
        imageUrl: row.product_image_src ?? "",
        profilePicUrl: row.profile_pic_url,
        price,
      });
    }
    if (row.product_image_src && hasAdultSize(row.sizes)) {
      group.hasAdultImageListing = true;
    }
    groups.set(key, group);
  }

  const featuredGroups = Array.from(groups, ([key, group]) => {
    const uniqueOffers = new Map<string, StoreOffer>();
    for (const offer of group.offers) {
      const current = uniqueOffers.get(offer.storeName);
      if (!current || offer.price < current.price) uniqueOffers.set(offer.storeName, offer);
    }
    const stores = Array.from(uniqueOffers.values()).sort(
      (a, b) => a.price - b.price || a.storeName.localeCompare(b.storeName),
    );
    if (!group.hasAdultImageListing || stores.length === 0) return null;

    return {
      key,
      title: group.title,
      minPrice: Math.min(...group.prices),
      maxPrice: Math.max(...group.prices),
      stores,
      cheapestOffer: stores[0],
    };
  }).filter((group): group is FeaturedProduct => group !== null);

  const groupsByModel = MODELS.map((model) =>
    featuredGroups
      .filter((group) => group.title.toLowerCase().includes(model.term))
      .sort((a, b) => b.stores.length - a.stores.length || a.minPrice - b.minPrice),
  );
  const products: FeaturedProduct[] = [];
  const seenGroups = new Set<string>();

  for (
    let round = 0;
    products.length < FEATURED_PRODUCT_COUNT && round < featuredGroups.length;
    round += 1
  ) {
    for (const modelGroups of groupsByModel) {
      const group = modelGroups[round];
      if (!group || seenGroups.has(group.key)) continue;
      products.push(group);
      seenGroups.add(group.key);
      if (products.length === FEATURED_PRODUCT_COUNT) break;
    }
  }

  return products;
}

async function loadAdidasData(): Promise<AdidasLoadResult> {
  const cached = adidasCache.get("adidas");
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  try {
    const rows: ProductRow[] = [];

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const start = page * PAGE_SIZE;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await applyBaseFilters(
        (supabase as any)
          .from("scraper_products")
          .select(
            "id, product_title, price, product_image_src, product_url, sizes, display_name, profile_pic_url",
          ),
      )
        .order("id", { ascending: true })
        .range(start, start + PAGE_SIZE - 1);

      if (error) {
        console.error("Could not load Adidas listings:", error);
        return { ok: false };
      }

      const pageRows = (data as ProductRow[] | null) ?? [];
      rows.push(...pageRows);
      if (pageRows.length < PAGE_SIZE) break;
    }

    const prices = rows
      .map((row) => parsePrice(row.price))
      .filter((price): price is number => price !== null);
    const sellers = new Set(
      rows.map((row) => getStoreName(row.product_url)).filter((name): name is string => !!name),
    );
    const models: ModelStats[] = MODELS.map(({ name, term }) => {
      const modelRows = rows.filter((row) => row.product_title.toLowerCase().includes(term));
      const modelPrices = modelRows
        .map((row) => parsePrice(row.price))
        .filter((price): price is number => price !== null);
      return {
        name,
        term,
        listings: modelRows.length,
        medianPrice: median(modelPrices),
      };
    })
      .filter((model) => model.listings > 0)
      .sort((a, b) => b.listings - a.listings);

    const result: AdidasData = {
      ok: true,
      totalListings: rows.length,
      sellerCount: sellers.size,
      p10: percentile(prices, 0.1),
      p90: percentile(prices, 0.9),
      median: median(prices) ?? 0,
      models,
      products: groupFeaturedProducts(rows),
    };
    adidasCache.set("adidas", { expiresAt: Date.now() + CACHE_DURATION_MS, data: result });
    return result;
  } catch (error) {
    console.error("Could not load Adidas page data:", error);
    return { ok: false };
  }
}

const getAdidasData = createServerFn({ method: "GET" }).handler(loadAdidasData);

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatPrice(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatEGP(value: number) {
  return `EGP ${formatPrice(value)}`;
}

function ProductImage({
  src,
  title,
  loading,
}: {
  src: string;
  title: string;
  loading: "eager" | "lazy";
}) {
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
      loading={loading}
      decoding="async"
      onError={() => setHasError(true)}
      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
    />
  );
}

function getHeadContent(loaderData: AdidasLoadResult | undefined) {
  if (!loaderData?.ok) {
    const title = "Adidas Shoes in Egypt — Compare Listings | waggado";
    const description = "Compare Adidas shoe listings from independent stores in Egypt.";
    return { title, description, total: 0 };
  }

  const total = formatNumber(loaderData.totalListings);
  const sellers = formatNumber(loaderData.sellerCount);
  const title = `Adidas Shoes in Egypt — Compare ${total} Listings | waggado`;
  const description = `Compare ${total} Adidas shoe listings from ${sellers} independent stores in Egypt. Most priced between EGP ${formatPrice(loaderData.p10)} and EGP ${formatPrice(loaderData.p90)}. Samba, Campus, Gazelle and more.`;
  return { title, description, total: loaderData.totalListings };
}

export const Route = createFileRoute("/adidas")({
  loader: () => getAdidasData(),
  head: ({ loaderData }) => {
    const { title, description, total } = getHeadContent(loaderData);
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: title,
          url: ADIDAS_URL,
          description,
          numberOfItems: total,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "waggado", item: "https://waggado.app" },
            { "@type": "ListItem", position: 2, name: "Adidas shoes", item: ADIDAS_URL },
          ],
        },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: ADIDAS_URL },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: ADIDAS_URL }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  staticData: { sitemap: true },
  component: AdidasPage,
});

function AdidasPage() {
  const data = Route.useLoaderData();
  const isAvailable = data.ok;
  const products = isAvailable ? data.products : [];
  const totalListings = isAvailable ? data.totalListings : 0;
  const sellerCount = isAvailable ? data.sellerCount : 0;
  const models = isAvailable ? data.models : [];
  const p10 = isAvailable ? formatEGP(data.p10) : "—";
  const p90 = isAvailable ? formatEGP(data.p90) : "—";
  const typicalPrice = isAvailable ? formatEGP(data.median) : "—";
  const topModels = models.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        rightContent={
          <p className="text-sm font-semibold text-muted-foreground">
            {formatNumber(totalListings)} Adidas shoes{" "}
            <span className="text-foreground">from {formatNumber(sellerCount)} stores</span>
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
            {isAvailable
              ? `Compare ${formatNumber(totalListings)} Adidas listings from ${formatNumber(sellerCount)} independent stores in Egypt. Most are priced between ${p10} and ${p90}, with a typical price of ${typicalPrice}.`
              : "Adidas pricing data is temporarily unavailable."}
          </p>
          <p className="mt-2 max-w-3xl text-xs text-muted-foreground">{DISCLAIMER}</p>
        </section>

        <nav aria-label="Shop Adidas by model" className="mt-7">
          <h2 className="mb-3 font-display text-xl font-bold text-foreground">Shop by model</h2>
          <div className="flex flex-wrap gap-2">
            {models.map(({ name, term, listings }) => (
              <Link
                key={name}
                to="/search"
                search={{ q: term }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {name} <span className="text-muted-foreground">({formatNumber(listings)})</span>
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
                Popular shoes from independent online stores.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {formatNumber(products.length)} of {formatNumber(totalListings)} listings
            </p>
          </div>

          {!isAvailable || products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
              Adidas shoes are temporarily unavailable. Please try again later.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => {
                const productUrl = getProductUrl(product.cheapestOffer.productUrl);
                const storeName = product.cheapestOffer.storeName;
                const storeInitial = Array.from(storeName)[0]?.toUpperCase() ?? "B";
                const additionalStores = product.stores
                  .filter((store) => store.storeName !== storeName)
                  .slice(0, 3)
                  .map((store) => store.storeName);

                return (
                  <article
                    key={product.key}
                    className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                  >
                    <a
                      href={productUrl ?? undefined}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      aria-label={`View ${product.title} at ${storeName}`}
                      className={productUrl ? "cursor-pointer" : "cursor-default"}
                    >
                      <div className="aspect-square overflow-hidden bg-muted">
                        <ProductImage
                          src={product.cheapestOffer.imageUrl}
                          title={product.title}
                          loading={index < 4 ? "eager" : "lazy"}
                        />
                      </div>
                    </a>
                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-12 font-display font-bold text-foreground">
                        {product.title}
                      </h3>
                      <p className="mt-1 font-semibold text-primary">
                        {product.minPrice === product.maxPrice
                          ? `From ${formatEGP(product.minPrice)}`
                          : `${formatEGP(product.minPrice)}–${formatEGP(product.maxPrice)}`}
                      </p>
                      {product.stores.length > 1 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatNumber(product.stores.length)} stores
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={product.cheapestOffer.profilePicUrl ?? undefined}
                            alt={storeName}
                          />
                          <AvatarFallback className="text-xs">{storeInitial}</AvatarFallback>
                        </Avatar>
                        <p className="line-clamp-1 text-sm text-muted-foreground">{storeName}</p>
                      </div>
                      {additionalStores.length > 0 && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          Also at: {additionalStores.join(", ")}
                        </p>
                      )}
                      {productUrl && (
                        <a
                          href={productUrl}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="mt-3 block text-sm font-semibold text-primary"
                        >
                          View product →
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-foreground">
            Adidas price guide in Egypt
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Model
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Listings
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Typical price
                  </th>
                </tr>
              </thead>
              <tbody>
                {models.map((model) => (
                  <tr key={model.name} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium text-foreground">
                      {model.name}
                    </th>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatNumber(model.listings)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {model.medianPrice === null ? "—" : formatEGP(model.medianPrice)}
                    </td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-muted-foreground">
                      Adidas pricing data is temporarily unavailable.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-foreground">
            Questions about Adidas shoes in Egypt
          </h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                How much do Adidas shoes cost in Egypt?
              </h3>
              <p className="mt-1 text-muted-foreground">
                Most listings are between {p10} and {p90}, with a typical price of {typicalPrice}.
              </p>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Which Adidas models are listed most?
              </h3>
              <p className="mt-1 text-muted-foreground">
                {topModels.length > 0
                  ? topModels
                      .map((model) => `${model.name} (${formatNumber(model.listings)})`)
                      .join(", ") + "."
                  : "Model listing data is temporarily unavailable."}
              </p>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Does waggado sell these shoes?
              </h3>
              <p className="mt-1 text-muted-foreground">
                No. waggado compares listings; links take you to the seller’s own online store.
              </p>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Are these shoes authentic?
              </h3>
              <p className="mt-1 text-muted-foreground">
                waggado doesn’t verify authenticity. Ask the seller about the shoes’ origin and
                return policy before buying.
              </p>
            </div>
          </div>
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
