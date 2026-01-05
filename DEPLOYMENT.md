# Deploying Vista to Render

Render is the recommended platform for Vista since it supports **long-running Node.js servers**.

## Quick Deploy (Recommended)

1. **Go to [render.com/new](https://dashboard.render.com/new)**

2. **Select "Blueprint"** and connect your GitHub repo (`vistagen/Vista-Js`)

3. **Render will auto-detect `render.yaml`** and configure everything

4. **Click "Apply"** - Done! 🚀

---

## Manual Setup

If you prefer manual configuration:

1. **Go to [render.com/new](https://dashboard.render.com/new)**

2. **Select "Web Service"**

3. **Connect your GitHub repo** (`vistagen/Vista-Js`)

4. **Configure:**
   - **Name:** `vista-web`
   - **Region:** Oregon (or closest to you)
   - **Runtime:** Node
   - **Build Command:**
     ```
     cd packages/vista && npm install --legacy-peer-deps && cd ../../apps/web && npm install --legacy-peer-deps && npx vista build
     ```
   - **Start Command:**
     ```
     cd apps/web && npx vista start
     ```
   - **Instance Type:** Free (or paid for production)

5. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3003`

6. **Click "Create Web Service"**

---

## After Deployment

Your app will be available at:
```
https://vista-web-xxxx.onrender.com
```

Render automatically:
- Redeploys on every push to `main`
- Provides free SSL
- Shows logs in the dashboard
