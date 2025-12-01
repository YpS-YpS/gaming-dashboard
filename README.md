# Intel Gaming Performance Dashboard

A React-based dashboard for tracking gaming performance metrics across Intel CPU programs (Arrow Lake, Nova Lake, Panther Lake).

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

This creates a `dist/` folder with static files ready to deploy.

---

## Deployment Options

### Option 1: Azure Static Web Apps (Recommended for Intel/Enterprise)

**Via Azure Portal:**
1. Go to Azure Portal → Create Resource → "Static Web App"
2. Connect to your GitHub repo (or upload manually)
3. Build preset: **Vite**
4. App location: `/`
5. Output location: `dist`

**Via Azure CLI:**
```bash
# Install Azure CLI if needed
# Login
az login

# Create resource group (if needed)
az group create --name intel-gaming-rg --location westus2

# Create Static Web App
az staticwebapp create \
  --name intel-gaming-dashboard \
  --resource-group intel-gaming-rg \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO \
  --location "westus2" \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### Option 2: Azure Blob Storage (Static Website)

```bash
# Create storage account
az storage account create \
  --name intelgamingdash \
  --resource-group intel-gaming-rg \
  --location westus2 \
  --sku Standard_LRS

# Enable static website hosting
az storage blob service-properties update \
  --account-name intelgamingdash \
  --static-website \
  --index-document index.html

# Build and upload
npm run build
az storage blob upload-batch \
  --account-name intelgamingdash \
  --source dist \
  --destination '$web'
```

Your site will be at: `https://intelgamingdash.z5.web.core.windows.net`

### Option 3: Vercel (Fastest - 30 seconds)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Production deploy
vercel --prod
```

### Option 4: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build first
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Option 5: GitHub Pages

1. Add to `vite.config.js`:
```js
export default defineConfig({
  base: '/YOUR_REPO_NAME/',
  // ... rest of config
})
```

2. Build and deploy:
```bash
npm run build
# Push dist folder to gh-pages branch
```

### Option 6: SharePoint (Internal Only)

1. Build: `npm run build`
2. Upload `dist/` contents to a SharePoint document library
3. Use SharePoint's "Embed" web part or direct links

---

## Environment Variables (Optional)

For connecting to real data APIs, create `.env`:

```
VITE_API_URL=https://your-api-endpoint.com
```

Access in code: `import.meta.env.VITE_API_URL`

---

## Tech Stack

- React 18
- Vite (build tool)
- Recharts (charts)
- Lucide React (icons)
