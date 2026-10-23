# Chiavi e servizi

Elenco delle chiavi API del progetto: **quali esistono e dove sono usate, mai i valori**.
I valori stanno solo in `.env.local` (sul computer di Marco, escluso da git) e nelle Environment Variables di Vercel.
Aggiornare questa tabella ogni volta che si crea, si sposta o si cancella una chiave.

**Ultimo aggiornamento:** 2026-10-23

## Chiavi attive

| Servizio | Nome della chiave sul servizio | Variabile | Dove è usata | Creata |
|---|---|---|---|---|
| DeepSeek (AI di Leo) | quella del computer | `AI_API_KEY` | `.env.local` sul PC di Marco | 22/10/2026 |
| DeepSeek (AI di Leo) | `vercel-online` | `AI_API_KEY` | Vercel → progetto `app-personal-trainer` → Environment Variables → Production (tipo Secret) | 23/10/2026 |

## Da creare più avanti

| Servizio | Variabili | Quando |
|---|---|---|
| Supabase (progetto di sviluppo, regione UE) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Task 3 del piano `docs/plans/2026-10-21-piano-v1.md`; su Vercel ora ci sono valori segnaposto |
| Resend (email) | `RESEND_API_KEY` | Fase 5, avvisi email |
| Fornitore AI in UE | `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Prima del primo cliente vero: con dati veri DeepSeek non si usa |

## Regole

- Una chiave per ogni posto (computer, Vercel, ...): se una si compromette si cancella solo quella.
- Mai in chat, email, WhatsApp, note, Word, Obsidian o GitHub. Se serve conservarla, solo in un gestore di password (per esempio Bitwarden).
- Se una chiave finisce dove non doveva: cancellarla subito dal pannello del servizio, crearne una nuova e aggiornare questa tabella.
- Dopo aver cambiato una variabile su Vercel serve una nuova pubblicazione (Deployments → Redeploy, oppure un push su `setup-iniziale`).

## Dove si gestiscono

- **DeepSeek:** platform.deepseek.com → API keys (credito prepagato: Top up; consumi: Usage).
- **Vercel:** vercel.com → progetto `app-personal-trainer` → Settings → Environment Variables.
- **Computer:** file `.env.local` nella cartella del progetto (si apre con VS Code o Blocco note).
