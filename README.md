# Childminder App

React + Vite app for managing families, child schedules, and invoice generation. The app talks directly to Supabase from the browser, so it needs two public Vite environment variables at build time:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local development

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase project values
3. Run `npm install`
4. Run `npm run dev`

## Production build

Run:

```bash
npm run build
```

The current app builds successfully as a static frontend, so it can be deployed easily to Vercel.

## Deploy to Vercel

1. Install the CLI if needed: `npm install -g vercel`
2. Log in: `vercel login`
3. From this folder, run: `vercel`
4. Add these environment variables in Vercel project settings before the production deploy:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy to production with: `vercel --prod`

If you prefer GitHub-connected deploys:

1. Create a GitHub repo and push this project
2. Import the repo into Vercel
3. Add the same two environment variables in Vercel
4. Trigger the first production deployment from the Vercel dashboard
