# Dominio ed email: cosa fare quando si compra il dominio

**Stato (20/11/2026):** tutto il codice è pronto e online. Mancano solo il dominio e due chiavi. Finché non ci sono, l'app funziona
lo stesso: gli inviti si mandano copiando il link (tasto "Invita nell'app") e mandandolo su WhatsApp.

## Cosa è già pronto (senza dominio, senza pagare)

- I link nelle email (inviti, accesso del cliente, password dimenticata, avvisi) usano **l'indirizzo da cui l'app è aperta**: col
  dominio nuovo cambiano da soli. Niente da modificare nel codice, né su Supabase.
- Le email (modelli in italiano, mittente col nome del trainer) partono da Resend appena ci sono `RESEND_API_KEY` ed `EMAIL_FROM`.
- Il controllo del mattino (`/api/cron/avvisi`, ore 7) crea gli avvisi dei pacchetti che finiscono anche **senza email**: basta
  `CRON_SECRET`. Gli avvisi compaiono negli Urgenti del trainer.
- L'indirizzo per i motori di ricerca si cambia con la variabile `NEXT_PUBLIC_DOMAIN_NAME` (non serve toccare il codice).

## Quando compri il dominio (5 minuti)

1. **Comprarlo** su Vercel (vercel.com → Domains) o dove vuoi. Il pagamento lo fai tu. Su Vercel il DNS è già gestito lì.
2. **Collegarlo al progetto** `app-personal-trainer`: Settings → Domains → Add. (Lo posso fare io.)
3. **Resend** (account gratuito, senza carta: 3.000 email al mese, 100 al giorno): Domains → Add Domain → scrivi il dominio.
   Resend ti dà 3-4 record DNS. Se il dominio è su Vercel li aggiungo io; altrimenti li inserisci dove hai il dominio.
   Poi su Resend premi **Verify**.
4. **Chiave API**: su Resend → API Keys → Create (permesso "Sending access"). La metti tu su Vercel, mai in chat.
5. **Variabili su Vercel** (Settings → Environment Variables, Production), poi Redeploy:
   - `RESEND_API_KEY` = la chiave del punto 4 (segreta)
   - `EMAIL_FROM` = `Spotter <ciao@tuodominio.it>` (non segreta; il nome del trainer lo aggiunge l'app)
   - `NEXT_PUBLIC_DOMAIN_NAME` = `tuodominio.it` (senza https:// né /)
6. **Prova** (la faccio io): invito a un cliente di prova, accesso del cliente, password dimenticata, avviso di un dolore.

## Da fare adesso (senza dominio)

- `CRON_SECRET` su Vercel (Production, tipo Secret): una stringa lunga a caso. Con questa gli avvisi dei pacchetti partono già
  dalla mattina dopo. La stringa te la preparo io negli appunti; non va scritta in chat.
- Account Resend gratuito (resend.com): si può creare già adesso, il dominio si aggiunge dopo.

## Alternative scartate

- Gmail come mittente: Resend non lo accetta, le email finiscono nello spam e il marchio del trainer non compare.
- Domini gratuiti (`.tk` e simili) e `.vercel.app`: non verificabili su Resend o bloccati dai filtri antispam.
