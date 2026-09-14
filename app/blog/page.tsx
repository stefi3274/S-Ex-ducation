import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ENTREPRISE, couleurCategorie, nomCategorie } from "@/lib/config";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog — S-Ex-ducation",
};

type Article = {
  id: string;
  titre: string;
  sous_titre: string | null;
  slug: string;
  extrait: string | null;
  image_couverture_url: string | null;
  categorie: string | null;
  auteur_nom: string | null;
  created_at: string;
};

async function getArticles() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("blogs")
    .select(
      "id, titre, sous_titre, slug, extrait, image_couverture_url, categorie, auteur_nom, created_at"
    )
    .eq("entreprise", ENTREPRISE)
    .eq("statut", "publie")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur chargement articles publiés :", error.message);
  }

  return (data as Article[]) ?? [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <>
      <SiteHeader />
      <main className="wrap page-texte" style={{ maxWidth: 780 }}>
        <h1>Le blog</h1>
        <p>
          Des articles de fond sur le sexe, les relations et la santé, écrits
          avec sérieux et sans détour.
        </p>

        <div className="soumettre-bloc">
          <span>Envie d&apos;écrire pour nous ?</span>
          <Link href="/blog/proposer" className="btn btn-secondary">
            Proposer un article
          </Link>
        </div>

        {articles.length === 0 && (
          <p className="empty-state">Aucun article publié pour l&apos;instant.</p>
        )}

        <div className="blog-liste">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="blog-carte"
            >
              <div
                className="blog-carte-image"
                style={{
                  background: couleurCategorie(article.categorie),
                }}
              >
                {article.image_couverture_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.image_couverture_url}
                    alt={article.titre}
                  />
                )}
              </div>
              <div className="blog-carte-texte">
                {nomCategorie(article.categorie) && (
                  <span
                    className="badge-categorie"
                    style={{ background: couleurCategorie(article.categorie) }}
                  >
                    {nomCategorie(article.categorie)}
                  </span>
                )}
                <h2>{article.titre}</h2>
                {article.sous_titre && (
                  <p className="blog-sous-titre">{article.sous_titre}</p>
                )}
                {article.extrait && <p>{article.extrait}</p>}
                <span className="blog-meta">
                  {article.auteur_nom && `${article.auteur_nom} · `}
                  {formatDate(article.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
