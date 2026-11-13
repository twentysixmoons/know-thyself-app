// TanStack Start's SPA build emits its prerendered shell as `_shell.html`.
// Static hosts expect `index.html`, and a `404.html` copy gives SPA-fallback
// on GitHub Pages (and keeps unknown paths on Netlify from hard-failing).
import { copyFileSync } from "node:fs";
import { join } from "node:path";

const client = join(process.cwd(), "dist", "client");
for (const name of ["index.html", "404.html"]) {
  copyFileSync(join(client, "_shell.html"), join(client, name));
}
console.log("spa-postbuild: wrote dist/client/index.html and 404.html");
