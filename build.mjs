import { buildSync } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";

await fs.rm("./dist/", { recursive: true, force: true });
await fs.mkdir("./dist/");

buildSync({
    entryPoints: ["./src/index.js"],
    bundle: true,
    outdir: "./dist",
    assetNames: "[name]",
    define: {
        "import.meta.url": "window.location"
    },
    loader: {
        ".wasm": "copy"
    }
});

for (const file of await fs.readdir("./static", { recursive: true })) {
    const inPath = path.join("./static", file);
    const outPath = path.join("./dist", file);
    if ((await fs.lstat(inPath)).isDirectory()) {
        await fs.mkdir(outPath);
    } else {
        await fs.copyFile(inPath, outPath);
    }
}

