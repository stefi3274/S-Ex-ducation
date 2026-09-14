"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { ENTREPRISE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function AdminLogin() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.session) {
      setError("Identifiants incorrects.");
      setLoading(false);
      return;
    }

    // Ce compte Supabase est partagé entre plusieurs projets : on
    // vérifie ici que l'utilisateur connecté est bien déclaré comme
    // admin de S-Ex-ducation, pas d'un autre projet.
    const { data: admin } = await supabase
      .from("admins")
      .select("entreprise")
      .eq("id", data.session.user.id)
      .eq("entreprise", ENTREPRISE)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      setError("Ce compte n'est pas autorisé sur S-Ex-ducation.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/admin");
  }

  return (
    <div className="wrap admin-auth">
      <a href="/" className="back-link">
        ← Retour
      </a>
      <h1>Connexion admin</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
