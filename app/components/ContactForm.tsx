"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { ENTREPRISE } from "@/lib/config";

export default function ContactForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnvoi(true);

    const supabase = getSupabase();
    const { error: insertError } = await supabase.from("contacts").insert({
      entreprise: ENTREPRISE,
      nom: nom || null,
      email,
      message,
    });

    setEnvoi(false);

    if (insertError) {
      setError("Impossible d'envoyer le message. Réessaie.");
      return;
    }

    setEnvoye(true);
    setNom("");
    setEmail("");
    setMessage("");
  }

  if (envoye) {
    return (
      <p className="form-success">
        Message envoyé. On te répond bientôt sur {email || "ton email"}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <label>Nom (optionnel)</label>
      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
      />
      <label>Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label>Message</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      {error && <p className="admin-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={envoi}>
        {envoi ? "Envoi..." : "Envoyer"}
      </button>
    </form>
  );
}
