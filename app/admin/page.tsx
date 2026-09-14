"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  ENTREPRISE,
  SLIDE_POSITIONS,
  CATEGORIES,
  TAILLES_CAROUSEL,
  positionsPourTaille,
  labelSlide,
} from "@/lib/config";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

type TypePost = "carousel" | "post";

type Post = {
  id: string;
  titre: string;
  slug: string;
  statut: "brouillon" | "publie";
  created_at: string;
  categorie: string | null;
  type: TypePost;
  nb_slides: number;
  article_id: string | null;
  sponsor_nom: string | null;
  sponsor_logo_url: string | null;
  sponsor_lien: string | null;
};

type Slide = {
  id: string;
  post_id: string;
  position: number;
  titre: string | null;
  texte: string | null;
  image_url: string | null;
};

type SlideDraft = {
  titre: string;
  texte: string;
  file: File | null;
};

type Contact = {
  id: string;
  nom: string | null;
  email: string;
  message: string;
  created_at: string;
  traite: boolean;
};

type ArticleDispo = {
  id: string;
  titre: string;
};

type Stats = {
  publies: number;
  brouillons: number;
  abonnes: number;
  messagesNonTraites: number;
};

function slideDraftVide(): SlideDraft {
  return { titre: "", texte: "", file: null };
}

function AdminDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabase(), []);

  const [session, setSession] = useState<Session | null | undefined>(
    undefined
  );

  const [stats, setStats] = useState<Stats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [voirContactsTraites, setVoirContactsTraites] = useState(false);
  const [articlesDisponibles, setArticlesDisponibles] = useState<
    ArticleDispo[]
  >([]);

  const [posts, setPosts] = useState<Post[]>([]);

  const [titreRapide, setTitreRapide] = useState("");
  const [categorieRapide, setCategorieRapide] = useState(CATEGORIES[0].slug);
  const [texteRapide, setTexteRapide] = useState("");
  const [publierRapide, setPublierRapide] = useState(true);
  const [creationRapide, setCreationRapide] = useState(false);
  const [erreurRapide, setErreurRapide] = useState<string | null>(null);
  const [succesRapide, setSuccesRapide] = useState<string | null>(null);

  const [nouveauTitre, setNouveauTitre] = useState("");
  const [nouvelleCategorie, setNouvelleCategorie] = useState(
    CATEGORIES[0].slug
  );
  const [nouveauType, setNouveauType] = useState<TypePost>("carousel");
  const [nouveauNbSlides, setNouveauNbSlides] = useState(6);
  const [aUnArticle, setAUnArticle] = useState(false);
  const [articleSelectionne, setArticleSelectionne] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [slides, setSlides] = useState<Record<number, Slide | undefined>>({});
  const [drafts, setDrafts] = useState<Record<number, SlideDraft>>(
    Object.fromEntries(SLIDE_POSITIONS.map((p) => [p, slideDraftVide()]))
  );
  const [savingPosition, setSavingPosition] = useState<number | null>(null);
  const [texteColle, setTexteColle] = useState("");
  const [enregistrementGroupe, setEnregistrementGroupe] = useState(false);

  const [sponsorNom, setSponsorNom] = useState("");
  const [sponsorLien, setSponsorLien] = useState("");
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [sponsorSaving, setSponsorSaving] = useState(false);

  const positionsActives =
    selectedPost?.type === "post"
      ? [0]
      : positionsPourTaille(selectedPost?.nb_slides ?? 6);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select(
        "id, titre, slug, statut, created_at, categorie, type, nb_slides, article_id, sponsor_nom, sponsor_logo_url, sponsor_lien"
      )
      .eq("entreprise", ENTREPRISE)
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
  }, [supabase]);

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from("blogs")
      .select("id, titre")
      .eq("entreprise", ENTREPRISE)
      .eq("statut", "publie")
      .order("created_at", { ascending: false });
    setArticlesDisponibles((data as ArticleDispo[]) ?? []);
  }, [supabase]);

  const loadContacts = useCallback(async () => {
    const { data } = await supabase
      .from("contacts")
      .select("id, nom, email, message, created_at, traite")
      .eq("entreprise", ENTREPRISE)
      .order("created_at", { ascending: false })
      .limit(30);
    setContacts((data as Contact[]) ?? []);
  }, [supabase]);

  const loadStats = useCallback(async () => {
    const [publies, brouillons, abonnes, messagesNonTraites] =
      await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("entreprise", ENTREPRISE)
          .eq("statut", "publie"),
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("entreprise", ENTREPRISE)
          .eq("statut", "brouillon"),
        supabase
          .from("abonnes")
          .select("id", { count: "exact", head: true })
          .eq("entreprise", ENTREPRISE),
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("entreprise", ENTREPRISE)
          .eq("traite", false),
      ]);

    setStats({
      publies: publies.count ?? 0,
      brouillons: brouillons.count ?? 0,
      abonnes: abonnes.count ?? 0,
      messagesNonTraites: messagesNonTraites.count ?? 0,
    });
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin/login");
        return;
      }
      setSession(data.session);
      loadPosts();
      loadContacts();
      loadStats();
      loadArticles();

      const articleDepuisUrl = searchParams.get("article");
      if (articleDepuisUrl) {
        setAUnArticle(true);
        setArticleSelectionne(articleDepuisUrl);
        setNouveauType("carousel");
      }
    });
  }, [router, loadPosts, loadContacts, loadStats, loadArticles, searchParams, supabase]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nouveauTitre.trim()) return;

    setCreating(true);
    try {
      const slug = slugify(nouveauTitre) || `post-${Date.now()}`;

      const { error: insertError } = await supabase.from("posts").insert({
        entreprise: ENTREPRISE,
        titre: nouveauTitre.trim(),
        slug,
        statut: "brouillon",
        categorie: nouvelleCategorie,
        type: nouveauType,
        nb_slides: nouveauNbSlides,
        article_id: aUnArticle && articleSelectionne ? articleSelectionne : null,
      });

      if (insertError) throw insertError;

      setNouveauTitre("");
      setAUnArticle(false);
      setArticleSelectionne("");
      await loadPosts();
      await loadStats();
    } catch (err) {
      setError(
        "Impossible de créer le post. Le titre donne peut-être un slug déjà utilisé."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCreerCarouselRapide(e: React.FormEvent) {
    e.preventDefault();
    setErreurRapide(null);
    setSuccesRapide(null);

    const blocs = texteRapide
      .split(/\n-{3,}\n/)
      .map((bloc) => bloc.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (blocs.length < 2) {
      setErreurRapide(
        "Colle au moins 2 blocs de texte, séparés par une ligne de tirets (---)."
      );
      return;
    }

    const titre =
      titreRapide.trim() || blocs[0].split("\n")[0].trim().slice(0, 80);

    setCreationRapide(true);

    try {
      const slug = `${slugify(titre)}-${Date.now().toString().slice(-5)}`;

      const { data: nouveauPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          entreprise: ENTREPRISE,
          titre,
          slug,
          statut: publierRapide ? "publie" : "brouillon",
          categorie: categorieRapide,
          type: "carousel",
          nb_slides: blocs.length,
        })
        .select("id, slug")
        .single();

      if (insertError) throw insertError;

      const slidesAInserer = blocs.map((bloc, position) => {
        const lignes = bloc.split("\n");
        return {
          post_id: nouveauPost.id,
          position,
          titre: lignes[0]?.trim() || null,
          texte: lignes.slice(1).join("\n").trim() || null,
          image_url: null,
        };
      });

      const { error: slidesError } = await supabase
        .from("slides")
        .insert(slidesAInserer);

      if (slidesError) throw slidesError;

      setSuccesRapide(
        publierRapide
          ? `Carousel publié : /post/${nouveauPost.slug}`
          : `Carousel créé en brouillon. Publie-le depuis la liste ci-dessous quand tu es prêt·e.`
      );
      setTitreRapide("");
      setTexteRapide("");
      await loadPosts();
      await loadStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setErreurRapide(
        `Impossible de créer le carousel.${message ? ` (${message})` : ""}`
      );
    } finally {
      setCreationRapide(false);
    }
  }

  async function loadSlides(post: Post) {
    setSelectedPost(post);
    setSponsorNom(post.sponsor_nom ?? "");
    setSponsorLien(post.sponsor_lien ?? "");
    setSponsorFile(null);
    setTexteColle("");

    const positions =
      post.type === "post" ? [0] : positionsPourTaille(post.nb_slides ?? 6);

    const { data } = await supabase
      .from("slides")
      .select("id, post_id, position, titre, texte, image_url")
      .eq("post_id", post.id);

    const parPosition: Record<number, Slide | undefined> = {};
    const nouveauxDrafts: Record<number, SlideDraft> = Object.fromEntries(
      positions.map((p) => [p, slideDraftVide()])
    );

    ((data as Slide[]) ?? []).forEach((slide) => {
      parPosition[slide.position] = slide;
      nouveauxDrafts[slide.position] = {
        titre: slide.titre ?? "",
        texte: slide.texte ?? "",
        file: null,
      };
    });

    setSlides(parPosition);
    setDrafts(nouveauxDrafts);
  }

  function updateDraft(position: number, patch: Partial<SlideDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [position]: { ...prev[position], ...patch },
    }));
  }

  async function handleSaveSlide(position: number) {
    if (!selectedPost) return;
    setSavingPosition(position);
    setError(null);

    try {
      const draft = drafts[position];
      const existant = slides[position];
      let image_url = existant?.image_url ?? null;

      if (draft.file) {
        const path = `${selectedPost.id}/${position}-${Date.now()}-${draft.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("sexed")
          .upload(path, draft.file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("sexed").getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const { error: upsertError } = await supabase.from("slides").upsert(
        {
          post_id: selectedPost.id,
          position,
          titre: draft.titre || null,
          texte: draft.texte || null,
          image_url,
        },
        { onConflict: "post_id,position" }
      );

      if (upsertError) throw upsertError;

      await loadSlides(selectedPost);
    } catch (err) {
      setError(
        `Impossible d'enregistrer le slide "${labelSlide(
          position,
          selectedPost.nb_slides ?? 6
        )}". Réessaie.`
      );
    } finally {
      setSavingPosition(null);
    }
  }

  function handleGenererSlides() {
    const blocs = texteColle
      .split(/\n-{3,}\n/)
      .map((bloc) => bloc.trim())
      .filter(Boolean);

    setDrafts((prev) => {
      const copie = { ...prev };
      positionsActives.forEach((position, index) => {
        const bloc = blocs[index];
        if (!bloc) return;
        const lignes = bloc.split("\n");
        const titre = lignes[0]?.trim() ?? "";
        const texte = lignes.slice(1).join("\n").trim();
        copie[position] = { ...copie[position], titre, texte };
      });
      return copie;
    });
  }

  async function handleEnregistrerTousLesTextes() {
    setEnregistrementGroupe(true);
    for (const position of positionsActives) {
      await handleSaveSlide(position);
    }
    setEnregistrementGroupe(false);
  }

  async function handleChangerCategorie(categorie: string) {
    if (!selectedPost) return;
    await supabase
      .from("posts")
      .update({ categorie })
      .eq("id", selectedPost.id);
    setSelectedPost({ ...selectedPost, categorie });
    await loadPosts();
  }

  async function handleSaveSponsor() {
    if (!selectedPost) return;
    setSponsorSaving(true);
    setError(null);

    try {
      let sponsor_logo_url = selectedPost.sponsor_logo_url;

      if (sponsorFile) {
        const path = `${selectedPost.id}/sponsor-${Date.now()}-${sponsorFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("sexed")
          .upload(path, sponsorFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("sexed").getPublicUrl(path);
        sponsor_logo_url = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("posts")
        .update({
          sponsor_nom: sponsorNom || null,
          sponsor_lien: sponsorLien || null,
          sponsor_logo_url,
        })
        .eq("id", selectedPost.id);

      if (updateError) throw updateError;

      setSponsorFile(null);
      await loadPosts();
      setSelectedPost({
        ...selectedPost,
        sponsor_nom: sponsorNom || null,
        sponsor_lien: sponsorLien || null,
        sponsor_logo_url,
      });
    } catch (err) {
      setError("Impossible d'enregistrer le sponsor. Réessaie.");
    } finally {
      setSponsorSaving(false);
    }
  }

  async function handleTogglePublish(post: Post) {
    setError(null);
    const nouveauStatut = post.statut === "publie" ? "brouillon" : "publie";

    const { data, error: updateError } = await supabase
      .from("posts")
      .update({ statut: nouveauStatut })
      .eq("id", post.id)
      .select("id, statut");

    if (updateError) {
      setError(
        `Impossible de ${
          nouveauStatut === "publie" ? "publier" : "dépublier"
        } "${post.titre}" : ${updateError.message}`
      );
      return;
    }

    if (!data || data.length === 0) {
      setError(
        `Le changement n'a pas été enregistré pour "${post.titre}". Vérifie que ton compte admin est bien rattaché à l'entreprise "${ENTREPRISE}" dans la table admins.`
      );
      return;
    }

    await loadPosts();
    await loadStats();
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, statut: nouveauStatut });
    }
  }

  async function handleDeletePost(post: Post) {
    setError(null);
    const { data, error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id)
      .select("id");

    if (deleteError) {
      setError(`Impossible de supprimer "${post.titre}" : ${deleteError.message}`);
      return;
    }

    if (!data || data.length === 0) {
      setError(
        `"${post.titre}" n'a pas été supprimé. Vérifie que ton compte admin est bien rattaché à "${ENTREPRISE}".`
      );
      return;
    }

    if (selectedPost?.id === post.id) {
      setSelectedPost(null);
    }
    await loadPosts();
    await loadStats();
  }

  async function handleToggleContactTraite(contact: Contact) {
    await supabase
      .from("contacts")
      .update({ traite: !contact.traite })
      .eq("id", contact.id);
    await loadContacts();
    await loadStats();
  }

  async function handleDeleteContact(contact: Contact) {
    await supabase.from("contacts").delete().eq("id", contact.id);
    await loadContacts();
    await loadStats();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (session === undefined) return null;

  const contactsAffiches = contacts.filter(
    (c) => voirContactsTraites || !c.traite
  );

  return (
    <>
      <div className="admin-bar">
        <span>S-Ex-ducation — Admin</span>
        <div className="admin-bar-actions">
          <a href="/admin/blogs" className="btn btn-outline">
            Gérer les blogs
          </a>
          <button className="btn btn-outline" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      <main className="wrap">
        <h1>Tableau de bord</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-nombre">{stats?.publies ?? "…"}</span>
            <span className="stat-label">Posts publiés</span>
          </div>
          <div className="stat-card">
            <span className="stat-nombre">{stats?.brouillons ?? "…"}</span>
            <span className="stat-label">Brouillons</span>
          </div>
          <div className="stat-card">
            <span className="stat-nombre">{stats?.abonnes ?? "…"}</span>
            <span className="stat-label">Abonnés newsletter</span>
          </div>
          <div className="stat-card">
            <span className="stat-nombre">
              {stats?.messagesNonTraites ?? "…"}
            </span>
            <span className="stat-label">Messages à traiter</span>
          </div>
        </div>

        <div className="carousel-rapide">
          <h2>Carousel rapide</h2>
          <p>Colle un texte, tu as un carousel. Le plus simple possible.</p>

          <form onSubmit={handleCreerCarouselRapide} className="admin-form">
            <label>Titre (optionnel — sinon pris sur le premier slide)</label>
            <input
              type="text"
              value={titreRapide}
              onChange={(e) => setTitreRapide(e.target.value)}
              placeholder="Ex. Rejoins la communauté"
            />

            <label>Catégorie</label>
            <select
              value={categorieRapide}
              onChange={(e) => setCategorieRapide(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nom}
                </option>
              ))}
            </select>

            <label>Texte du carousel</label>
            <textarea
              value={texteRapide}
              onChange={(e) => setTexteRapide(e.target.value)}
              style={{ minHeight: 200 }}
              placeholder={
                "Titre du slide 1\nTexte du slide 1\n---\nTitre du slide 2\nTexte du slide 2\n---\n..."
              }
              required
            />
            <p className="aide-texte">
              Sépare chaque slide par une ligne de tirets (---). Entre 2 et
              12 blocs. Première ligne de chaque bloc = titre du slide, le
              reste = texte. Le nombre de slides est déduit automatiquement.
              Tu pourras ajouter des images ensuite dans &quot;Modifier les
              slides&quot;.
            </p>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={publierRapide}
                onChange={(e) => setPublierRapide(e.target.checked)}
              />{" "}
              Publier tout de suite (sinon enregistré en brouillon)
            </label>

            {erreurRapide && <p className="admin-error">{erreurRapide}</p>}
            {succesRapide && <p className="form-success">{succesRapide}</p>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={creationRapide}
            >
              {creationRapide ? "Création..." : "Créer le carousel"}
            </button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Nouveau post</h2>
          <form onSubmit={handleCreatePost} className="admin-form">
            <label>Titre du post</label>
            <input
              type="text"
              value={nouveauTitre}
              onChange={(e) => setNouveauTitre(e.target.value)}
              placeholder="Ex. Le consentement, ça veut dire quoi ?"
              required
            />
            <label>Catégorie</label>
            <select
              value={nouvelleCategorie}
              onChange={(e) => setNouvelleCategorie(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nom}
                </option>
              ))}
            </select>
            <label>Format</label>
            <select
              value={nouveauType}
              onChange={(e) => setNouveauType(e.target.value as TypePost)}
            >
              <option value="carousel">Carousel</option>
              <option value="post">Post simple (1 slide)</option>
            </select>

            {nouveauType === "carousel" && (
              <>
                <label>Nombre de slides</label>
                <select
                  value={nouveauNbSlides}
                  onChange={(e) =>
                    setNouveauNbSlides(Number(e.target.value))
                  }
                >
                  {TAILLES_CAROUSEL.map((n) => (
                    <option key={n} value={n}>
                      {n} slides
                    </option>
                  ))}
                </select>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={aUnArticle}
                    onChange={(e) => setAUnArticle(e.target.checked)}
                  />{" "}
                  Ce carousel a un article de blog associé ?
                </label>

                {aUnArticle && (
                  <>
                    <label>Article lié</label>
                    <select
                      value={articleSelectionne}
                      onChange={(e) => setArticleSelectionne(e.target.value)}
                      required
                    >
                      <option value="">Choisir un article publié...</option>
                      {articlesDisponibles.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.titre}
                        </option>
                      ))}
                    </select>
                    {articlesDisponibles.length === 0 && (
                      <p className="aide-texte">
                        Aucun article publié pour l&apos;instant. Publie
                        d&apos;abord un article dans Gérer les blogs.
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {error && <p className="admin-error">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? "Création..." : "Créer le post"}
            </button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Tous les posts</h2>
          <div className="post-list">
            {posts.map((post) => {
              const categorie = CATEGORIES.find(
                (c) => c.slug === post.categorie
              );
              return (
                <div key={post.id} className="post-row">
                  <div>
                    <div className="titre">{post.titre}</div>
                    <span className={`badge ${post.statut}`}>
                      {post.statut === "publie" ? "Publié" : "Brouillon"}
                    </span>{" "}
                    <span className="badge badge-type">
                      {post.type === "post"
                        ? "Post simple"
                        : `Carousel ${post.nb_slides ?? 6}`}
                    </span>{" "}
                    {post.article_id && (
                      <span className="badge badge-type">Lié à un article</span>
                    )}{" "}
                    {categorie && (
                      <span
                        className="badge-categorie"
                        style={{ background: categorie.couleur }}
                      >
                        {categorie.nom}
                      </span>
                    )}
                  </div>
                  <div className="row-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => loadSlides(post)}
                    >
                      Modifier les slides
                    </button>
                    <button
                      className="btn btn-noir"
                      onClick={() => handleTogglePublish(post)}
                    >
                      {post.statut === "publie" ? "Dépublier" : "Publier"}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleDeletePost(post)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
            {posts.length === 0 && <p>Aucun post pour l&apos;instant.</p>}
          </div>
        </div>

        {selectedPost && (
          <div className="admin-section">
            <h2>Slides — {selectedPost.titre}</h2>
            <p>
              {selectedPost.type === "post"
                ? "Post simple : un seul slide."
                : `Carousel de ${selectedPost.nb_slides ?? 6} slides : intro, slides de contenu, puis outro.`}{" "}
              Format carré 1080×1080.
            </p>

            <div className="admin-form" style={{ maxWidth: 320 }}>
              <label>Catégorie de ce post</label>
              <select
                value={selectedPost.categorie ?? CATEGORIES[0].slug}
                onChange={(e) => handleChangerCategorie(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="generateur-texte">
              <label>
                Coller un texte pour générer les slides automatiquement
              </label>
              <p className="aide-texte">
                Sépare chaque slide par une ligne de tirets (---). Première
                ligne du bloc = titre, le reste = texte. Les guillemets («
                » ou &quot; &quot;) ressortent automatiquement en couleur.
                Entoure un exemple, un mot en italique ou un nom de
                personnalité d&apos;astérisques (*comme ça*) pour qu&apos;il
                ressorte aussi.
              </p>
              <textarea
                value={texteColle}
                onChange={(e) => setTexteColle(e.target.value)}
                placeholder={
                  "Titre de l'intro\nTexte de l'intro\n---\nTitre du sujet 1\nTexte du sujet 1"
                }
              />
              <div className="row-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGenererSlides}
                >
                  Générer les slides
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={enregistrementGroupe}
                  onClick={handleEnregistrerTousLesTextes}
                >
                  {enregistrementGroupe
                    ? "Enregistrement..."
                    : "Enregistrer tous les textes"}
                </button>
              </div>
            </div>

            <div className="slide-editor-grid">
              {positionsActives.map((position) => {
                const draft = drafts[position];
                const existant = slides[position];
                const label =
                  selectedPost.type === "post"
                    ? "Contenu du post"
                    : labelSlide(position, selectedPost.nb_slides ?? 6);
                return (
                  <div key={position} className="slide-editor-card">
                    <h4>{label}</h4>

                    {existant?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={existant.image_url}
                        alt={label}
                        className="preview"
                      />
                    )}

                    <div className="admin-form">
                      <input
                        type="text"
                        placeholder="Titre du slide"
                        value={draft.titre}
                        onChange={(e) =>
                          updateDraft(position, { titre: e.target.value })
                        }
                      />
                      <textarea
                        placeholder="Texte du slide"
                        value={draft.texte}
                        onChange={(e) =>
                          updateDraft(position, { texte: e.target.value })
                        }
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          updateDraft(position, {
                            file: e.target.files?.[0] ?? null,
                          })
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingPosition === position}
                        onClick={() => handleSaveSlide(position)}
                      >
                        {savingPosition === position
                          ? "Enregistrement..."
                          : "Enregistrer ce slide"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="admin-section">
              <h3>Sponsor / produit (optionnel)</h3>
              <p>Affiché sous le carousel sur la page publique du post.</p>
              <div className="admin-form">
                {selectedPost.sponsor_logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedPost.sponsor_logo_url}
                    alt="Logo sponsor actuel"
                    className="preview"
                    style={{ maxWidth: 160 }}
                  />
                )}
                <label>Nom du sponsor ou du produit</label>
                <input
                  type="text"
                  value={sponsorNom}
                  onChange={(e) => setSponsorNom(e.target.value)}
                  placeholder="Ex. Nom de la marque"
                />
                <label>Lien (optionnel)</label>
                <input
                  type="text"
                  value={sponsorLien}
                  onChange={(e) => setSponsorLien(e.target.value)}
                  placeholder="https://..."
                />
                <label>Logo (optionnel)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSponsorFile(e.target.files?.[0] ?? null)
                  }
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={sponsorSaving}
                  onClick={handleSaveSponsor}
                >
                  {sponsorSaving ? "Enregistrement..." : "Enregistrer le sponsor"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="admin-section">
          <h2>Messages de contact</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={voirContactsTraites}
              onChange={(e) => setVoirContactsTraites(e.target.checked)}
            />{" "}
            Afficher aussi les messages traités
          </label>

          <div className="post-list">
            {contactsAffiches.map((contact) => (
              <div key={contact.id} className="post-row contact-row">
                <div>
                  <div className="titre">
                    {contact.nom || "Sans nom"} — {contact.email}
                  </div>
                  <p className="contact-message">{contact.message}</p>
                  <span className={`badge ${contact.traite ? "publie" : "brouillon"}`}>
                    {contact.traite ? "Traité" : "À traiter"}
                  </span>
                </div>
                <div className="row-actions">
                  <button
                    className="btn btn-noir"
                    onClick={() => handleToggleContactTraite(contact)}
                  >
                    {contact.traite ? "Marquer à traiter" : "Marquer traité"}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleDeleteContact(contact)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {contactsAffiches.length === 0 && (
              <p>Aucun message pour l&apos;instant.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardInner />
    </Suspense>
  );
}
