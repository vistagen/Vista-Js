# Deploying Vista to Vercel

> ⚠️ **Note:** Vista is in alpha. Vercel deployment support is experimental.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Vercel CLI](https://vercel.com/docs/cli) installed: `npm i -g vercel`

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (already done at `vistagen/Vista-Js`)

2. **Import Project in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **"Import Git Repository"**
   - Select the `vistagen/Vista-Js` repository

3. **Configure Build Settings:**
   - **Framework Preset:** `Other`
   - **Root Directory:** `./` (monorepo root)
   - **Build Command:** `cd apps/web && npm install && npx vista build`
   - **Output Directory:** `apps/web/.vista`
   - **Install Command:** `npm install`

4. **Deploy!**
   - Click **Deploy**
   - Vercel will build and deploy your app

### Option 2: Deploy via Vercel CLI

```bash
# From the vista-source root directory
cd d:/Frame-Work Tarkari/vista-source

# Login to Vercel (first time only)
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Scope: Select your account
# - Link to existing project: N (for first deploy)
# - Project name: vista-web (or your choice)
# - Directory: ./
# - Override settings: N (uses vercel.json)
```

## Important Notes

### Rust Native Bindings
Vista uses Rust (N-API) for performance. Vercel's build environment supports Linux x64. The `vista-napi` crate is configured to build for `x86_64-unknown-linux-gnu`.

If you encounter build failures related to Rust:
1. Ensure `rust-toolchain.toml` is present
2. The build may take longer on first deploy (Rust compilation)

### Environment Variables
Set any required environment variables in Vercel Dashboard:
- `NODE_ENV=production`

### Static Files
Static assets from `apps/web/public/` are served from the `.vista` output directory.

## Troubleshooting

**Build fails with "vista not found":**
- Ensure `packages/vista` is built first
- The build command should handle this automatically

**Page not rendering:**
- Check Vercel function logs in the dashboard
- Ensure all dependencies are installed

**CSS not loading:**
- Verify `client.css` is generated in `.vista/`
- Check the routes in `vercel.json`
