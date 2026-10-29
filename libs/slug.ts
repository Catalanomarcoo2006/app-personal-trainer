// Lo slug è l'indirizzo dell'app del trainer (app.it/marco-rossi): solo minuscole, cifre e trattini.

// Percorsi già usati dall'app: un trainer non può prenderli.
export const RESERVED_SLUGS = ["dashboard", "admin", "api", "signin", "privacy-policy", "tos", "prototipo", "sospeso", "_next", "auth", "nuova-password", "demo"] as const;

const FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MIN = 3;
const MAX = 40;

// "Marco Rossì" → "marco-rossi": via accenti e maiuscole, ogni altro carattere diventa un trattino.
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateSlug(slug: string): { ok: true } | { ok: false; reason: "riservato" | "formato" } {
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) return { ok: false, reason: "riservato" };
  if (slug.length < MIN || slug.length > MAX || !FORMAT.test(slug)) return { ok: false, reason: "formato" };
  return { ok: true };
}
