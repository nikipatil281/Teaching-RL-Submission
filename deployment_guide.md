# Deployment Guide — TeachingRL

This guide provides instructions for building and deploying the TeachingRL application to a production environment.

## 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher.
- **NPM**: Version 9.0.0 or higher.
- **Terminal Access**: Access to a command-line interface.

## 2. Local Environment Setup
Before building for production, ensure dependencies are correctly installed:
```bash
npm install
```

## 3. Production Build
Execute the build command to generate the optimized production bundle.
```bash
npm run build
```
This command will:
1. Generate a walker asset manifest (via custom Vite plugin).
2. Compile and minify JavaScript (ES Modules).
3. Process and purge Tailwind CSS for minimum file size.
4. Output all assets to the `/dist` directory.

## 4. Deployment Steps

### Standard Static Server (Nginx / Apache)
1. Copy the contents of the `dist/` directory to your server's web root (e.g., `/var/www/html`).
2. Ensure the server is configured to serve `index.html` for all unknown routes (Single Page Application routing).

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Managed Hosting (Vercel / Netlify / GitHub Pages)
1. Connect your repository to the hosting provider.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Enable "SPA Redirects" or "Rewrites" to redirect all traffic to `index.html`.

