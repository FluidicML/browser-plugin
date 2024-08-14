import { defineConfig } from "wxt"
import tailwindcss from "tailwindcss"
import autoprefixer from "autoprefixer"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    action: { default_title: "Click to open sidebar" },
    permissions: [
      "scripting",
      "storage",
      "tabs",
      "activeTab",
      "sidePanel",
      "http://localhost/*", // TODO(@morganhowell95): Move to build arg .env
    ],
    // externally_connectable: ["http://localhost/*"], // TODO(@morganhowell95): Move to build arg .env
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
        "@": __dirname,
      },
      extensions: [".tsx", ".ts", ".jsx", ".js", ".css"],
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
  }),
  outDir: "dist",
})
