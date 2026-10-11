# Balando Shoe Shuffle

Create a new project with Supabase enabled. Call it balando. It should be your one stop shop for finding your perfect shoes in egypt. Basically it's a filter for size, color multi select, price range, and search term. after applying the filter it shows the results randomized not in a specific order. Make it clean, simple and easy to use. The table with the products is called scraper_products on supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4a6e8745-5777-4877-aea3-981a98e2b97f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Supabase setup

The app connects to the Supabase project configured in `.env`. To use a different project, update `SUPABASE_PROJECT_ID`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and their `VITE_` counterparts, and update `project_id` in `supabase/config.toml`.

For a fresh database, run [`drizzle/migrations/0000_create_scraper_products.sql`](drizzle/migrations/0000_create_scraper_products.sql) in the Supabase SQL Editor. This creates the publicly readable `scraper_products` table and inserts sample products.

If server-side admin operations are added, set `SUPABASE_SERVICE_ROLE_KEY` in a private local environment file or deployment secret. Never commit the service-role key.
