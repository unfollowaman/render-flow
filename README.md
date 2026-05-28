# 🍄 html2png — Pixel-perfect HTML to PNG Converter

A serverless HTML → PNG converter powered by Playwright + serverless Chromium on Vercel.

---

## ✨ Features

- **Raw HTML input** — paste directly or upload a `.html` file
- **Pixel-perfect rendering** — headless Chromium via `@sparticuz/chromium`
- **External assets** — Google Fonts, CDN CSS, external images all fetched automatically
- **No JS execution** — pure layout/visual rendering only
- **Stateless** — no storage, no auth, zero persistence
- **Mario-inspired loader** — a little playful chaos during conversion

---

## 🚀 Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---


## 🌍 Deployment Notes (GitHub Pages vs Netlify vs Vercel)

This project is a **Next.js app with a serverless API** (`/api/convert`) that runs Chromium.

- **GitHub Pages is not compatible** with this app architecture.
  - GitHub Pages is static hosting only (HTML/CSS/JS files).
  - It cannot run `pages/api/convert.js`, so conversion will never work there.
- **Netlify can host it**, but only when configured as a Next.js app (build + Next.js runtime/plugin).
  - This repo now includes `netlify.toml` with the official Next.js plugin.
- **Vercel is the primary target** for this project and is the most reliable platform for this Playwright + Chromium setup.

### Netlify setup checklist

1. Build command: `npm run build`
2. Publish directory: leave empty / managed by Netlify Next.js plugin
3. Node version: 18+ (recommended)
4. Ensure the deploy includes serverless functions (not a static-only deploy)

## ☁️ Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

The `vercel.json` already configures:
- 1024MB memory for the `/api/convert` function
- 60s max duration (for large HTML with many external assets)

---

## 🏗️ Project Structure

```
/
├── pages/
│   ├── _app.js            # Global styles wrapper
│   ├── _document.js       # Custom HTML document (fonts)
│   ├── index.js           # Main UI page
│   └── api/
│       └── convert.js     # 🔑 Serverless Playwright endpoint
├── styles/
│   ├── globals.css        # Global reset + typography
│   └── Home.module.css    # Page-level CSS modules
├── next.config.js         # Next.js config
├── vercel.json            # Serverless function settings
└── package.json
```

---

## 📡 API Reference

### `POST /api/convert`

**Request body:**
```json
{
  "html": "<html>...</html>"
}
```

**Response (200):**
```json
{
  "image": "data:image/png;base64,...",
  "width": 1200,
  "height": 630
}
```

**Response (error):**
```json
{
  "error": "Detailed error message"
}
```

---

## 🎯 Rendering Details

| Setting | Value |
|---|---|
| JavaScript | ✅ Enabled (for page rendering) |
| Scale factor | 1x |
| Wait condition | `load` + `networkidle` |
| Extra settle time | 800ms |
| Max HTML size | 5MB |
| Timeout | 45s |

---

## 💡 Tips for Best Results

- Set explicit `width` and `height` on `<body>` for precise viewport sizing (defaults to 1200×630)
- Use `display: flex` on body to center content
- Google Fonts load automatically — just include the `<link>` tag
- External images are fetched at render time — use absolute URLs

---

## 🧪 Sample HTML (Open Graph image)

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      width: 1200px;
      height: 630px;
      background: #0f0f0f;
      font-family: 'Inter', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    h1 { color: #ffa100; font-size: 64px; font-weight: 900; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>
```

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `next` | Framework + serverless functions |
| `playwright-core` | Headless browser control |
| `@sparticuz/chromium` | Lightweight Chromium for serverless |

---

Built with ♥ and a few mushrooms 🍄
