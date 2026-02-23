# Cloudflare Pages Deployment Guide for Next.js (TypeScript)

This guide outlines the steps and configurations required to deploy your Next.js application, built with TypeScript, to Cloudflare Pages.

---

## 1. Project Setup (Already Completed)

Your project is already configured with Next.js 14, TypeScript, and Tailwind CSS. Key configurations for Cloudflare Pages deployment are:

*   **`next.config.ts`**: Configured for Static HTML Export.
    ```typescript
    // next.config.ts
    import type { NextConfig } from "next";

    const nextConfig: NextConfig = {
      output: "export", // Essential for static export to Cloudflare Pages
      // ... other config options
    };

    export default nextConfig;
    ```
*   **`package.json`**: Contains the standard build script.
    ```json
    // package.json
    {
      "name": "lotto-project",
      "version": "0.1.0",
      "private": true,
      "type": "module",
      "scripts": {
        "dev": "next dev",
        "build": "next build", // This script will be used by Cloudflare Pages
        "start": "next start",
        "lint": "eslint",
        "test": "ts-node lotto-utils.test.ts"
      },
      // ... dependencies and devDependencies
    }
    ```

---

## 2. Cloudflare Pages Configuration (`cloudflare-pages.json`)

To explicitly define your build process for Cloudflare Pages, a `cloudflare-pages.json` file has been created at the root of your project. This is highly recommended for clarity and consistency.

```json
// cloudflare-pages.json
{
  "functions": {
    "node_version": "18"
  },
  "build": {
    "command": "npm run build",
    "publish": "out"
  }
}
```

*   **`functions.node_version`**: Specifies the Node.js version to use for any Cloudflare Functions (e.g., Next.js API Routes if not using static export). For static export, this might be less critical but ensures a consistent environment.
*   **`build.command`**: This is the command Cloudflare Pages will execute to build your project. For Next.js static export, `npm run build` is standard.
*   **`build.publish`**: This specifies the directory where the build output (your static files) will be located. When `output: "export"` is set in `next.config.ts`, Next.js outputs to the `out` directory by default.

---

## 3. Environment Variables

Managing environment variables securely is crucial. For Cloudflare Pages, you set these variables directly in the Cloudflare dashboard.

### Setup in Cloudflare Pages Dashboard:

1.  Navigate to your Pages project in the Cloudflare dashboard.
2.  Go to **Settings** > **Environment variables**.
3.  Add your environment variables here.
    *   For **build-time** variables (available during the build process), you can add them without a prefix.
    *   For **runtime** variables that need to be accessible in your *client-side* Next.js code, they **must be prefixed with `NEXT_PUBLIC_`**.

### Usage in Next.js:

*   **Server-side (e.g., `getServerSideProps`, API Routes, `next.config.ts`):**
    ```typescript
    // process.env.YOUR_SECRET_API_KEY
    ```
*   **Client-side (e.g., React components, `getStaticProps`, `getStaticPaths`):**
    ```typescript
    // process.env.NEXT_PUBLIC_YOUR_PUBLIC_API_KEY
    ```
    **Important**: Never expose sensitive API keys or credentials directly in your client-side code. Only use `NEXT_PUBLIC_` for non-sensitive public variables.

---

## 4. Deployment Process

Cloudflare Pages integrates seamlessly with Git providers (GitHub, GitLab, Bitbucket).

### Steps to Deploy:

1.  **Push to Git Repository**: Ensure your project is pushed to a Git repository.
2.  **Connect to Cloudflare Pages**:
    *   Log in to your Cloudflare dashboard.
    *   Go to **Pages** and click "Create a project".
    *   Connect your Git account and select the repository containing your Next.js project.
    *   **Configure Build Settings**:
        *   **Framework preset**: Select `Next.js`. Cloudflare will automatically try to detect the correct build command and publish directory. **However, since you have `cloudflare-pages.json`, it will prioritize the settings defined there.**
        *   Verify that the **Build command** is `npm run build`.
        *   Verify that the **Publish directory** is `out`.
    *   Click "Save and Deploy".
3.  **Automatic Deployments**:
    *   Once connected, Cloudflare Pages will automatically deploy your project every time you push new commits to your configured production branch (e.g., `main` or `master`).
    *   You can monitor deployment status and view logs directly from the Cloudflare Pages dashboard.

---

This setup provides a robust and automated deployment pipeline for your Next.js application to Cloudflare Pages.
