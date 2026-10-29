# Chiavi e servizi

Elenco delle chiavi API del progetto: **quali esistono e dove sono usate, mai i valori**.
I valori stanno solo in `.env.local` (sul computer di Marco, escluso da git) e nelle Environment Variables di Vercel.
Aggiornare questa tabella ogni volta che si crea, si sposta o si cancella una chiave.

**Ultimo aggiornamento:** 2026-10-29

## Chiavi attive

| Servizio | Nome della chiave sul servizio | Variabile | Dove è usata | Creata |
|---|---|---|---|---|
| DeepSeek (AI di Leo) | quella del computer | `AI_API_KEY` | `.env.local` sul PC di Marco | 22/10/2026 |
| DeepSeek (AI di Leo) | `vercel-online` | `AI_API_KEY` | Vercel → progetto `app-personal-trainer` → Environment Variables → Production (tipo Secret) | 23/10/2026 |
| Supabase, progetto `Spotter` (West EU) | Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Vercel, Production e Preview (non segreta) | 29/10/2026 |
| Supabase, progetto `Spotter` | Publishable key `default` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel, Production e Preview (pubblica per natura: decide la RLS) | 29/10/2026 |
| Supabase, progetto `Spotter` | Secret key `vercel-online` | `SUPABASE_SERVICE_ROLE_KEY` | Vercel, solo Production (Sensitive). La secret `default` non è usata da nessuna parte | 29/10/2026 |

Le stesse variabili `AI_*` servono a **due rotte**: Leo del trainer (`app/prototipo/api/leo`) e, dal 28/10, Leo del cliente (`app/prototipo/api/leo-cliente`). Nessuna chiave nuova: si usa quella che c'è già (sul computer e su Vercel). Le due rotte sono aperte a chiunque abbia l'indirizzo: tenere un limite di spesa sul pannello di DeepSeek.

## Da creare più avanti

| Servizio | Variabili | Quando |
|---|---|---|
| Resend (email) | `RESEND_API_KEY` | Fase 5, avvisi email |
| Fornitore AI in UE | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Prima del primo cliente vero: con dati veri DeepSeek non si usa |
| Trascrizione della voce in UE (vocali a Leo) | `AI_STT_BASE_URL`, `AI_STT_API_KEY`, `AI_STT_MODEL` | Prima dei vocali con clienti veri; oggi i vocali usano la dettatura del browser (solo dati finti) |

## Regole

- Una chiave per ogni posto (computer, Vercel, ...): se una si compromette si cancella solo quella.
- Mai in chat, email, WhatsApp, note, Word, Obsidian o GitHub. Se serve conservarla, solo in un gestore di password (per esempio Bitwarden).
- Se una chiave finisce dove non doveva: cancellarla subito dal pannello del servizio, crearne una nuova e aggiornare questa tabella.
- Dopo aver cambiato una variabile su Vercel serve una nuova pubblicazione (Deployments → Redeploy, oppure un push su `setup-iniziale`).

## Dove si gestiscono

- **DeepSeek:** platform.deepseek.com → API keys (credito prepagato: Top up; consumi: Usage).
- **Vercel:** vercel.com → progetto `app-personal-trainer` → Settings → Environment Variables.
- **Computer:** file `.env.local` nella cartella del progetto (si apre con VS Code o Blocco note).
