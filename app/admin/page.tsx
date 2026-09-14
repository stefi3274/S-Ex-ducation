"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { ENTREPRISE, SLIDE_LABELS, SLIDE_POSITIONS } from "@/lib/config";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Post = {
  id: string;
  titre: string;
  slug: string;
  statut: "brouillon" | "publie";
  created_at: string;
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

function slideDraftVide(): SlideDraft {
  return { titre: "", texte: "", file: null };
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);

  const [session, setSession] = useState<Session | null | undefined>(
    undefined
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [nouveauTitre, setNouveauTitre] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [slides, setSlides] = useState<Record<number, Slide | undefined>>({});
  const [drafts, setDrafts] = useState<Record<number, SlideDraft>>(
    Object.fromEntries(SLIDE_POSITIONS.map((p) => [p, slideDraftVide()]))
  );
  const [savingPosition, setSavingPosition] = useState<number | null>(null);

  const loadPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, titre, slug, statut, created_at")
      .eq("entreprise", ENTREPRISE)
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin/login");
        return;
      }
      setSession(data.session);
      loadPosts();
    });
  }, [router, loadPosts, supabase]);

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
      });

      if (insertError) throw insertError;

      setNouveauTitre("");
      await loadPosts();
    } catch (err) {
      setError("Impossible de créer le post. Le titre donne peut-être un slug déjà utilisé.");
    } finally {
      setCreating(false);
    }
  }

  async function loadSlides(post: Post) {
    setSelectedPost(post);
    const { data } = await supabase
      .from("slides")
      .select("id, post_id, position, titre, texte, image_url")
      .eq("post_id", post.id);

    const parPosition: Record<number, Slide | undefined> = {};
    const nouveauxDrafts: Record<number, SlideDraft> = Object.fromEntries(
      SLIDE_POSITIONS.map((p) => [p, slideDraftVide()])
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
    setDrafts((prev) => ({ ...prev, [position]: { ...prev[position], ...patch } }));
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

      const { error: upsertError } = await supabase
        .from("slides")
        .upsert(
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
      setError(`Impossible d'enregistrer le slide "${SLIDE_LABELS[position]}". Réessaie.`);
    } finally {
      setSavingPosition(null);
    }
  }

  async function handleTogglePublish(post: Post) {
    const nouveauStatut = post.statut === "publie" ? "brouillon" : "publie";
    await supabase.from("posts").update({ statut: nouveauStatut }).eq("id", post.id);
    await loadPosts();
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...post, statut: nouveauStatut });
    }
  }

  async function handleDeletePost(post: Post) {
    await supabase.from("posts").delete().eq("id", post.id);
    if (selectedPost?.id === post.id) {
      setSelectedPost(null);
    }
    await loadPosts();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (session === undefined) return null;

  return (
    <>
      <div className="admin-bar">
        <span>S-Ex-ducation — Admin</span>
        <button className="btn btn-outline" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>

      <main className="wrap">
        <h1>Nouveau post</h1>
        <form onSubmit={handleCreatePost} className="admin-form">
          <label>Titre du post</label>
          <input
            type="text"
            value={nouveauTitre}
            onChange={(e) => setNouveauTitre(e.target.value)}
            placeholder="Ex. Le consentement, ça veut dire quoi ?"
            required
          />
          {error && <p className="admin-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Création..." : "Créer le post"}
          </button>
        </form>

        <div className="admin-section">
          <h2>Tous les posts</h2>
          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id} className="post-row">
                <div>
                  <div className="titre">{post.titre}</div>
                  <span className={`badge ${post.statut}`}>
                    {post.statut === "publie" ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <div className="row-actions">
                  <button className="btn btn-secondary" onClick={() => loadSlides(post)}>
                    Modifier les slides
                  </button>
                  <button className="btn btn-noir" onClick={() => handleTogglePublish(post)}>
                    {post.statut === "publie" ? "Dépublier" : "Publier"}
                  </button>
                  <button className="btn btn-outline" onClick={() => handleDeletePost(post)}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p>Aucun post pour l&apos;instant.</p>}
          </div>
        </div>

        {selectedPost && (
          <div className="admin-section">
            <h2>Slides — {selectedPost.titre}</h2>
            <p>Format carré 1080×1080. 1 intro, 4 slides de contenu, 1 conclusion.</p>

            <div className="slide-editor-grid">
              {SLIDE_POSITIONS.map((position) => {
                const draft = drafts[position];
                const existant = slides[position];
                return (
                  <div key={position} className="slide-editor-card">
                    <h4>{SLIDE_LABELS[position]}</h4>

                    {existant?.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={existant.image_url}
                        alt={SLIDE_LABELS[position]}
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
          </div>
        )}
      </main>
    </>
  );
}
