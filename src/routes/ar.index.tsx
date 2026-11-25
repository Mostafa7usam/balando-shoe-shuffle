import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { ArrowLeft, BadgeCheck, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { normalizeArabicQuery } from "@/lib/arabic-query";
import { fetchTrending, type TrendingProduct, type TrendingResult } from "@/lib/trending";

const getTrending = createServerFn({ method: "GET" }).handler(fetchTrending);

function mapTrendingProducts(results: TrendingResult[]): TrendingProduct[] {
  const unique = new Map<number, TrendingProduct>();
  for (const result of results) {
    if (result.product && !unique.has(result.product.id)) unique.set(result.product.id, result.product);
  }
  return [...unique.values()];
}

function formatEGP(n: number) {
  return `${n.toLocaleString("en-US")} جنيه`;
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

export const Route = createFileRoute("/ar/")({
  loader: async () => {
    try {
      return await getTrending();
    } catch (error) {
      console.error("[arabic trending loader]", error);
      return [];
    }
  },
  head: () => ({
    meta: [
      { title: "waggado | قارن أسعار الكوتشي والجزم في مصر" },
      {
        name: "description",
        content:
          "دوّر على كوتشي وجزم وصنادل من متاجر مصرية، قارن الأسعار واختار المقاس واللون، وكمّل الشراء من المتجر مباشرة.",
      },
      { property: "og:title", content: "waggado | قارن أسعار الكوتشي والجزم في مصر" },
      {
        property: "og:description",
        content:
          "دوّر على كوتشي وجزم وصنادل من متاجر مصرية، قارن الأسعار واختار المقاس واللون، وكمّل الشراء من المتجر مباشرة.",
      },
      { property: "og:url", content: "https://waggado.app/ar" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://waggado.app/ar" },
      { rel: "alternate", hreflang: "ar-EG", href: "https://waggado.app/ar" },
      { rel: "alternate", hreflang: "en", href: "https://waggado.app/" },
      { rel: "alternate", hreflang: "x-default", href: "https://waggado.app/" },
      { rel: "preload", href: "/fonts/ibm-plex-arabic-regular.ttf", as: "font", type: "font/ttf", crossOrigin: "anonymous" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "waggado",
          url: "https://waggado.app/ar",
          inLanguage: "ar-EG",
        }),
      },
    ],
  }),
  staticData: { sitemap: true },
  component: ArabicLanding,
});

function ArabicLanding() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const loaderData = Route.useLoaderData();
  const loaderProducts = mapTrendingProducts(Array.isArray(loaderData) ? loaderData : []);
  const { data: trendingProducts = [] } = useQuery({
    queryKey: ["homepage-trending-products-ar"],
    queryFn: async () => mapTrendingProducts(await getTrending()),
    ...(loaderProducts.length > 0
      ? { initialData: loaderProducts, staleTime: 60 * 60 * 1000 }
      : {}),
  });

  const brands: Array<[string, string]> = [
    ["اديداس", "/adidas"],
    ["نايك", "/search?q=nike"],
    ["بوما", "/search?q=puma"],
    ["اسكيتشرز", "/search?q=skechers"],
    ["اسيكس", "/search?q=asics"],
  ];
  const types = [
    ["كوتشي", "sneaker"],
    ["صنادل", "sandal"],
    ["شباشب", "slide"],
    ["بوت", "boot"],
    ["كوتشي جري", "running"],
    ["كلوج", "clog"],
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-display text-2xl font-extrabold text-foreground">waggado</Link>
          <nav aria-label="التنقل الرئيسي" className="flex items-center gap-2 sm:gap-4">
            <Link to="/search" className="text-sm font-semibold text-foreground hover:text-primary">
              كل الأحذية
            </Link>
            <Link to="/" className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground">
              English
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.15] text-foreground sm:text-6xl">
            لاقي الكوتشي اللي يناسبك… بأحسن سعر في مصر
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            waggado بيجمعلك آلاف الأحذية من متاجر مصرية في مكان واحد. قارن الأسعار، واختار المقاس واللون، وبعدين كمّل الشراء من المتجر نفسه.
          </p>
          <form
            role="search"
            aria-label="البحث عن الأحذية"
            className="mt-7 flex max-w-2xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const normalized = normalizeArabicQuery(query);
              void navigate({ to: "/search", search: { q: normalized } });
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="ابحث عن ماركة أو موديل"
                placeholder="دوّر على ماركة أو موديل… مثلًا: اديداس سامبا"
                className="w-full rounded-xl border border-input bg-card py-3.5 pe-4 ps-10 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              aria-label="ابحث"
              className="inline-flex shrink-0 items-center rounded-xl bg-primary px-5 py-3.5 font-bold text-primary-foreground"
            >
              دوّر
            </button>
          </form>
          <img
            src="/hero-footwear.jpg"
            alt="مجموعة أحذية ملونة"
            width={2000}
            height={1372}
            className="mt-8 aspect-[2/1] w-full rounded-3xl object-cover"
            fetchPriority="high"
          />
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">ماركات مشهورة</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {brands.map(([label, href]) => (
                href === "/adidas" ? (
                  <Link key={label} to="/adidas" className="rounded-full border border-border bg-background px-4 py-2.5 font-semibold hover:border-primary">
                    {label}
                  </Link>
                ) : (
                  <Link key={label} to="/search" search={{ q: href.split("q=")[1] }} className="rounded-full border border-border bg-background px-4 py-2.5 font-semibold hover:border-primary">
                    {label}
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">اختار من الأقسام</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {types.map(([label, term]) => (
              <Link key={label} to="/search" search={{ q: term }} className="flex min-h-24 items-center justify-center rounded-2xl border border-border bg-card p-4 text-center font-bold text-foreground hover:border-primary">
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">الأكتر بحثًا في مصر دلوقتي</h2>
            <p className="mt-2 text-sm text-muted-foreground">بناءً على اللي الناس بتدوّر عليه في مصر</p>
            {trendingProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {trendingProducts.slice(0, 8).map((product) => {
                  const productUrl = getProductUrl(product.product_url);
                  return (
                    <a
                      key={product.id}
                      href={productUrl ?? undefined}
                      target={productUrl ? "_blank" : undefined}
                      rel={productUrl ? "nofollow noopener noreferrer" : undefined}
                      aria-label={`اعرض ${product.title}${productUrl ? " في صفحة المتجر" : ""}`}
                      className="group overflow-hidden rounded-2xl border border-border bg-background"
                    >
                      <div className="aspect-square overflow-hidden bg-muted">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" loading="lazy" className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">الصورة غير متاحة</div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground">Trending: {product.trending_query}</p>
                        <h3 dir="ltr" className="mt-1 line-clamp-2 min-h-12 text-start font-display font-bold text-foreground">{product.title}</h3>
                        <p className="mt-1 font-semibold text-primary">{formatEGP(product.price_egp)}</p>
                        {productUrl && <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">شوف المنتج <ArrowLeft className="h-4 w-4" /></p>}
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">الأكثر بحثًا مش متاح دلوقتي.</p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">إزاي waggado بيشتغل؟</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: Search, title: "دوّر", text: "اكتب الماركة أو الموديل، أو اختار من الأقسام." },
              { icon: SlidersHorizontal, title: "قارن", text: "شوف الأسعار والمقاسات المتاحة من أكتر من متجر." },
              { icon: ShoppingBag, title: "اشتري", text: "اضغط على المنتج وكمّل الشراء من صفحة المتجر مباشرة." },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary"><step.icon className="h-5 w-5" /></div>
                <h3 className="mt-3 font-display text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">أسئلة شائعة</h2>
            <div className="mt-6 space-y-6">
              {[
                ["هو waggado بيبيع الأحذية؟", "لأ. waggado بيجمّع عروض متاجر مصرية مستقلة عشان تقارن بينها بسهولة. لما تفتح أي منتج بتروح لصفحة المتجر وتشتري منه مباشرة."],
                ["إزاي أعرف إن المنتج أصلي؟", "waggado مبيتأكدش من أصالة المنتجات. قبل ما تدفع، اسأل المتجر عن مصدر المنتج وسياسة الاسترجاع."],
                ["الأسعار اللي على الموقع نهائية؟", "الأسعار بتتجمع من صفحات المتاجر وممكن تتغيّر. السعر النهائي هو اللي بيظهر في صفحة المتجر وقت الشراء."],
              ].map(([question, answer]) => (
                <div key={question}>
                  <h3 className="font-bold text-foreground">{question}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="overflow-hidden rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground shadow-xl shadow-primary/20 sm:py-12">
            <BadgeCheck className="mx-auto h-10 w-10 opacity-80" />
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              الكوتشي المناسب ليك موجود في مصر. دوس ودور عليه.
            </h2>
            <Link
              to="/search"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 font-display font-bold text-primary transition-transform hover:scale-[1.03]"
            >
              ابدأ البحث
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-sm text-muted-foreground">waggado موقع بحث ومقارنة. إحنا مبنبيعش المنتجات ومبنتأكدش إنها أصلية، والأسعار والمقاسات المتاحة ممكن تتغيّر. اتأكد من المتجر قبل ما تدفع.</p>
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
            <p className="font-semibold text-foreground">waggado — لاقي مقاسك في مصر 🇪🇬</p>
            <Link to="/search" className="inline-flex items-center gap-1 font-semibold text-primary">كل الأحذية <ArrowLeft className="h-4 w-4" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
