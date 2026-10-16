import { build } from "esbuild";
await build({
  entryPoints: ["src/sw.ts"],
  bundle: true,
  minify: true,
  outfile: "public/sw.js",
  format: "iife",
  target: "es2020",
});
