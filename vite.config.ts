// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Only activate the Nitro Vercel preset during production builds.
// This avoids plugin conflicts with Vite HMR in dev mode.
const isBuild = process.argv.some((a) => a === "build");

export default defineConfig({
  cloudflare: false,
  vite: {
    plugins: isBuild ? [nitro({ preset: "vercel" })] : [],
  },
});
