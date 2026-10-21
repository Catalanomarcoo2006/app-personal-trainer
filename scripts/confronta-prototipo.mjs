// Fotografa il prototipo del trainer alla stessa dimensione del riferimento.
// Uso: node scripts/confronta-prototipo.mjs [url] [file-di-uscita]
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://localhost:3100/prototipo/trainer";
const out = process.argv[3] ?? "confronto-trainer.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1303, height: 778 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // fine delle animazioni d'ingresso
await page.screenshot({ path: out });
await browser.close();
console.log(errors.length ? `ERRORI:\n${errors.join("\n")}` : "nessun errore in console");
