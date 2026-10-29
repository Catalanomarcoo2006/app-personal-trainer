"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/libs/supabase/client";

// Il cliente entra con il link via email (magic link): niente password da ricordare.
// shouldCreateUser: false → solo i clienti aggiunti dal trainer ricevono il link.
export default function AccessoCliente() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [stato, setStato] = useState<"scrivi" | "attesa" | "inviato">("scrivi");

  const invia = async (e: FormEvent) => {
    e.preventDefault();
    setStato("attesa");
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });
    // stessa risposta che l'email sia di un cliente o no
    setStato("inviato");
  };

  if (stato === "inviato")
    return <p className="text-center text-sm text-ink">Se sei un cliente, ti è arrivata un&apos;email con il link per entrare. Aprila da questo telefono.</p>;

  return (
    <form onSubmit={invia} className="space-y-3">
      <input
        required
        type="email"
        autoComplete="email"
        placeholder="La tua email"
        className="input input-bordered w-full rounded-2xl"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" className="btn btn-trainer w-full rounded-2xl border-0" disabled={stato === "attesa"}>
        {stato === "attesa" && <span className="loading loading-spinner loading-xs" />}
        Mandami il link
      </button>
    </form>
  );
}
