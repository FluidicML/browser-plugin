import { defineConfig } from "vite"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"
import { resolve } from "path"
import fs from "fs"
import path from "path"

function generateContentScripts() {
  const contentScriptsDir = path.resolve(__dirname, "src/entrypoints")
  const contentScripts = fs
    .readdirSync(contentScriptsDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => ({
      matches: ["<all_urls>"],
      js: [`src/entrypoints/${file}`],
    }))
  return contentScripts
}

export default defineConfig({
  resolve: {
    alias: {
      $: resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  plugins: [
    {
      name: "dynamic-manifest",
      apply: "build",
      generateBundle(_, bundle) {
        const manifest = {
          manifest_version: 3,
          name: "Fluidic Workflows",
          version: "1.0",
          action: { default_title: "Click to open sidebar" },
          permissions: ["storage", "tabs", "activeTab", "scripting"],
          host_permissions: ["<all_urls>"],
          content_scripts: generateContentScripts(),
        }
        this.emitFile({
          type: "asset",
          fileName: "manifest.json",
          source: JSON.stringify(manifest, null, 2),
        })
      },
    },
  ],
})
