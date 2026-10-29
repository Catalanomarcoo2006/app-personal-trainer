import AuthCard from "@/components/auth/AuthCard";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({ title: "Accesso sospeso", canonicalUrlRelative: "/sospeso" });

// Trainer con la licenza sospesa, o cliente di un trainer sospeso: i dati restano, l'accesso no.
export default function Sospeso() {
  return (
    <AuthCard title="Accesso sospeso" subtitle="Per ora l'app non è disponibile. Se sei un cliente, contatta il tuo trainer.">
      <form action="/api/auth/signout" method="post">
        <button type="submit" className="btn btn-ghost w-full rounded-2xl">
          Esci
        </button>
      </form>
    </AuthCard>
  );
}
