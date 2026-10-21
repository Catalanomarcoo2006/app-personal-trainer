// Fotografa l'app del cliente: vista telefono, poi assistente aperto con una domanda.
// Uso: node scripts/foto-cliente.mjs <cartella-uscita>
import { chromium } from "@playwright/test";

const dir = process.argv[2] ?? ".";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto("http://localhost:3100/prototipo/cliente", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${dir}/cliente-1.png` });

await page.locator("div.overflow-y-auto").first().evaluate((el) => el.scrollTo(0, 99999));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${dir}/cliente-2.png` });

await page.getByRole("button", { name: "Apri l'assistente" }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Mi fa male il ginocchio" }).click();
await page.waitForTimeout(4500);
await page.screenshot({ path: `${dir}/cliente-3.png` });

await browser.close();
console.log(errors.length ? `ERRORI:\n${errors.join("\n")}` : "nessun errore in console");
