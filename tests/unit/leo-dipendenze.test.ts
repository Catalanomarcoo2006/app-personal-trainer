import { describe, expect, it } from "vitest";
import { datiIniziali } from "@/libs/dati/iniziali";
import type { AzioneLeo, DatiLeo } from "@/libs/prototipo/leo-azioni";
import { conClienteCitato, dipendeDaNuovo, ordinaNuoviPrima, risolviDipendenza, sulNuovoCliente } from "@/libs/prototipo/leo-dipendenze";

const nuovo = { nome: "nuovo_cliente", dati: { nome: "Marta Nerini", genere: "donna" } } as AzioneLeo;
const seduta = { nome: "fissa_appuntamento", dati: { cliente: "Marta Nerini", data: "2026-10-23", ora: "10:00", durata: 60, tipo: "Workout" } } as AzioneLeo;
const messaggio = { nome: "scrivi_messaggio", dati: { cliente: "Marta", testo: "Benvenuta!" } } as AzioneLeo;
const altro = { nome: "fissa_appuntamento", dati: { cliente: "Sara Conti", data: "2026-10-23", ora: "11:00", durata: 60, tipo: "Workout" } } as AzioneLeo;
const d: DatiLeo = { sedute: [], dati: datiIniziali() };
const nuovi = [{ key: "5-1", nome: "Marta Nerini" }];
const elenco = [...d.dati.clienti.map((c) => ({ id: c.id, name: c.name })), { id: "marta-nerini", name: "Marta Nerini" }];

describe("azioni su un cliente che l'AI ha chiesto di creare nella stessa frase", () => {
  it("il nuovo cliente passa davanti alle altre azioni, il resto resta in ordine", () => {
    const ordinate = ordinaNuoviPrima([seduta, altro, nuovo]);
    expect(ordinate.map((a) => a.nome)).toEqual(["nuovo_cliente", "fissa_appuntamento", "fissa_appuntamento"]);
    expect(ordinate[1]).toBe(seduta);
  });

  it("riconosce le azioni che citano il nuovo cliente (nome e cognome o solo nome), non gli altri", () => {
    expect(dipendeDaNuovo(seduta, nuovi)).toEqual(nuovi[0]);
    expect(dipendeDaNuovo(messaggio, nuovi)).toEqual(nuovi[0]);
    expect(dipendeDaNuovo(altro, nuovi)).toBeUndefined();
    expect(dipendeDaNuovo(nuovo, nuovi)).toBeUndefined();
    expect(dipendeDaNuovo({ nome: "cambia_aspetto", dati: { tema: "scuro" } } as AzioneLeo, nuovi)).toBeUndefined();
  });

  it("la scheda provvisoria ha il nome vero del nuovo cliente nel titolo", () => {
    const { azione, titolo } = sulNuovoCliente(seduta, nuovi[0], d);
    expect(titolo).toContain("Marta Nerini");
    expect(azione).toMatchObject({ dati: { cliente: "5-1" } });
  });

  it("a cliente creato l'azione trova l'id vero, anche se il trainer ha cambiato il nome nella scheda", () => {
    expect(risolviDipendenza(seduta, { azione: nuovo, stato: "fatto" }, elenco)).toMatchObject({ azione: { dati: { cliente: "marta-nerini" } } });
    // dal segnaposto "5-1" (il nome sta nella scheda del nuovo cliente, qui già cambiato)
    expect(risolviDipendenza(conClienteCitato(seduta, "5-1"), { azione: nuovo, stato: "fatto" }, elenco)).toMatchObject({ azione: { dati: { cliente: "marta-nerini" } } });
  });

  it("se il nuovo cliente non è stato creato, l'azione non parte", () => {
    expect(risolviDipendenza(seduta, { azione: nuovo, stato: "annullato" }, elenco)).toEqual({ motivo: "Il nuovo cliente non è stato creato" });
    expect(risolviDipendenza(seduta, undefined, elenco)).toEqual({ motivo: "Il nuovo cliente non è stato creato" });
    expect(risolviDipendenza(seduta, { azione: nuovo, stato: "fatto" }, elenco.slice(0, -1))).toEqual({ motivo: "Cliente non trovato" });
  });
});
