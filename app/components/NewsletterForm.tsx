"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { ENTREPRISE } from "@/lib/config";

type Statut = "idle" | "envoi" | "ok" | "deja" | "erreur";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState<Statut>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatut("envoi");

    const supabase = getSupabase();
    const { error } = await supabase
      .from("abonnes")
      .insert({ entreprise: ENTREPRISE, email });

    if (error) {
      setStatut(error.code === "23505" ? "deja" : "erreur");
      return;
    }

    setStatut("ok");
    setEmail("");
  }

  return (
    <div className="newsletter-block">
      <h3>Ne rate rien</h3>
      <p>Reçois les nouveaux posts par email, sans spam.</p>
      <form onSubmit={handleSubmit} className="newsletter-form">
        <input
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={statut === "envoi"}
        >
          {statut === "envoi" ? "..." : "S'abonner"}
        </button>
      </form>
      {statut === "ok" && (
        <p className="newsletter-msg">Inscription confirmée.</p>
      )}
      {statut === "deja" && (
        <p className="newsletter-msg">Tu es déjà inscrit·e.</p>
      )}
      {statut === "erreur" && (
        <p className="admin-error">Une erreur est survenue. Réessaie.</p>
      )}
    </div>
  );
}
