"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { ENTREPRISE, CATEGORIES, BLOG_STATUTS } from "@/lib/config";
import { slugify } from "@/lib/slug";
import { parserArticleColle } from "@/lib/parse-article";

export const dynamic = "force-dynamic";

type Statut = "soumis" | "a_revoir" | "rejete" | "publie";

type Article = {
  id: string;
  titre: string;
  sous_titre: string | null;
  slug: string;
  extrait: string | null;
  contenu: string;
  image_couverture_url: string | null;
  categorie: string | null;
  auteur_nom: string | null;
  auteur_email: string | null;
  statut: Statut;
  commentaire_admin: string | null;
  created_at: string;
};

const ONGLETS: { valeur: Statut | "tous"; label: string }[] = [
  { valeur: "soumis", label: "Soumis" },
  { valeur: "a_revoir", label: "À revoir" },
  { valeur: "rejete", label: "Rejetés" },
  { valeur: "publie", label: "Publiés" },
  { valeur: "tous", label: "Tous" },
];

export default function AdminBlogs() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);

  const [session, setSession] = useState<Session | null | undefined>(
    undefined
  );
  const [articles, setArticles] = useState<Article[]>([]);
  const [onglet, setOnglet] = useState<Statut | "tous">("soumis");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [actionEnCours, setActionEnCours] = useState(false);

  const [titre, setTitre] = useState("");
  const [sousTitre, setSousTitre] = useState("");
  const [extrait, setExtrait] = useState("");
  const [contenu, setContenu] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0].slug);
  const [auteurNom, setAuteurNom] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [texteColle, setTexteColle] = useState("");

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from("blogs")
      .select(
        "id, titre, sous_titre, slug, extrait, contenu, image_couverture_url, categorie, auteur_nom, auteur_email, statut, commentaire_admin, created_at"
      )
      .eq("entreprise", ENTREPRISE)
      .order("created_at", { ascending: false });
    setArticles((data as Article[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin/login");
        return;
      }
      setSession(data.session);
      loadArticles();
    });
  }, [router, loadArticles, supabase]);

  function handleRemplirDepuisTexte() {
    const resultat = parserArticleColle(texteColle, CATEGORIES);

    if (resultat.titre) setTitre(resultat.titre);
    if (resultat.sousTitre) setSousTitre(resultat.sousTitre);
    if (resultat.extrait) setExtrait(resultat.extrait);
    if (resultat.categorieSlug) setCategorie(resultat.categorieSlug);
    if (resultat.auteurNom) setAuteurNom(resultat.auteurNom);
    if (resultat.contenu) setContenu(resultat.contenu);
  }

  async function handleCreerArticle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      let image_couverture_url: string | null = null;

      if (image) {
        const path = `blog-admin/${Date.now()}-${image.name}`;
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
        sous_titre: sousTitre || null,
        slug,
        extrait: extrait || null,
        contenu,
        categorie,
        auteur_nom: auteurNom || "Stef",
        statut: "publie",
        image_couverture_url,
      });

      if (insertError) throw insertError;

      setTitre("");
      setSousTitre("");
      setExtrait("");
      setContenu("");
      setAuteurNom("");
      setImage(null);
      await loadArticles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        `Impossible de créer l'article.${message ? ` (${message})` : ""}`
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleChangerStatut(article: Article, statut: Statut) {
    setActionEnCours(true);
    await supabase
      .from("blogs")
      .update({
        statut,
        commentaire_admin:
          statut === "a_revoir" || statut === "rejete"
            ? commentaire || null
            : article.commentaire_admin,
      })
      .eq("id", article.id);
    setCommentaire("");
    setOuvert(null);
    setActionEnCours(false);
    await loadArticles();
  }

  async function handleSupprimer(article: Article) {
    setError(null);
    const { data, error: deleteError } = await supabase
      .from("blogs")
      .delete()
      .eq("id", article.id)
      .select("id");

    if (deleteError) {
      setError(`Impossible de supprimer "${article.titre}" : ${deleteError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError(`"${article.titre}" n'a pas été supprimé. Réessaie.`);
      return;
    }

    await loadArticles();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (session === undefined) return null;

  const articlesAffiches = articles.filter(
    (a) => onglet === "tous" || a.statut === onglet
  );

  return (
    <>
      <div className="admin-bar">
        <span>S-Ex-ducation — Gérer les blogs</span>
        <div className="admin-bar-actions">
          <a href="/admin" className="btn btn-outline">
            ← Tableau de bord
          </a>
          <button className="btn btn-outline" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      <main className="wrap">
        <h1>Blogs</h1>

        <div className="admin-section">
          <h2>Coller un article déjà rédigé</h2>
          <p>
            Colle un texte au format Titre / Sous-titre / Résumé court /
            Catégorie / Signer avec / Contenu (comme ce que je te donne
            dans la conversation), et les champs ci-dessous se remplissent
            tout seuls.
          </p>
          <div className="admin-form">
            <textarea
              value={texteColle}
              onChange={(e) => setTexteColle(e.target.value)}
              style={{ minHeight: 160 }}
              placeholder={
                "**Titre**\nTon titre\n\n**Sous-titre**\n...\n\n**Résumé court**\n...\n\n**Catégorie**\nJe m'informe\n\n**Signer avec**\nStef\n\n**Contenu**\n..."
              }
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRemplirDepuisTexte}
            >
              Remplir les champs
            </button>
          </div>
        </div>

        <div className="admin-section">
          <h2>Écrire un article (publié immédiatement)</h2>
          <form onSubmit={handleCreerArticle} className="admin-form">
            <label>Photo de couverture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />

            <label>Titre (obligatoire)</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
            />

            <label>Sous-titre (optionnel)</label>
            <input
              type="text"
              value={sousTitre}
              onChange={(e) => setSousTitre(e.target.value)}
            />

            <label>Résumé court</label>
            <textarea
              value={extrait}
              onChange={(e) => setExtrait(e.target.value)}
            />
            <label>Contenu</label>
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
            <label>Signer avec (nom d&apos;auteur·e)</label>
            <input
              type="text"
              value={auteurNom}
              onChange={(e) => setAuteurNom(e.target.value)}
              placeholder="Stef"
            />
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Publication..." : "Publier l'article"}
            </button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Articles</h2>
          {error && <p className="admin-error">{error}</p>}
          <div className="onglets">
            {ONGLETS.map((o) => (
              <button
                key={o.valeur}
                className={`onglet ${onglet === o.valeur ? "actif" : ""}`}
                onClick={() => setOnglet(o.valeur)}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="post-list">
            {articlesAffiches.map((article) => (
              <div key={article.id} className="post-row contact-row">
                <div style={{ flex: 1 }}>
                  <div className="titre">{article.titre}</div>
                  {article.sous_titre && (
                    <p className="contact-message" style={{ fontStyle: "italic" }}>
                      {article.sous_titre}
                    </p>
                  )}
                  <p className="contact-message">
                    {article.auteur_nom || "Anonyme"}
                    {article.auteur_email ? ` · ${article.auteur_email}` : ""}
                  </p>
                  <span className={`badge ${article.statut === "publie" ? "publie" : "brouillon"}`}>
                    {BLOG_STATUTS[article.statut]}
                  </span>

                  {ouvert === article.id ? (
                    <div className="admin-section" style={{ marginTop: 16 }}>
                      {article.extrait && (
                        <p>
                          <strong>Résumé : </strong>
                          {article.extrait}
                        </p>
                      )}
                      <p style={{ whiteSpace: "pre-wrap" }}>{article.contenu}</p>

                      {article.image_couverture_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.image_couverture_url}
                          alt=""
                          className="preview"
                          style={{ maxWidth: 240 }}
                        />
                      )}

                      <div className="admin-form" style={{ marginTop: 12 }}>
                        <label>
                          Commentaire (pour &quot;à revoir&quot; ou
                          &quot;rejeté&quot;)
                        </label>
                        <textarea
                          value={commentaire}
                          onChange={(e) => setCommentaire(e.target.value)}
                          placeholder="Ex. Manque de sources, à raccourcir, etc."
                        />
                      </div>

                      <div className="row-actions" style={{ marginTop: 12 }}>
                        <button
                          className="btn btn-secondary"
                          disabled={actionEnCours}
                          onClick={() => handleChangerStatut(article, "publie")}
                        >
                          Accepter et publier
                        </button>
                        <button
                          className="btn btn-noir"
                          disabled={actionEnCours}
                          onClick={() =>
                            handleChangerStatut(article, "a_revoir")
                          }
                        >
                          Demander des révisions
                        </button>
                        <button
                          className="btn btn-outline"
                          disabled={actionEnCours}
                          onClick={() => handleChangerStatut(article, "rejete")}
                        >
                          Rejeter
                        </button>
                      </div>

                      {article.statut === "publie" && (
                        <a
                          href={`/admin?article=${article.id}`}
                          className="btn btn-primary"
                          style={{ marginTop: 12, display: "inline-block" }}
                        >
                          Créer un carousel pour cet article
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        setOuvert(article.id);
                        setCommentaire(article.commentaire_admin ?? "");
                      }}
                    >
                      Lire et relire
                    </button>
                  )}
                </div>
                <div className="row-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => handleSupprimer(article)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {articlesAffiches.length === 0 && (
              <p>Aucun article dans cette catégorie.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
