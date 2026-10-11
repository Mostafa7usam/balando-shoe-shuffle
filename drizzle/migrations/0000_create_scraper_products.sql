CREATE TABLE public.scraper_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  brand text,
  price_egp numeric NOT NULL,
  image_url text,
  product_url text,
  sizes text[] DEFAULT '{}',
  colors text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.scraper_products TO anon;
GRANT SELECT ON public.scraper_products TO authenticated;
GRANT ALL ON public.scraper_products TO service_role;

ALTER TABLE public.scraper_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable" ON public.scraper_products
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.scraper_products (title, brand, price_egp, image_url, product_url, sizes, colors) VALUES
('Air Max Pulse', 'Nike', 5400, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', '#', ARRAY['40','41','42','43','44'], ARRAY['red','black']),
('Ultraboost Light', 'Adidas', 6200, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800', '#', ARRAY['39','40','41','42','43'], ARRAY['white','grey']),
('Classic Leather', 'Reebok', 3100, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800', '#', ARRAY['38','39','40','41','42'], ARRAY['white']),
('Chuck Taylor All Star', 'Converse', 2400, 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800', '#', ARRAY['36','37','38','39','40','41','42'], ARRAY['black','white','red']),
('RS-X Reinvention', 'Puma', 3900, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', '#', ARRAY['40','41','42','43','44','45'], ARRAY['blue','white']),
('Gel-Kayano 30', 'Asics', 5800, 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800', '#', ARRAY['41','42','43','44'], ARRAY['blue','black']),
('Old Skool', 'Vans', 2650, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800', '#', ARRAY['37','38','39','40','41','42','43'], ARRAY['black','white']),
('990v6', 'New Balance', 7900, 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800', '#', ARRAY['40','41','42','43','44','45'], ARRAY['grey']),
('Suede Classic XXI', 'Puma', 3300, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800', '#', ARRAY['39','40','41','42'], ARRAY['green','black']),
('Air Force 1 07', 'Nike', 5100, 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800', '#', ARRAY['38','39','40','41','42','43','44'], ARRAY['white']),
('Samba OG', 'Adidas', 4500, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800', '#', ARRAY['36','37','38','39','40','41','42'], ARRAY['white','black']),
('Club C 85', 'Reebok', 3400, 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800', '#', ARRAY['40','41','42','43'], ARRAY['white','green']),
('Blazer Mid 77', 'Nike', 4700, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', '#', ARRAY['40','41','42','43','44'], ARRAY['white','black']),
('Cortez Classic', 'Nike', 4200, 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800', '#', ARRAY['39','40','41','42','43'], ARRAY['white','red','blue']),
('Campus 00s', 'Adidas', 4800, 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800', '#', ARRAY['38','39','40','41','42','43'], ARRAY['green','white']),
('FuelCell Rebel v4', 'New Balance', 5600, 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800', '#', ARRAY['41','42','43','44','45'], ARRAY['orange','black']),
('Slip-On Classic', 'Vans', 2300, 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800', '#', ARRAY['37','38','39','40','41','42'], ARRAY['black','white']),
('Gel-1130', 'Asics', 4400, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', '#', ARRAY['40','41','42','43','44'], ARRAY['silver','white']),
('Run Star Hike', 'Converse', 3900, 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800', '#', ARRAY['36','37','38','39','40','41'], ARRAY['black','white']),
('Pegasus 41', 'Nike', 5300, 'https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=800', '#', ARRAY['40','41','42','43','44','45'], ARRAY['blue','grey']),
('Handball Spezial', 'Adidas', 4600, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800', '#', ARRAY['38','39','40','41','42','43'], ARRAY['blue','white']),
('574 Core', 'New Balance', 4100, 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800', '#', ARRAY['39','40','41','42','43','44'], ARRAY['grey','navy']),
('Mayze Stack', 'Puma', 3700, 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800', '#', ARRAY['36','37','38','39','40'], ARRAY['white','pink']),
('Nano X4', 'Reebok', 4900, 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800', '#', ARRAY['40','41','42','43','44'], ARRAY['black','orange']);