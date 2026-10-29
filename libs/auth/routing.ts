// Chi può aprire cosa: decide, per ogni richiesta, se lasciar passare o dove mandare l'utente.
// Funzione pura (niente database): il middleware le passa l'accesso letto da Supabase (Task 6, getAccess).

export type Access = {
  role: "admin" | "trainer" | "client" | null;
  trainerActive: boolean; // il trainer collegato ha la licenza attiva
  clientTrainerSlug: string | null; // per un cliente: lo slug del suo trainer, null se il trainer è sospeso
};

export type RouteDecision = { action: "next" } | { action: "redirect"; to: string };

const NEXT: RouteDecision = { action: "next" };
const go = (to: string): RouteDecision => ({ action: "redirect", to });

// Sempre aperte a tutti: API, pagine legali, prototipo, file di Next.
const PUBLIC = ["api", "auth", "privacy-policy", "tos", "prototipo", "_next"];
const PRIVATE = ["dashboard", "admin"];

// Pagine che si aprono senza guardare chi è collegato: il middleware non chiede nemmeno l'accesso al database.
export function isPublicPath(path: string): boolean {
  const first = path.split("/")[1] ?? "";
  return PUBLIC.includes(first) || first === "sospeso";
}

export function resolveRoute(path: string, access: Access): RouteDecision {
  const first = path.split("/")[1] ?? "";
  if (isPublicPath(path)) return NEXT;

  switch (access.role) {
    case null:
      return PRIVATE.includes(first) ? go("/signin") : NEXT;

    case "client":
      // il cliente vive nella pagina del suo trainer; se il trainer è sospeso non legge più nulla
      if (!access.clientTrainerSlug) return go("/sospeso");
      return first === access.clientTrainerSlug ? NEXT : go(`/${access.clientTrainerSlug}`);

    case "trainer":
      if (!access.trainerActive) return go("/sospeso");
      return first === "admin" ? go("/dashboard") : NEXT;

    case "admin":
      return NEXT;
  }
}
