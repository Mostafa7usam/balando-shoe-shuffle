import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Search,
  SlidersHorizontal,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";

import heroImg from "@/assets/hero-footwear.jpg";
import sneakersImg from "@/assets/cat-sneakers.jpg";
import sandalsImg from "@/assets/cat-sandals.jpg";
import bootsImg from "@/assets/cat-boots.jpg";
import clogsImg from "@/assets/cat-clogs.jpg";
import heelsImg from "@/assets/cat-heels.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "waggado — Egypt's Ultimate Footwear Finder",
      },
      {
        name: "description",
        content:
          "waggado gathers every footwear business in Egypt in one place. Search sneakers, sandals, boots, clogs, flip flops and leather shoes by size, color and price — best fit, best price, best provider.",
      },
      {
        property: "og:title",
        content: "waggado — Egypt's Ultimate Footwear Finder",
      },
      {
        property: "og:description",
        content:
          "Stop doom-scrolling ads. Find sneakers, sandals, شبشب, boots, clogs and more from footwear stores across Egypt — filtered by size, color and price.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://balando.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://balando.lovable.app/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Outfit:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "waggado",
          alternateName: "balando",
          url: "https://balando.lovable.app/",
          description:
            "Egypt's ultimate footwear finder — one place to search every footwear store in Egypt.",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://balando.lovable.app/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  staticData: { sitemap: true },
  component: Landing,
});

const TRENDING: { label: string; query: string }[] = [
  { label: "adidas Egypt", query: "adidas" },
  { label: "Nike sneakers", query: "nike" },
  { label: "Running shoes", query: "running" },
  { label: "Clogs", query: "clogs" },
  { label: "شبشب نايك", query: "flip" },
  { label: "Loafers", query: "loafers" },
  { label: "Puma", query: "puma" },
  { label: "Skechers", query: "skechers" },
  { label: "Crocs", query: "crocs" },
  { label: "كوتشي اديداس", query: "adidas" },
];

const CATEGORIES: {
  title: string;
  blurb: string;
  image: string;
  query: string;
}[] = [
  {
    title: "Sneakers & كوتشي",
    blurb: "From running shoes to campus classics — every drop, every store.",
    image: sneakersImg,
    query: "sneakers",
  },
  {
    title: "Sandals & Flip Flops",
    blurb: "شبشب season all year. Leather straps, slides and havaianas-style classics.",
    image: sandalsImg,
    query: "sandals",
  },
  {
    title: "Boots & Leather",
    blurb: "Work boots, chelsea boots and polished leather that lasts.",
    image: bootsImg,
    query: "boots",
  },
  {
    title: "Clogs & Slides",
    blurb: "Egypt's fastest-growing trend — clogs for men and women.",
    image: clogsImg,
    query: "clogs",
  },
  {
    title: "Heels & Ballerinas",
    blurb: "Kitten heels, wedges and flats for every occasion.",
    image: heelsImg,
    query: "heels",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              waggado
            </p>
            <p className="text-xs text-muted-foreground">
              from wagad · واجد · <span className="italic">find</span>
            </p>
          </div>
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
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:pt-16">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1.5 text-xs font-semibold text-primary">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Every footwear store in Egypt. One place.
                </span>
                <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Stop scrolling ads.
                  <span className="block text-primary">Start finding shoes.</span>
                </h1>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  waggado comes from <em>wagad</em> — "find" in Arabic — and that's all
                  it does: sneakers, sandals, boots, clogs, flip flops and leather
                  shoes from stores across Egypt, filtered by{" "}
                  <strong className="text-foreground">size</strong>,{" "}
                  <strong className="text-foreground">color</strong>,{" "}
                  <strong className="text-foreground">price</strong> and brand. Best
                  fit. Best price. Best provider.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
                  >
                    Find your perfect pair
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#trending"
                    className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-6 py-3.5 font-display text-base font-bold text-foreground transition-colors hover:bg-accent"
                  >
                    What Egypt is searching
                  </a>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  Free to use · No account needed · Real Egyptian stores
                </p>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-3xl border border-border shadow-2xl shadow-primary/10">
                  <img
                    src={heroImg}
                    alt="A colorful flat-lay of sneakers, boots, sandals, clogs and heels available in Egypt"
                    width={1600}
                    height={900}
                    className="h-full w-full object-cover"
                    fetchPriority="high"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending searches */}
        <section id="trending" className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <h2 className="flex shrink-0 items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trending in Egypt
              </h2>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((t) => (
                  <Link
                    key={t.label}
                    to="/search"
                    search={{ q: t.query }}
                    className="rounded-full border border-input bg-background px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Every style, one search away
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              However you say it — كوتشي, شبشب, clogs, boots — waggado speaks your
              language. Tap a style and filter your way.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <Link
                key={c.title}
                to="/search"
                search={{ q: c.query }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.title}
                    width={1024}
                    height={1024}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-foreground">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Browse
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            <Link
              to="/search"
              className="group flex items-center justify-between gap-4 rounded-2xl bg-primary px-6 py-5 text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] lg:col-span-5"
            >
              <div>
                <p className="font-display text-lg font-bold">
                  Can't see your style? Search everything.
                </p>
                <p className="text-sm opacity-80">
                  Slippers, flip flops, running shoes, clogs for men and women — it's
                  all in there.
                </p>
              </div>
              <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Why waggado */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Shopping ads found you. Now you find them.
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                You didn't choose to see that shoe on Instagram — an ad chose you.
                waggado flips it around.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Tag,
                  title: "Best price",
                  text: "See the same style across every store and compare prices in EGP before you buy.",
                },
                {
                  icon: SlidersHorizontal,
                  title: "Best fit",
                  text: "Filter by your exact EU size, color and budget in seconds — not hours of scrolling.",
                },
                {
                  icon: Store,
                  title: "Best provider",
                  text: "Real footwear businesses across Egypt, from big brands to local stores — all in one place.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Three steps. One perfect pair.
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Search & filter",
                text: "Type what you're after — كوتشي اديداس رجالي, clogs, running shoes — then set size, color and price.",
              },
              {
                n: "2",
                title: "Compare",
                text: "See prices, sizes, colors and stores side by side before you commit.",
              },
              {
                n: "3",
                title: "Go to the store",
                text: "Click through straight to the seller's product page and buy from them — waggado never sits in the middle.",
              },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground shadow-xl shadow-primary/20">
            <BadgeCheck className="mx-auto h-10 w-10 opacity-80" />
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your perfect pair is already in Egypt. Go find it.
            </h2>
            <Link
              to="/search"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 font-display text-base font-bold text-primary transition-transform hover:scale-[1.03]"
            >
              Start searching
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>
            <span className="font-display font-extrabold text-foreground">waggado</span>{" "}
            — find your perfect fit, Egypt 🇪🇬
          </p>
          <Link to="/search" className="font-semibold text-primary hover:underline">
            Search all shoes →
          </Link>
        </div>
      </footer>
    </div>
  );
}
