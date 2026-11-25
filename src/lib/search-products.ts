import { supabase } from "@/integrations/supabase/client";

export type SearchProduct = {
  id: number;
  title: string;
  price_egp: number;
  image_url: string | null;
  product_url: string | null;
  sizes: string[] | null;
  colors: string[] | null;
  display_name: string | null;
  profile_pic_url: string | null;
};

export type SearchProductPage = {
  products: SearchProduct[];
  totalCount: number;
};

export type SearchPageParams = {
  q: string;
  size?: string | null;
  colors?: string[];
  minPrice?: string;
  maxPrice?: string;
  page: number;
};

const PAGE_SIZE = 30;

export async function fetchSearchPage({
  q,
  size = null,
  colors = [],
  minPrice = "",
  maxPrice = "",
  page,
}: SearchPageParams): Promise<SearchProductPage> {
  type Row = {
    id: number;
    product_title: string;
    price: number | string;
    product_image_src: string | null;
    product_url: string | null;
    sizes: string[] | null;
    colors: string[] | null;
    display_name: string | null;
    profile_pic_url: string | null;
  };

  const searchTerm = q.trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("scraper_products")
    .select(
      "id, product_title, price, product_image_src, product_url, sizes, colors, display_name, profile_pic_url",
      { count: "exact" },
    )
    .eq("footwear", true);
  if (searchTerm) query = query.ilike("product_title", `%${searchTerm}%`);
  if (size) query = query.contains("sizes", [size]);
  if (colors.length > 0) query = query.overlaps("colors", colors);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));

  const { data, count, error } = await query
    .order("product_title", { ascending: true })
    .order("id", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;

  return {
    products: ((data ?? []) as Row[]).map((product): SearchProduct => ({
      id: product.id,
      title: product.product_title,
      price_egp: Number(product.price),
      image_url: product.product_image_src,
      product_url: product.product_url,
      sizes: product.sizes,
      colors: product.colors,
      display_name: product.display_name,
      profile_pic_url: product.profile_pic_url,
    })),
    totalCount: count ?? 0,
  };
}
