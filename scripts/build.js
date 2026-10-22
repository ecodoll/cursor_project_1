const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "icons"), { recursive: true });

const html = fs.readFileSync(path.join(root, "couple_household_book.html"));
fs.writeFileSync(path.join(dist, "index.html"), html);
fs.writeFileSync(path.join(root, "index.html"), html);
fs.copyFileSync(path.join(root, "manifest.webmanifest"), path.join(dist, "manifest.webmanifest"));

for (const name of fs.readdirSync(path.join(root, "icons"))) {
  fs.copyFileSync(path.join(root, "icons", name), path.join(dist, "icons", name));
}
