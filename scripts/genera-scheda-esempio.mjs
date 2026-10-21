// Genera public/prototipo/scheda-esempio.pdf: la scheda che il trainer "carica" nella demo.
// Uso: node scripts/genera-scheda-esempio.mjs
import { chromium } from "@playwright/test";

const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; color: #1c1c1e; margin: 48px; }
  h1 { font-size: 24px; margin: 0; } .sub { color: #777; margin: 6px 0 28px; font-size: 13px; }
  h2 { font-size: 16px; margin: 26px 0 8px; color: #ff6b2c; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: #888; font-weight: 600; border-bottom: 1px solid #ddd; padding: 6px 4px; }
  td { padding: 8px 4px; border-bottom: 1px solid #f0f0f0; }
  .note { margin-top: 30px; font-size: 12px; color: #777; }
</style></head><body>
  <h1>Scheda di allenamento</h1>
  <p class="sub">Cliente: Antonella Russo · Preparata da Marco Rossi · Ottobre 2026</p>
  <h2>Giorno A · Forza total body</h2>
  <table><tr><th>Esercizio</th><th>Serie x rip.</th><th>Carico</th><th>Recupero</th></tr>
    <tr><td>Goblet squat</td><td>4 x 12</td><td>16 kg</td><td>75''</td></tr>
    <tr><td>Panca piana</td><td>4 x 8</td><td>30 kg</td><td>90''</td></tr>
    <tr><td>Rematore con manubrio</td><td>3 x 12</td><td>12 kg</td><td>75''</td></tr>
    <tr><td>Hip thrust</td><td>4 x 10</td><td>40 kg</td><td>90''</td></tr>
  </table>
  <h2>Giorno B · Cardio e core</h2>
  <table><tr><th>Esercizio</th><th>Serie x rip.</th><th>Carico</th><th>Recupero</th></tr>
    <tr><td>Bike a intervalli</td><td>8 x 30''</td><td>—</td><td>60''</td></tr>
    <tr><td>Dead bug</td><td>3 x 12</td><td>corpo libero</td><td>45''</td></tr>
    <tr><td>Plank laterale</td><td>3 x 30''</td><td>corpo libero</td><td>45''</td></tr>
  </table>
  <p class="note">Riscaldamento di 10 minuti prima di ogni seduta. In caso di dolore fermarsi e avvisare il trainer.</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({ path: "public/prototipo/scheda-esempio.pdf", format: "A4" });
await browser.close();
console.log("creato public/prototipo/scheda-esempio.pdf");
