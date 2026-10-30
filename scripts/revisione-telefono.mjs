// Fotografa le due app da telefono, ogni sezione, chiaro e scuro, per la revisione del frontend.
// Uso: node revisione.mjs <cartella-uscita>   (server su http://localhost:3100)
import { chromium } from "@playwright/test";

const dir = process.argv[2] ?? ".";
const B = process.env.BASE ?? "http://127.0.0.1:3100";
const browser = await chromium.launch({ channel: "msedge" });
const errori = [];

async function nuova(tema) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript((t) => {
    localStorage.setItem("benvenuto", JSON.stringify({ v: 1, fatto: true }));
    localStorage.setItem("registrazione-cliente", "fatta");
    localStorage.setItem("tema", t);
  }, tema);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errori.push(`[${tema}] ${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errori.push(`[${tema}] ${p.url()} ${m.text()}`));
  return { ctx, p };
}

async function scatta(p, nome) {
  await p.waitForTimeout(1300);
  await p.screenshot({ path: `${dir}/${nome}.png` });
}

async function scorriGiu(p) {
  await p.evaluate(() => {
    const el = [...document.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.clientHeight - a.clientHeight)[0];
    (el ?? document.scrollingElement).scrollTo(0, 99999);
  });
}

async function tocca(p, testo) {
  const b = p.locator("nav button, nav a").filter({ hasText: testo }).first();
  await b.click();
}

for (const tema of ["light", "dark"]) {
  const t = tema === "light" ? "chiaro" : "scuro";

  // App del cliente
  {
    const { ctx, p } = await nuova(tema);
    await p.goto(`${B}/prototipo/cliente`, { waitUntil: "networkidle" });
    await p.waitForTimeout(6000); // animazione d'apertura
    await scatta(p, `cliente-${t}-01-home`);
    await scorriGiu(p);
    await scatta(p, `cliente-${t}-02-home-fondo`);
    for (const [i, s] of [["03", "Allenamento"], ["04", "Progressi"], ["05", "Messaggi"]]) {
      await tocca(p, s);
      await scatta(p, `cliente-${t}-${i}-${s.toLowerCase()}`);
      if (s !== "Messaggi") { await scorriGiu(p); await scatta(p, `cliente-${t}-${i}b-${s.toLowerCase()}-fondo`); }
    }
    await p.goto(`${B}/prototipo/cliente/profilo`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await scatta(p, `cliente-${t}-06-profilo`);
    await ctx.close();
  }

  // Trainer da telefono
  {
    const { ctx, p } = await nuova(tema);
    await p.goto(`${B}/prototipo/trainer?telefono`, { waitUntil: "networkidle" });
    await p.waitForTimeout(6000);
    await scatta(p, `trainer-${t}-01-oggi`);
    await scorriGiu(p);
    await scatta(p, `trainer-${t}-02-oggi-fondo`);
    for (const [i, s] of [["03", "Clienti"], ["04", "Messaggi"], ["05", "Calendario"]]) {
      await tocca(p, s);
      await scatta(p, `trainer-${t}-${i}-${s.toLowerCase()}`);
    }
    await tocca(p, "Clienti");
    await p.waitForTimeout(800);
    const primo = p.getByText("Antonella Russo").first();
    if (await primo.count()) { await primo.click(); await scatta(p, `trainer-${t}-06-scheda-cliente`); }
    await ctx.close();
  }
}

await browser.close();
console.log(errori.length ? `ERRORI:\n${[...new Set(errori)].join("\n")}` : "nessun errore in console");
