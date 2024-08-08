import { defineConfig } from "wxt"
import viteConfig from "./vite.config"

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    action: { default_title: "Click to open sidebar" },
    permissions: ["storage", "tabs", "activeTab", "scripting"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => viteConfig,
  outDir: "dist",
  entrypointsDir: "src/entrypoints",
})
