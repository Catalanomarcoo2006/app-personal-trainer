"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import AuthCard from "@/components/auth/AuthCard";
import { createClient } from "@/libs/supabase/client";
import { getAccess, homeOf } from "@/libs/auth/profile";

// Accesso di trainer e admin: email e password, con "password dimenticata".
// I clienti non passano da qui: entrano dal link via email, sulla pagina del loro trainer.
function Accesso() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const linkScaduto = params.get("errore") === "link";
  const [trainer, setTrainer] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [attesa, setAttesa] = useState(false);

  const entra = async (e: FormEvent) => {
    e.preventDefault();
    setAttesa(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setAttesa(false);
      toast.error(error.message === "Invalid login credentials" ? "Email o password non corrette" : "Accesso non riuscito, riprova");
      return;
    }
    router.replace(homeOf(await getAccess(supabase)));
    router.refresh();
  };

  const dimenticata = async () => {
    if (!email.trim()) {
      toast.error("Scrivi prima la tua email");
      return;
    }
    setAttesa(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/nuova-password`,
    });
    setAttesa(false);
    // stessa risposta che l'email esista o no: non si rivela chi è registrato
    toast.success("Se l'email è registrata, ti abbiamo mandato un link per scegliere una nuova password");
  };

  // dalla pagina d'ingresso, "App del cliente": il cliente entra dalla pagina del suo trainer
  if (params.has("cliente"))
    return (
      <AuthCard title="App del cliente" subtitle="Apri il link che ti ha mandato il tuo trainer, oppure scrivi qui il suo indirizzo.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const slug = trainer.trim().toLowerCase().replace(/^.*\//, "");
            if (slug) router.push(`/${slug}`);
          }}
          className="space-y-3"
        >
          <input required placeholder="nome-del-trainer" className="input input-bordered w-full rounded-2xl" value={trainer} onChange={(e) => setTrainer(e.target.value)} />
          <button type="submit" className="btn btn-trainer w-full rounded-2xl border-0">
            Vai
          </button>
        </form>
      </AuthCard>
    );

  return (
    <AuthCard
      title="Accedi"
      subtitle={linkScaduto ? "Il link è scaduto o è già stato usato: accedi con la password o chiedine uno nuovo." : "L'area del personal trainer"}
    >
      <form onSubmit={entra} className="space-y-3">
        <input
          required
          type="email"
          autoComplete="email"
          placeholder="Email"
          className="input input-bordered w-full rounded-2xl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          className="input input-bordered w-full rounded-2xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-trainer w-full rounded-2xl border-0" disabled={attesa}>
          {attesa && <span className="loading loading-spinner loading-xs" />}
          Entra
        </button>
      </form>
      <button type="button" onClick={dimenticata} disabled={attesa} className="mt-4 w-full text-center text-sm text-muted hover:text-ink">
        Password dimenticata?
      </button>
      <p className="mt-8 text-center text-xs text-muted">Sei un cliente? Apri il link d&apos;accesso che ti ha mandato il tuo trainer.</p>
    </AuthCard>
  );
}

export default function Login() {
  return (
    <Suspense>
      <Accesso />
    </Suspense>
  );
}
