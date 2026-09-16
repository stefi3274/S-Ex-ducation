"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import {
  ENTREPRISE,
  CATEGORIES,
  estProgramme,
  formatDateHeure,
} from "@/lib/config";

export const dynamic = "force-dynamic";

type Entree = {
  id: string;
  titre: string;
  type: "Article" | "Carousel";
  statut: string;
  categorie: string | null;
  publier_le: string | null;
  created_at: string;
};

export default function AdminCalendrier() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);

  const [session, setSession] = useState<Session | null | undefined>(
    undefined
  );
  const [entrees, setEntrees] = useState<Entree[]>([]);

  const load = useCallback(async () => {
    const [posts, blogs] = await Promise.all([
      supabase
        .from("posts")
        .select("id, titre, statut, categorie, publier_le, created_at")
        .eq("entreprise", ENTREPRISE),
      supabase
        .from("blogs")
        .select("id, titre, statut, categorie, publier_le, created_at")
        .eq("entreprise", ENTREPRISE),
    ]);

    const tout: Entree[] = [
      ...((posts.data ?? []).map((p) => ({ ...p, type: "Carousel" as const }))),
      ...((blogs.data ?? []).map((b) => ({ ...b, type: "Article" as const }))),
    ];

    setEntrees(tout);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin/login");
        return;
      }
      setSession(data.session);
      load();
    });
  }, [router, load, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (session === undefined) return null;

  const programmees = entrees
    .filter((e) => estProgramme(e.statut, e.publier_le))
    .sort(
      (a, b) =>
        new Date(a.publier_le as string).getTime() -
        new Date(b.publier_le as string).getTime()
    );

  const publiees = entrees
    .filter((e) => e.statut === "publie" && !estProgramme(e.statut, e.publier_le))
    .sort(
      (a, b) =>
        new Date(b.publier_le ?? b.created_at).getTime() -
        new Date(a.publier_le ?? a.created_at).getTime()
    );

  const enAttenteRevue = entrees.filter(
    (e) => e.statut !== "publie" && e.statut !== "brouillon"
  );

  const brouillons = entrees.filter((e) => e.statut === "brouillon");

  function ligne(e: Entree) {
    const categorie = CATEGORIES.find((c) => c.slug === e.categorie);
    return (
      <div key={`${e.type}-${e.id}`} className="post-row">
        <div>
          <div className="titre">{e.titre}</div>
          <span className="badge badge-type">{e.type}</span>{" "}
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
          <a
            className="btn btn-outline"
            href={e.type === "Article" ? "/admin/blogs" : "/admin"}
          >
            Gérer
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-bar">
        <span>S-Ex-ducation — Calendrier</span>
        <div className="admin-bar-actions">
          <a href="/admin" className="btn btn-outline">
            Posts
          </a>
          <a href="/admin/blogs" className="btn btn-outline">
            Blogs
          </a>
          <button className="btn btn-outline" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </div>

      <main className="wrap">
        <h1>Calendrier</h1>
        <p>Tout ce qui est programmé, publié, en revue ou en brouillon.</p>

        <div className="admin-section">
          <h2>À venir ({programmees.length})</h2>
          <div className="post-list">
            {programmees.length === 0 && <p>Rien de programmé pour l&apos;instant.</p>}
            {programmees.map((e) => (
              <div key={`${e.type}-${e.id}`} className="post-row">
                <div>
                  <div className="titre">{e.titre}</div>
                  <span className="badge programme">
                    {formatDateHeure(e.publier_le as string)}
                  </span>{" "}
                  <span className="badge badge-type">{e.type}</span>{" "}
                  {CATEGORIES.find((c) => c.slug === e.categorie) && (
                    <span
                      className="badge-categorie"
                      style={{
                        background: CATEGORIES.find(
                          (c) => c.slug === e.categorie
                        )?.couleur,
                      }}
                    >
                      {CATEGORIES.find((c) => c.slug === e.categorie)?.nom}
                    </span>
                  )}
                </div>
                <div className="row-actions">
                  <a
                    className="btn btn-outline"
                    href={e.type === "Article" ? "/admin/blogs" : "/admin"}
                  >
                    Gérer
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {enAttenteRevue.length > 0 && (
          <div className="admin-section">
            <h2>En attente de revue ({enAttenteRevue.length})</h2>
            <div className="post-list">{enAttenteRevue.map(ligne)}</div>
          </div>
        )}

        <div className="admin-section">
          <h2>Déjà publiés ({publiees.length})</h2>
          <div className="post-list">{publiees.map(ligne)}</div>
        </div>

        {brouillons.length > 0 && (
          <div className="admin-section">
            <h2>Brouillons ({brouillons.length})</h2>
            <div className="post-list">{brouillons.map(ligne)}</div>
          </div>
        )}
      </main>
    </>
  );
}
