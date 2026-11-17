// Le email dell'app, in italiano: invito e link d'accesso del cliente (con il nome, il colore e il logo del suo
// trainer), invito e password dimenticata del trainer. Funzioni pure: tornano oggetto, testo e HTML (le provano i test).
// L'HTML è semplice e con gli stili in linea: le app della posta (Gmail, Outlook, Mail) ignorano i fogli di stile.

export type Email = { oggetto: string; testo: string; html: string };

type Marchio = { nome: string; colore: string; logo?: string };

const sicuro = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const coloreValido = (c: string) => (/^#[0-9A-Fa-f]{6}$/.test(c) ? c : "#FF6B2C");

function pagina(o: { marchio: Marchio; ciao: string; righe: string[]; tasto: string; link: string; nota: string }): string {
  const colore = coloreValido(o.marchio.colore);
  const testa = o.marchio.logo
    ? `<img src="${sicuro(o.marchio.logo)}" alt="${sicuro(o.marchio.nome)}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;border-radius:14px;background:#ffffff">`
    : `<div style="width:56px;height:56px;border-radius:28px;background:${colore};color:#ffffff;font-size:24px;font-weight:700;line-height:56px;text-align:center">${sicuro(o.marchio.nome.charAt(0).toUpperCase())}</div>`;
  return `<!doctype html>
<html lang="it"><body style="margin:0;padding:0;background:#f4f4f2">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2;padding:32px 12px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1d1b">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;padding:28px">
<tr><td>${testa}</td></tr>
<tr><td style="padding-top:18px;font-size:13px;color:#77776f">${sicuro(o.marchio.nome)}</td></tr>
<tr><td style="padding-top:6px;font-size:20px;font-weight:700">${sicuro(o.ciao)}</td></tr>
${o.righe.map((r) => `<tr><td style="padding-top:10px;font-size:15px;line-height:1.5">${sicuro(r)}</td></tr>`).join("\n")}
<tr><td style="padding-top:22px"><a href="${sicuro(o.link)}" style="display:inline-block;background:${colore};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px">${sicuro(o.tasto)}</a></td></tr>
<tr><td style="padding-top:22px;font-size:12px;line-height:1.5;color:#77776f">${sicuro(o.nota)}</td></tr>
<tr><td style="padding-top:8px;font-size:11px;line-height:1.5;color:#a3a39b;word-break:break-all">Se il tasto non funziona, copia questo indirizzo nel browser: ${sicuro(o.link)}</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const testo = (ciao: string, righe: string[], link: string, nota: string) => [ciao, "", ...righe, "", link, "", nota].join("\n");

// Il trainer invita il cliente nell'app (primo accesso).
export function invitoCliente(o: { nome: string; trainer: Marchio; link: string }): Email {
  const ciao = `Ciao ${o.nome}!`;
  const righe = [`${o.trainer.nome} ti ha invitato nella sua app: la tua scheda, i tuoi progressi e i messaggi, tutto in un posto.`, "Apri il link dal telefono: entri senza password."];
  const nota = "Il link vale 24 ore e si usa una volta sola. Se scade, chiedine uno nuovo dalla pagina d'accesso.";
  return { oggetto: `La tua app con ${o.trainer.nome}`, testo: testo(ciao, righe, o.link, nota), html: pagina({ marchio: o.trainer, ciao, righe, tasto: "Entra nell'app", link: o.link, nota }) };
}

// Il cliente chiede il link per entrare (dalla pagina /<slug>).
export function accessoCliente(o: { nome: string; trainer: Marchio; link: string }): Email {
  const ciao = `Ciao ${o.nome}!`;
  const righe = ["Ecco il link per entrare nella tua app. Aprilo dal telefono: non serve la password."];
  const nota = "Il link vale un'ora e si usa una volta sola. Se non l'hai chiesto tu, ignora questa email: senza il link nessuno entra.";
  return { oggetto: `Il tuo link per entrare · ${o.trainer.nome}`, testo: testo(ciao, righe, o.link, nota), html: pagina({ marchio: o.trainer, ciao, righe, tasto: "Entra nell'app", link: o.link, nota }) };
}

// Marco crea l'account di un trainer: si sceglie la password.
export function invitoTrainer(o: { nome: string; prodotto: string; link: string }): Email {
  const ciao = `Ciao ${o.nome}!`;
  const righe = [`Il tuo account su ${o.prodotto} è pronto.`, "Apri il link per scegliere la password: da lì entri nella tua area e puoi aggiungere i primi clienti."];
  const nota = "Il link vale 24 ore. Se scade, scrivimi e te ne mando uno nuovo.";
  const marchio = { nome: o.prodotto, colore: "#FF6B2C" };
  return { oggetto: `Il tuo account su ${o.prodotto}`, testo: testo(ciao, righe, o.link, nota), html: pagina({ marchio, ciao, righe, tasto: "Scegli la password", link: o.link, nota }) };
}

// "Password dimenticata" del trainer.
export function nuovaPassword(o: { prodotto: string; link: string }): Email {
  const ciao = "Nuova password";
  const righe = ["Hai chiesto di cambiare la password. Apri il link per sceglierne una nuova."];
  const nota = "Il link vale un'ora. Se non l'hai chiesto tu, ignora questa email: la password resta quella di prima.";
  const marchio = { nome: o.prodotto, colore: "#FF6B2C" };
  return { oggetto: `Scegli una nuova password · ${o.prodotto}`, testo: testo(ciao, righe, o.link, nota), html: pagina({ marchio, ciao, righe, tasto: "Scegli la password", link: o.link, nota }) };
}

// Gli avvisi del trainer (dolori, richieste di spostamento, pacchetti che finiscono), secondo le sue notifiche.
export function avvisiTrainer(o: { nome: string; prodotto: string; righe: string[]; link: string }): Email {
  const ciao = `Ciao ${o.nome}, ${o.righe.length === 1 ? "c'è una novità" : `ci sono ${o.righe.length} novità`}`;
  const nota = "Ricevi queste email perché le hai accese nelle Impostazioni (Notifiche): da lì puoi spegnerle.";
  const marchio = { nome: o.prodotto, colore: "#FF6B2C" };
  const oggetto = o.righe.length === 1 ? o.righe[0].replace(/:.*$/, "") : `${o.righe.length} novità dai tuoi clienti`;
  return { oggetto, testo: testo(ciao, o.righe, o.link, nota), html: pagina({ marchio, ciao, righe: o.righe, tasto: "Apri la tua area", link: o.link, nota }) };
}

// Il riepilogo del lunedì: sedute e incassi.
export function riepilogoLunedi(o: { nome: string; prodotto: string; righe: string[]; link: string }): Email {
  const ciao = `Buon lunedì ${o.nome}!`;
  const nota = "Ricevi il riepilogo perché l'hai acceso nelle Impostazioni (Notifiche): da lì puoi spegnerlo.";
  const marchio = { nome: o.prodotto, colore: "#FF6B2C" };
  return { oggetto: "La tua settimana", testo: testo(ciao, o.righe, o.link, nota), html: pagina({ marchio, ciao, righe: o.righe, tasto: "Apri la tua area", link: o.link, nota }) };
}

// Il mittente: l'indirizzo di EMAIL_FROM (dominio verificato su Resend) con il nome di chi scrive.
// "Spotter <ciao@spotter.it>" + "Marco Rossi" → "Marco Rossi <ciao@spotter.it>"
export function mittente(da: string, nome?: string): string {
  const indirizzo = da.match(/<([^>]+)>/)?.[1] ?? da.trim();
  if (!nome) return da.trim();
  return `${nome.replace(/["<>\r\n]/g, "").trim()} <${indirizzo}>`;
}
