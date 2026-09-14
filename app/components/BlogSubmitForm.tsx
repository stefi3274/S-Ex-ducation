"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { ENTREPRISE, CATEGORIES } from "@/lib/config";
import { slugify } from "@/lib/slug";

export default function BlogSubmitForm() {
  const [titre, setTitre] = useState("");
  const [extrait, setExtrait] = useState("");
  const [contenu, setContenu] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0].slug);
  const [auteurNom, setAuteurNom] = useState("");
  const [auteurEmail, setAuteurEmail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnvoi(true);

    try {
      const supabase = getSupabase();
      let image_couverture_url: string | null = null;

      if (image) {
        const path = `blog-soumissions/${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from("sexed")
          .upload(path, image);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("sexed").getPublicUrl(path);
        image_couverture_url = data.publicUrl;
      }

      const slug = `${slugify(titre)}-${Date.now().toString().slice(-5)}`;

      const { error: insertError } = await supabase.from("blogs").insert({
        entreprise: ENTREPRISE,
        titre: titre.trim(),
        slug,
        extrait: extrait || null,
        contenu,
        categorie,
        auteur_nom: auteurNom || null,
        auteur_email: auteurEmail || null,
        image_couverture_url,
        statut: "soumis",
      });

      if (insertError) throw insertError;

      setEnvoye(true);
    } catch (err) {
      setError("Impossible d'envoyer l'article. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  }

  if (envoye) {
    return (
      <p className="form-success">
        Article envoyé. Il sera relu avant publication, on te tient au
        courant par email.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <label>Titre</label>
      <input
        type="text"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        required
      />

      <label>Résumé court (affiché dans la liste)</label>
      <textarea
        value={extrait}
        onChange={(e) => setExtrait(e.target.value)}
      />

      <label>Contenu de l&apos;article</label>
      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        style={{ minHeight: 240 }}
        placeholder="Sépare les paragraphes par une ligne vide."
        required
      />

      <label>Catégorie</label>
      <select
        value={categorie}
        onChange={(e) => setCategorie(e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.nom}
          </option>
        ))}
      </select>

      <label>Ton nom (ou pseudo)</label>
      <input
        type="text"
        value={auteurNom}
        onChange={(e) => setAuteurNom(e.target.value)}
      />

      <label>Ton email (pour te répondre)</label>
      <input
        type="email"
        value={auteurEmail}
        onChange={(e) => setAuteurEmail(e.target.value)}
        required
      />

      <label>Image de couverture (optionnelle)</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] ?? null)}
      />

      {error && <p className="admin-error">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={envoi}>
        {envoi ? "Envoi..." : "Envoyer pour relecture"}
      </button>
    </form>
  );
}
