// Next.js static export on Windows writes route segment prefetch files into nested folders
// (out/app/__next.app/__PAGE__.txt) while the client requests flat names
// (out/app/__next.app.__PAGE__.txt). This flattens them. It is a no-op on macOS/Linux.
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.argv[2] || "out");
if (!fs.existsSync(outDir)) process.exit(0);

let moved = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) {
      flatten(full, dir, entry.name);
      fs.rmSync(full, { recursive: true, force: true });
    } else walk(full);
  }
}
function flatten(srcDir, destDir, prefix) {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const full = path.join(srcDir, entry.name);
    const name = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) flatten(full, destDir, name);
    else {
      fs.copyFileSync(full, path.join(destDir, name));
      moved++;
    }
  }
}
walk(outDir);
if (moved) console.log(`fix-export-segments: flattened ${moved} segment file(s)`);
