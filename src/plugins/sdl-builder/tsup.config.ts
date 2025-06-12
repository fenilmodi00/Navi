export default {
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  splitting: false,
  minify: false,
};
