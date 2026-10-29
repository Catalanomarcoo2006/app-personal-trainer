// Il parametro ?next= dei link d'accesso: solo percorsi interni, mai un altro sito ("//sito.it" o "https://…").
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
