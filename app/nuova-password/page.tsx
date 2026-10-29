"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthCard from "@/components/auth/AuthCard";
import { createClient } from "@/libs/supabase/client";
import { getAccess, homeOf } from "@/libs/auth/profile";

const MIN = 8;

// Dopo l'invito di Marco (primo accesso del trainer) o "password dimenticata": si sceglie la password.
export default function NuovaPassword() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [ripeti, setRipeti] = useState("");
  const [attesa, setAttesa] = useState(false);

  const salva = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN) return toast.error(`Almeno ${MIN} caratteri`);
    if (password !== ripeti) return toast.error("Le due password non sono uguali");
    setAttesa(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setAttesa(false);
      toast.error(error.code === "same_password" ? "È uguale a quella di prima: scegline un'altra" : "Il link è scaduto: chiedine uno nuovo dal login");
      return;
    }
    toast.success("Password salvata");
    router.replace(homeOf(await getAccess(supabase)));
    router.refresh();
  };

  return (
    <AuthCard title="Scegli la password" subtitle={`Almeno ${MIN} caratteri. La userai per entrare da computer e da telefono.`}>
      <form onSubmit={salva} className="space-y-3">
        <input
          required
          type="password"
          autoComplete="new-password"
          placeholder="Nuova password"
          className="input input-bordered w-full rounded-2xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          required
          type="password"
          autoComplete="new-password"
          placeholder="Ripeti la password"
          className="input input-bordered w-full rounded-2xl"
          value={ripeti}
          onChange={(e) => setRipeti(e.target.value)}
        />
        <button type="submit" className="btn btn-trainer w-full rounded-2xl border-0" disabled={attesa}>
          {attesa && <span className="loading loading-spinner loading-xs" />}
          Salva e entra
        </button>
      </form>
    </AuthCard>
  );
}
