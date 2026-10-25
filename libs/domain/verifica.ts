// L'esito di un controllo: va bene, oppure non va bene con il motivo in italiano da mostrare al trainer.

export type Verifica = { ok: true } | { ok: false; motivo: string };

export const OK: Verifica = { ok: true };
export const no = (motivo: string): Verifica => ({ ok: false, motivo });
