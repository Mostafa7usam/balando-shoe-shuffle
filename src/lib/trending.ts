import { supabase } from "@/integrations/supabase/client";

export type TrendingProduct = {
  id: number;
  title: string;
  price_egp: number;
  image_url: string | null;
  product_url: string | null;
  display_name: string | null;
  profile_pic_url: string | null;
  trending_query: string;
};

export type TrendingResult = {
  term: string;
  interest: number;
  product: TrendingProduct | null;
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

const CACHE_DURATION_MS = 60 * 60 * 1000;
const trendingCache = new Map<string, { expiresAt: number; data: TrendingResult[] }>();

export async function fetchTrending(): Promise<TrendingResult[]> {
  const cached = trendingCache.get("trending");
  if (cached && cached.expiresAt > Date.now()) return cached.data;

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
    TRENDING_SEARCHES.map(async (trend): Promise<TrendingResult> => {
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
      const row =
        candidates.find(
          (candidate) => candidate.product_title.trim().toLowerCase() !== trend.query,
        ) ?? candidates[0];
      return {
        term: trend.label,
        interest: trend.interest,
        product: row
          ? {
              id: row.id,
              title: row.product_title,
              price_egp: Number(row.price),
              image_url: row.product_image_src,
              product_url: row.product_url,
              display_name: row.display_name,
              profile_pic_url: row.profile_pic_url,
              trending_query: trend.label,
            }
          : null,
      };
    }),
  );

  trendingCache.set("trending", {
    expiresAt: Date.now() + CACHE_DURATION_MS,
    data: results,
  });
  return results;
}
