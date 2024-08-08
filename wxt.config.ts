import { defineConfig } from "wxt"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import { resolve } from "path"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    action: { default_title: "Click to open sidebar" },
    permissions: ["storage", "tabs", "activeTab", "scripting"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => ({
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    resolve: {
      alias: {
        $: resolve(__dirname, "src"),
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".css"],
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
    },
  }),
  outDir: "dist",
  entrypointsDir: "src/entrypoints",
})
